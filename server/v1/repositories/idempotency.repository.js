const pool = require('../db/connection/pool');

async function find(userId, operation, key, db = pool) {
  const [rows] = await db.execute(
    'SELECT * FROM idempotency_requests WHERE user_id = ? AND operation = ? AND idempotency_key = ? LIMIT 1',
    [userId, operation, key],
  );
  return rows[0] || null;
}

async function reserve({ userId, operation, key, requestHash }, db = pool) {
  await db.execute(
    `INSERT INTO idempotency_requests (user_id, operation, idempotency_key, request_hash, status)
     VALUES (?, ?, ?, ?, 'processing')`,
    [userId, operation, key, requestHash],
  );
}

async function complete({ userId, operation, key, statusCode, responseBody }, db = pool) {
  await db.execute(
    `UPDATE idempotency_requests 
    SET status = 'completed', 
    response_status = ?,
     response_body = ?, 
     completed_at = CURRENT_TIMESTAMP
     WHERE user_id = ? 
     AND operation = ? 
     AND idempotency_key = ?`,
    [statusCode, JSON.stringify(responseBody), userId, operation, key],
  );
}

module.exports = { find, reserve, complete };
