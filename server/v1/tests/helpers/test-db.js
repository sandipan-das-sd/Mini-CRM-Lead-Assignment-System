const pool = require('../../db/connection/pool');
const { hashPassword } = require('../../utils/password');
const { closeRedis } = require('../../config/redis');
const { closeJobQueue } = require('../../services/job-queue.service');

async function resetDatabase() {
  await pool.query('SET FOREIGN_KEY_CHECKS = 0');
  for (const table of [
    'notifications',
    'reassignment_requests',
    'idempotency_requests',
    'activities',
    'assignments',
    'leads',
    'users',
  ]) {
    await pool.query(`TRUNCATE TABLE ${table}`);
  }
  await pool.query('SET FOREIGN_KEY_CHECKS = 1');
}

async function createUser({ name, email, role = 'sales' }) {
  const passwordHash = await hashPassword('TestingPass123');
  const [result] = await pool.execute(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    [name, email, passwordHash, role],
  );
  return { id: result.insertId, name, email, role };
}

async function count(table) {
  const [rows] = await pool.query(`SELECT COUNT(*) AS total FROM ${table}`);
  return Number(rows[0].total);
}

async function closeTestConnections() {
  await closeJobQueue();
  await closeRedis();
  await pool.end();
}

module.exports = { pool, resetDatabase, createUser, count, closeTestConnections };
