#!/usr/bin/env node

const AWS = require('aws-sdk');
const _ = require('lodash');

// Configure AWS region
AWS.config.region = 'ap-southeast-1';

// Instantiate ec2 w/ specific API version
const ec2 = new AWS.EC2({apiVersion: '2016-04-01'});

const deleteSnapshot = function(snapshot_id) {
  const snapshot_params = {
    SnapshotId: snapshot_id,
    DryRun: false
  };

  ec2.deleteSnapshot(snapshot_params, function(err, data) {
    if (err)
      console.log(err, err.stack);
    else {
      console.log("Successfully deleted " + snapshot_id);
    }
  });
}

const getExpired = function(snapshot) {
  // Check if Date Created + Retention < Date Created
  const msInDay = 1000 * 60 * 60 * 24;
  const mappings = _.keyBy(snapshot.Tags, 'Key');
  const retention = mappings['Retention'].Value;

  return new Date(new Date(snapshot.StartTime).getTime() + (parseFloat(retention) * msInDay)) < new Date()
}

const run = function() {
  // Query EBS volumes tagged "backup"
  const params = {
    DryRun: false,
    Filters: [
      {
        Name: 'tag-key',
        Values: [
          'Retention'
        ]
      }
    ]
  };


  ec2.describeSnapshots(params, function(err, data) {
    if (err) {
      console.log(err, err.stack);
    } else {
      const expired_snapshots = _.filter(data.Snapshots, getExpired);
      const expired_snapshot_ids = _.map(expired_snapshots, 'SnapshotId');
      _.map(expired_snapshot_ids, deleteSnapshot);
    }
  });
}

module.exports = run;
