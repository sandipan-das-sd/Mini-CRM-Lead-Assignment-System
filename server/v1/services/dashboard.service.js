const repository = require('../repositories/dashboard.repository');
const { accessScope } = require('../policies/lead-access.policy');
const { LEAD_STATUS_VALUES } = require('../constants/lead-statuses');

async function getDashboard(range, actor) {
  const scope = accessScope(actor);
  const [statusRows, salespersonRows] = await Promise.all([
    repository.countByStatus(scope, range),
    repository.countBySalesperson(scope, range),
  ]);
  const byStatus = Object.fromEntries(LEAD_STATUS_VALUES.map((status) => [status, 0]));
  for (const row of statusRows) byStatus[row.status] = Number(row.count);
  return {
    totalLeads: Object.values(byStatus).reduce((total, count) => total + count, 0),
    newLeads: byStatus.new,
    convertedLeads: byStatus.converted,
    lostLeads: byStatus.lost,
    byStatus,
    bySalesperson: salespersonRows.map((row) => ({
      userId: row.user_id,
      name: row.user_name,
      count: Number(row.count),
    })),
  };
}

module.exports = { getDashboard };
