const test = require('node:test');
const assert = require('node:assert/strict');
const leadService = require('../../services/lead.service');
const assignmentService = require('../../services/assignment.service');
const { pool, resetDatabase, createUser, closeTestConnections } = require('../helpers/test-db');

test.before(resetDatabase);
test.after(closeTestConnections);

test('assignment and approved reassignment preserve ownership history', async () => {
  const admin = await createUser({ name: 'Admin', email: 'admin@test.local', role: 'admin' });
  const firstSales = await createUser({ name: 'Asha', email: 'asha@test.local' });
  const secondSales = await createUser({ name: 'Bimal', email: 'bimal@test.local' });
  const created = await leadService.createLead(
    { name: 'Assigned Lead', email: 'assigned@example.com', source: 'website' },
    admin,
    'assigned-lead',
  );
  let lead = await assignmentService.assignLead(
    created.body.data.lead.id,
    {
      assignedUserId: firstSales.id,
      version: created.body.data.lead.version,
      reason: 'Initial owner',
    },
    admin,
  );
  assert.equal(Number(lead.assignedUser.id), firstSales.id);

  const request = await assignmentService.createRequest(
    lead.id,
    { requestedToUserId: secondSales.id, reason: 'Territory transfer' },
    firstSales,
  );
  await assignmentService.reviewRequest(
    request.id,
    { decision: 'approved', assignedUserId: secondSales.id },
    admin,
  );
  lead = await leadService.getLead(lead.id, admin);
  assert.equal(Number(lead.assignedUser.id), secondSales.id);
  const [history] = await pool.execute(
    'SELECT from_user_id, to_user_id, unassigned_at FROM assignments WHERE lead_id = ? ORDER BY id',
    [lead.id],
  );
  assert.equal(history.length, 2);
  assert.ok(history[0].unassigned_at);
  assert.equal(Number(history[1].from_user_id), firstSales.id);
  assert.equal(Number(history[1].to_user_id), secondSales.id);
});
