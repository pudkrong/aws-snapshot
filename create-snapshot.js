#!/usr/bin/env node

const AWS = require('aws-sdk');
const _ = require('lodash');

// Set retention time for backups (in days)
const MAX_RETENTION = 3

// Configure AWS region
AWS.config.region = 'ap-southeast-1';

// Instantiate ec2 instance w/ specific API version
const ec2 = new AWS.EC2({apiVersion: '2016-04-01'});

const tagSnapshot = function(snapshot_id, tags) {
  let addingTags = _.concat([], tags,
    { Key: 'Retention', Value: MAX_RETENTION + '' },
    { Key: 'CreatedBy', Value: 'Lamda' }
  );

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

const makeSnapshot = function(volume) {
  const created = new Date().toISOString();
  const mappings = _.keyBy(volume.Tags, 'Key');
  const tagsHash = _.pick(mappings, ['Type', 'Customer', 'Instance']);
  const customer = tagsHash.Customer.Value;
  const type = tagsHash.Type.Value;
  const tags = _.concat(_.values(tagsHash),
    { Key: 'Created', Value: created },
    { Key: 'Name', Value: customer + '-' + type }
  );
  const desc = customer + ' => Backup of ' + type + ' (' + volume.VolumeId + ') at ' + created;

  const snapshot_params = {
    VolumeId: volume.VolumeId, /* required */
    Description: desc,
    DryRun: false
  };

  ec2.createSnapshot(snapshot_params, function(err, data) {
    if (err)
      console.log(err, err.stack);
    else {
      console.log("Successfully created snapshot => " + desc);
      tagSnapshot(data.SnapshotId, tags);
    }
  });
}

const run = function() {
  // Query EBS volumes tagged "backup"
  const params = {
    DryRun: false,
    Filters: [
      {
        Name: 'tag:Type',
        Values: [
          'db',
          'kms',
        ]
      }
    ]
  };

  ec2.describeVolumes(params, function(err, data) {
    if (err)
      console.log(err, err.stack);
    else
      // Create snapshot of volume
      _.map(data.Volumes, makeSnapshot);
  });
}

module.exports = run;
