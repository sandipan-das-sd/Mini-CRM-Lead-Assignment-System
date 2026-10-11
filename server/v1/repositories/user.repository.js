const pool = require('../db/connection/pool');

const PUBLIC_COLUMNS = 'id, name, email, role, is_active, created_at, updated_at';

async function findAuthUserByEmail(email, db = pool) {
  const [rows] = await db.execute(
    `SELECT ${PUBLIC_COLUMNS}, password_hash, token_version FROM users 
    WHERE email = ? AND deleted_at IS NULL LIMIT 1`,
    [email],
  );
  return rows[0] || null;
}

async function findActiveById(id, db = pool) {
  const [rows] = await db.execute(
    `SELECT ${PUBLIC_COLUMNS}, token_version FROM users
     WHERE id = ? AND is_active = TRUE AND deleted_at IS NULL LIMIT 1`,
    [id],
  );
  return rows[0] || null;
}

async function findById(id, db = pool, { forUpdate = false } = {}) {
  const [rows] = await db.execute(
    `SELECT ${PUBLIC_COLUMNS}, token_version FROM users
     WHERE id = ? AND deleted_at IS NULL LIMIT 1${forUpdate ? ' FOR UPDATE' : ''}`,
    [id],
  );
  return rows[0] || null;
}

async function create({ name, email, passwordHash, role }, db = pool) {
  const [result] = await db.execute(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    [name, email, passwordHash, role],
  );
  return findActiveById(result.insertId, db);
}

async function list({ role, isActive, cursor, limit }, db = pool) {
  const conditions = ['deleted_at IS NULL'];
  const values = [];
  if (role) {
    conditions.push('role = ?');
    values.push(role);
  }
  if (isActive !== undefined) {
    conditions.push('is_active = ?');
    values.push(isActive);
  }
  if (cursor) {
    conditions.push('id > ?');
    values.push(cursor);
  }
  values.push(limit + 1);
  const [rows] = await db.execute(
    `SELECT ${PUBLIC_COLUMNS} FROM users WHERE ${conditions.join(' AND ')} ORDER BY id ASC LIMIT ?`,
    values,
  );
  return rows;
}

async function countAssignedLeads(userId, db = pool) {
  const [rows] = await db.execute(
    'SELECT COUNT(*) AS count FROM leads WHERE assigned_user_id = ? AND deleted_at IS NULL',
    [userId],
  );
  return Number(rows[0].count);
}

async function setActive(id, isActive, db = pool) {
  await db.execute(
    `UPDATE users
     SET is_active = ?, token_version = token_version + IF(? = FALSE, 1, 0)
     WHERE id = ? AND deleted_at IS NULL`,
    [isActive, isActive, id],
  );
  return findById(id, db);
}

async function listActiveAdminEmails(db = pool) {
  const [rows] = await db.execute(
    `SELECT email FROM users
     WHERE role = 'admin' AND is_active = TRUE AND deleted_at IS NULL`,
  );
  return rows.map((row) => row.email);
}

async function listActiveAdmins(db = pool) {
  const [rows] = await db.execute(
    `SELECT id, name, email FROM users
     WHERE role = 'admin' AND is_active = TRUE AND deleted_at IS NULL`,
  );
  return rows;
}

module.exports = {
  findAuthUserByEmail,
  findActiveById,
  findById,
  create,
  list,
  countAssignedLeads,
  setActive,
  listActiveAdminEmails,
  listActiveAdmins,
};
