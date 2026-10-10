const pool = require('../db/connection/pool');

async function closeCurrent(leadId, db = pool) {
  await db.execute(
    'UPDATE assignments SET unassigned_at = CURRENT_TIMESTAMP(3) WHERE lead_id = ? AND unassigned_at IS NULL',
    [leadId],
  );
}

async function createAssignment(input, db = pool) {
  const [result] = await db.execute(
    `INSERT INTO assignments (lead_id, from_user_id, to_user_id, assigned_by, reason)
     VALUES (?, ?, ?, ?, ?)`,
    [input.leadId, input.fromUserId, input.toUserId, input.actorId, input.reason || null],
  );
  return result.insertId;
}

async function findPendingRequest(leadId, requestedBy, db = pool) {
  const [rows] = await db.execute(
    `SELECT * FROM reassignment_requests
     WHERE lead_id = ? AND requested_by = ? AND status = 'pending' LIMIT 1`,
    [leadId, requestedBy],
  );
  return rows[0] || null;
}

async function createRequest(input, db = pool) {
  const [result] = await db.execute(
    `INSERT INTO reassignment_requests (lead_id, requested_by, requested_to, reason)
     VALUES (?, ?, ?, ?)`,
    [input.leadId, input.requestedBy, input.requestedTo || null, input.reason],
  );
  return findRequestById(result.insertId, db);
}

async function findRequestById(id, db = pool, { forUpdate = false } = {}) {
  const [rows] = await db.execute(
    `SELECT * FROM reassignment_requests WHERE id = ? LIMIT 1${forUpdate ? ' FOR UPDATE' : ''}`,
    [id],
  );
  return rows[0] || null;
}

async function reviewRequest(id, status, reviewerId, db = pool) {
  const [result] = await db.execute(
    `UPDATE reassignment_requests
     SET status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP(3)
     WHERE id = ? AND status = 'pending'`,
    [status, reviewerId, id],
  );
  return result.affectedRows === 1;
}

async function listRequests({ status, cursor, limit }, db = pool) {
  const conditions = [];
  const values = [];
  if (status) {
    conditions.push('r.status = ?');
    values.push(status);
  }
  if (cursor) {
    conditions.push('r.id < ?');
    values.push(cursor);
  }
  values.push(limit + 1);
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const [rows] = await db.execute(
    `SELECT r.*, l.name AS lead_name,
            requester.name AS requester_name, target.name AS requested_to_name,
            reviewer.name AS reviewer_name
     FROM reassignment_requests r
     JOIN leads l ON l.id = r.lead_id
     JOIN users requester ON requester.id = r.requested_by
     LEFT JOIN users target ON target.id = r.requested_to
     LEFT JOIN users reviewer ON reviewer.id = r.reviewed_by
     ${where} ORDER BY r.id DESC LIMIT ?`,
    values,
  );
  return rows;
}

module.exports = {
  closeCurrent,
  createAssignment,
  findPendingRequest,
  createRequest,
  findRequestById,
  reviewRequest,
  listRequests,
};
