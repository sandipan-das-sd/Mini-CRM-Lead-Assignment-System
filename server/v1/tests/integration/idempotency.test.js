const test = require('node:test');
const assert = require('node:assert/strict');
const leadService = require('../../services/lead.service');
const { resetDatabase, createUser, count, closeTestConnections } = require('../helpers/test-db');

test.before(resetDatabase);
test.after(closeTestConnections);

test('replaying the same idempotency key returns one stored result', async () => {
  const admin = await createUser({ name: 'Admin', email: 'admin@test.local', role: 'admin' });
  const input = { name: 'Idempotent Lead', email: 'once@example.com', source: 'api' };
  const first = await leadService.createLead(input, admin, 'same-key');
  const replay = await leadService.createLead(input, admin, 'same-key');
  assert.equal(replay.statusCode, first.statusCode);
  assert.equal(replay.body.data.lead.id, first.body.data.lead.id);
  assert.equal(replay.body.data.lead.email, first.body.data.lead.email);
  assert.equal(await count('leads'), 1);
  assert.equal(await count('idempotency_requests'), 1);
});
