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
    notificationQueue = new Queue('notifications', 
      { connection }
    );
  }
  return notificationQueue;
}

async function enqueueAssignmentNotification(data) {
  try {
    await getQueue().add('lead-assigned', data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: 100,
      removeOnFail: 500,
    });
    return true;
  } catch (error) {
    // Assignment is already committed; notification failure must not corrupt CRM state.
    console.error('Unable to enqueue assignment notification:', error.message);
    return false;
  }
}

async function closeJobQueue() {
  if (notificationQueue) 
    await notificationQueue.close();
  if (connection) 
    connection.disconnect();
}

module.exports = { enqueueAssignmentNotification, closeJobQueue };
