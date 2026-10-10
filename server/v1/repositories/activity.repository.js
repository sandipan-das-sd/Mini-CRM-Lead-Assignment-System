const pool = require('../db/connection/pool');

async function create({ leadId, actorId, type, message = null, changes = null }, db = pool) {
  const [result] = await db.execute(
    `INSERT INTO activities (lead_id, actor_user_id, type, message, changes)
     VALUES (?, ?, ?, ?, ?)`,
    [leadId, actorId, type, message, changes ? JSON.stringify(changes) : null],
  );
  return result.insertId;
}

module.exports = { create };
