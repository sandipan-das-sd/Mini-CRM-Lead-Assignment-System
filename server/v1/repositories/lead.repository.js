const pool = require('../db/connection/pool');

const SELECT_COLUMNS = `
  l.id, l.name, l.phone, l.email, l.source, l.status, l.assigned_user_id,
  l.version, l.created_by, l.updated_by, l.created_at, l.updated_at,
  u.name AS assigned_user_name, u.email AS assigned_user_email`;

async function create(input, db = pool) {
  const [result] = await db.execute(
    `INSERT INTO leads (name, phone, email, source, created_by, updated_by)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [input.name, input.phone, input.email, input.source, input.actorId, input.actorId],
  );
  return findById(result.insertId, {}, db);
}

async function findById(id, scope = {}, db = pool, { forUpdate = false } = {}) {
  const conditions = ['l.id = ?', 'l.deleted_at IS NULL'];
  const values = [id];
  if (scope.assignedUserId) {
    conditions.push('l.assigned_user_id = ?');
    values.push(scope.assignedUserId);
  }
  const [rows] = await db.execute(
    `SELECT ${SELECT_COLUMNS}
     FROM leads l LEFT JOIN users u ON u.id = l.assigned_user_id
     WHERE ${conditions.join(' AND ')} LIMIT 1${forUpdate ? ' FOR UPDATE' : ''}`,
    values,
  );
  return rows[0] || null;
}

async function findDuplicates({ phone, email, excludeId }, db = pool) {
  const contacts = [];
  const values = [];
  if (phone) {
    contacts.push('phone = ?');
    values.push(phone);
  }
  if (email) {
    contacts.push('email = ?');
    values.push(email);
  }
  if (!contacts.length) return [];
  const conditions = [`(${contacts.join(' OR ')})`, 'deleted_at IS NULL'];
  if (excludeId) {
    conditions.push('id <> ?');
    values.push(excludeId);
  }
  const [rows] = await db.execute(
    `SELECT id, phone, email FROM leads WHERE ${conditions.join(' AND ')} ORDER BY id LIMIT 2`,
    values,
  );
  return rows;
}

async function list(filters, scope = {}, db = pool) {
  const conditions = ['l.deleted_at IS NULL'];
  const values = [];
  const assignedUserId = scope.assignedUserId || filters.assignedUserId;
  if (assignedUserId) {
    conditions.push('l.assigned_user_id = ?');
    values.push(assignedUserId);
  }
  if (filters.status) {
    conditions.push('l.status = ?');
    values.push(filters.status);
  }
  if (filters.source) {
    conditions.push('l.source = ?');
    values.push(filters.source);
  }
  if (filters.createdFrom) {
    conditions.push('l.created_at >= ?');
    values.push(filters.createdFrom);
  }
  if (filters.createdTo) {
    conditions.push('l.created_at <= ?');
    values.push(filters.createdTo);
  }
  if (filters.cursor) {
    conditions.push('l.id > ?');
    values.push(filters.cursor);
  }
  if (filters.search) {
    const digits = filters.search.replace(/\D/g, '');
    conditions.push('(l.name LIKE ? OR l.email = ? OR l.phone IN (?, ?))');
    values.push(
      `${filters.search}%`,
      filters.search.toLowerCase(),
      digits || '__no_match__',
      digits ? `+${digits}` : '__no_match__',
    );
  }
  values.push(filters.limit + 1);
  const [rows] = await db.execute(
    `SELECT ${SELECT_COLUMNS}
     FROM leads l LEFT JOIN users u ON u.id = l.assigned_user_id
     WHERE ${conditions.join(' AND ')} ORDER BY l.id ASC LIMIT ?`,
    values,
  );
  return rows;
}

async function update(id, version, changes, actorId, db = pool) {
  const allowed = ['name', 'phone', 'email', 'source'];
  const fields = Object.keys(changes).filter((key) => allowed.includes(key));
  if (!fields.length) return false;
  const setters = fields.map((field) => `${field} = ?`);
  const values = fields.map((field) => changes[field]);
  const [result] = await db.execute(
    `UPDATE leads SET ${setters.join(', ')}, updated_by = ?, version = version + 1
     WHERE id = ? AND version = ? AND deleted_at IS NULL`,
    [...values, actorId, id, version],
  );
  return result.affectedRows === 1;
}

module.exports = { create, findById, findDuplicates, list, update };
