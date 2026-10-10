const pool = require('../db/connection/pool');

async function create({ leadId, actorId, type, message = null, changes = null }, db = pool) {
  const [result] = await db.execute(
    `INSERT INTO activities (lead_id, actor_user_id, type, message, changes)
     VALUES (?, ?, ?, ?, ?)`,
    [leadId, actorId, type, message, changes ? JSON.stringify(changes) : null],
  );
  return result.insertId;
}

async function listByLead(leadId, { cursor, limit }, db = pool) {
  const conditions = ['a.lead_id = ?'];
  const values = [leadId];
  if (cursor) {
    conditions.push('a.id < ?');
    values.push(cursor);
  }
  values.push(limit + 1);
  const [rows] = await db.execute(
    `SELECT a.id, a.lead_id, a.type, a.message, a.changes, a.created_at,
            a.actor_user_id, u.name AS actor_name, u.email AS actor_email
     FROM activities a
     LEFT JOIN users u ON u.id = a.actor_user_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY a.id DESC LIMIT ?`,
    values,
  );
  return rows;
}

module.exports = { create, listByLead };
