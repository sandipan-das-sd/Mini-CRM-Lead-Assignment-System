const test = require('node:test');
const assert = require('node:assert/strict');
const leadService = require('../../services/lead.service');
const { resetDatabase, createUser, count, closeTestConnections } = require('../helpers/test-db');

test.before(resetDatabase);
test.after(closeTestConnections);

test('normalized duplicate phone is rejected without another lead', async () => {
  const admin = await createUser({ name: 'Admin', email: 'admin@test.local', role: 'admin' });
  await leadService.createLead(
    { name: 'First', phone: '9876543210', source: 'web' },
    admin,
    'first',
  );
  await assert.rejects(
    leadService.createLead(
      { name: 'Second', phone: '98765 43210', source: 'referral' },
      admin,
      'second',
    ),
    (error) => error.statusCode === 409 && error.code === 'DUPLICATE_LEAD',
  );
  assert.equal(await count('leads'), 1);
});
