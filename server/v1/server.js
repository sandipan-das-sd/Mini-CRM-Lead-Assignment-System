const app = require('./app');
const env = require('./config/env');
const pool = require('./db/connection/pool');
const { closeRedis } = require('./config/redis');
const { closeJobQueue } = require('./services/job-queue.service');
const http = require('node:http');
const { initializeSocket } = require('./realtime/socket');

let server;
async function start() {
  await pool.query('SELECT 1');
  server = http.createServer(app);
  initializeSocket(server);
  server.listen(env.PORT, () => console.log(`API listening on http://localhost:${env.PORT}`));
}

async function shutdown(signal) {
  console.log(`${signal} received; shutting down`);
  if (server) await new Promise((resolve) => server.close(resolve));
  await closeJobQueue();
  await closeRedis();
  await pool.end();
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
start().catch((error) => {
  console.error('Unable to start API', error);
  process.exit(1);
});
