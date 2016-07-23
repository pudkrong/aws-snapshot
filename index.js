const CronJob = require('cron').CronJob;
const CreateSnapshot  = require('./create-snapshot');
const CleanSnapshot = require('./clean-snapshot');

new CronJob('0 */5 * * * *', function() {
  CreateSnapshot();
  CleanSnapshot();
}, null, true);

console.log('Cron job is started');
