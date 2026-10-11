const { createClient } = require('redis');
const env = require('./env');

const client = createClient({
  url: env.REDIS_URL,
  socket: { connectTimeout: 500, reconnectStrategy: false },
});
let connectionPromise;

client.on('error', (error) => {
  console.error('Redis error:', error.message);
});

async function getRedis() {
  if (client.isReady) return client;
  if (!connectionPromise) {
    connectionPromise = client.connect().catch((error) => {
      connectionPromise = undefined;
      throw error;
    });
  }
  await connectionPromise;
  return client;
}

async function closeRedis() {
  if (client.isOpen) await client.quit();
}

module.exports = { getRedis, closeRedis };
