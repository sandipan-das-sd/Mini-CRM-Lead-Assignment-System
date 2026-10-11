const pool = require('../db/connection/pool');

async function create(input, db = pool) {
  const [result] = await db.execute(
    `INSERT INTO notifications (user_id, type, title, message, lead_id)
     VALUES (?, ?, ?, ?, ?)`,
    [input.userId, input.type, input.title, input.message, input.leadId || null],
  );
  return findById(result.insertId, input.userId, db);
}

async function findById(id, userId, db = pool) {
  const [rows] = await db.execute(
    `SELECT id, type, title, message, lead_id, is_read, created_at, read_at
     FROM notifications WHERE id = ? AND user_id = ? LIMIT 1`,
    [id, userId],
  );
  return rows[0] || null;
}

async function list(userId, limit, db = pool) {
  const [rows] = await db.execute(
    `SELECT id, type, title, message, lead_id, is_read, created_at, read_at
     FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT ?`,
    [userId, limit],
  );
  return rows;
}

async function markRead(id, userId, db = pool) {
  const [result] = await db.execute(
    `UPDATE notifications SET is_read = TRUE, read_at = COALESCE(read_at, CURRENT_TIMESTAMP(3))
     WHERE id = ? AND user_id = ?`,
    [id, userId],
  );
  return result.affectedRows;
}

async function markAllRead(userId, db = pool) {
  await db.execute(
    `UPDATE notifications SET is_read = TRUE, read_at = COALESCE(read_at, CURRENT_TIMESTAMP(3))
     WHERE user_id = ? AND is_read = FALSE`,
    [userId],
  );
}

module.exports = { create, list, markRead, markAllRead };
