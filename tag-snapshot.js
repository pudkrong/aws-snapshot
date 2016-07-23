#!/usr/bin/env node

const AWS = require('aws-sdk');
const _ = require('lodash');

// Configure AWS region
AWS.config.region = 'ap-southeast-1';

// Instantiate ec2 w/ specific API version
const ec2 = new AWS.EC2({apiVersion: '2016-04-01'});

const tagSnapshot = function(snapshot_id, tags) {
  let addingTags = _.concat([], tags);

  const params = {
    Resources: [
      snapshot_id
    ],
    Tags: addingTags,
    DryRun: false
  };

  ec2.createTags(params, function(err, data) {
    if (err)
      console.log(err, err.stack);
    else
      console.log("Successfully added tags to " + snapshot_id);
  });
}

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
    const snapshot_ids = _.map(data.Snapshots, 'SnapshotId');
    _.each(snapshot_ids, (snapshot_id) => {
      tagSnapshot(snapshot_id, [ { Key: 'Retention', Value: '0.0001' }]);
    });
  }
});
