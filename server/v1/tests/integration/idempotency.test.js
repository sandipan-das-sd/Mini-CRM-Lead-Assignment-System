const test = require('node:test');
const assert = require('node:assert/strict');
const leadService = require('../../services/lead.service');
const { pool, resetDatabase, createUser, count } = require('../helpers/test-db');

test.before(resetDatabase);
test.after(() => pool.end());

test('replaying the same idempotency key returns one stored result', async () => {
  const admin = await createUser({ name: 'Admin', email: 'admin@test.local', role: 'admin' });
  const input = { name: 'Idempotent Lead', email: 'once@example.com', source: 'api' };
  const first = await leadService.createLead(input, admin, 'same-key');
  const replay = await leadService.createLead(input, admin, 'same-key');
  assert.deepEqual(replay.body, first.body);
  assert.equal(await count('leads'), 1);
  assert.equal(await count('idempotency_requests'), 1);
});
