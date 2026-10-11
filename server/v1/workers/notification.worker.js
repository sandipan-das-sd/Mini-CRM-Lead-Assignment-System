const { Worker } = require('bullmq');
const IORedis = require('ioredis');
const env = require('../config/env');
const { sendTemplateEmail } = require('../services/email.service');

const connection = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });

const worker = new Worker(
  'notifications',
  async (job) => {
    if (job.name !== 'send-email') throw new Error(`Unsupported job: ${job.name}`);
    await sendTemplateEmail(job.data);
    console.log(`Email job ${job.id} sent using ${job.data.template}`);
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
