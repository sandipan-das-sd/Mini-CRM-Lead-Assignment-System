const test = require('node:test');
const assert = require('node:assert/strict');
const leadService = require('../../services/lead.service');
const assignmentService = require('../../services/assignment.service');
const { pool, resetDatabase, createUser } = require('../helpers/test-db');
const { closeJobQueue } = require('../../services/job-queue.service');

test.before(resetDatabase);
test.after(async () => {
  await closeJobQueue();
  await pool.end();
});

test('two assignments using the same version cannot both win', async () => {
  const admin = await createUser({ name: 'Admin', email: 'admin@test.local', role: 'admin' });
  const firstSales = await createUser({ name: 'First Sales', email: 'one@test.local' });
  const secondSales = await createUser({ name: 'Second Sales', email: 'two@test.local' });
  const created = await leadService.createLead(
    { name: 'Concurrent', email: 'race@example.com', source: 'api' },
    admin,
    'race',
  );
  const lead = created.body.data.lead;
  const results = await Promise.allSettled([
    assignmentService.assignLead(
      lead.id,
      { assignedUserId: firstSales.id, version: lead.version },
      admin,
    ),
    assignmentService.assignLead(
      lead.id,
      { assignedUserId: secondSales.id, version: lead.version },
      admin,
    ),
  ]);
  assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1);
  assert.equal(results.filter((result) => result.status === 'rejected').length, 1);
  const [rows] = await pool.execute('SELECT COUNT(*) AS total FROM assignments WHERE lead_id = ?', [
    lead.id,
  ]);
  assert.equal(Number(rows[0].total), 1);
});
