const { Worker } = require('bullmq');
const IORedis = require('ioredis');
const env = require('../config/env');

const connection = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });

const worker = new Worker(
  'notifications',
  async (job) => {
    if (job.name === 'lead-assigned') {
      // Replace this log with an email/SMS provider without slowing the API request.
      console.log('Assignment notification processed', job.data);
    }
  },
  { connection, concurrency: 5 },
);

worker.on('failed', (job, error) => {
  console.error(`Notification job ${job?.id} failed:`, error.message);
});

async function shutdown() {
  await worker.close();
  connection.disconnect();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
