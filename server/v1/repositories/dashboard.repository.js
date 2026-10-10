const pool = require('../db/connection/pool');

function filters(scope, range, alias = 'l') {
  const conditions = [`${alias}.deleted_at IS NULL`];
  const values = [];
  if (scope.assignedUserId) {
    conditions.push(`${alias}.assigned_user_id = ?`);
    values.push(scope.assignedUserId);
  }
  if (range.createdFrom) {
    conditions.push(`${alias}.created_at >= ?`);
    values.push(range.createdFrom);
  }
  if (range.createdTo) {
    conditions.push(`${alias}.created_at <= ?`);
    values.push(range.createdTo);
  }
  return { where: conditions.join(' AND '), values };
}

async function countByStatus(scope, range, db = pool) {
  const query = filters(scope, range);
  const [rows] = await db.execute(
    `SELECT status, COUNT(*) AS count FROM leads l
     WHERE ${query.where} GROUP BY status ORDER BY status`,
    query.values,
  );
  return rows;
}

async function countBySalesperson(scope, range, db = pool) {
  const query = filters(scope, range);
  const [rows] = await db.execute(
    `SELECT l.assigned_user_id AS user_id, COALESCE(u.name, 'Unassigned') AS user_name,
            COUNT(*) AS count
     FROM leads l LEFT JOIN users u ON u.id = l.assigned_user_id
     WHERE ${query.where}
     GROUP BY l.assigned_user_id, u.name
     ORDER BY count DESC, user_name ASC`,
    query.values,
  );
  return rows;
}

module.exports = { countByStatus, countBySalesperson };
