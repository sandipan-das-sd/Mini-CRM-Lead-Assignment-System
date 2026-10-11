const { Queue } = require('bullmq');
const IORedis = require('ioredis');
const env = require('../config/env');

let connection;
let notificationQueue;

function getQueue() {
  if (!notificationQueue) {
    connection = new IORedis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      connectTimeout: 500,
      retryStrategy: () => null,
    });
    notificationQueue = new Queue('notifications', { connection });
  }
  return notificationQueue;
}

async function enqueueEmail({ to, template, data }) {
  try {
    const recipients = Array.isArray(to) ? to.filter(Boolean) : [to].filter(Boolean);
    if (!recipients.length) return false;
    await getQueue().add(
      'send-email',
      { to: recipients, template, data },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    );
    return true;
  } catch (error) {
    // Business data is already committed; email failure must not corrupt CRM state.
    console.error('Unable to enqueue email:', error.message);
    return false;
  }
}

const enqueueAssignmentNotification = (data) =>
  enqueueEmail({
    to: data.recipientEmail,
    template: 'leadAssigned',
    data,
  });

async function closeJobQueue() {
  if (notificationQueue) await notificationQueue.close();
  if (connection) connection.disconnect();
}

module.exports = { enqueueEmail, enqueueAssignmentNotification, closeJobQueue };
