const test = require('node:test');
const assert = require('node:assert/strict');
const leadService = require('../../services/lead.service');
const { resetDatabase, createUser, count, closeTestConnections } = require('../helpers/test-db');

test.before(resetDatabase);
test.after(closeTestConnections);

test('lead creation writes the lead and created activity atomically', async () => {
  const admin = await createUser({ name: 'Admin', email: 'admin@test.local', role: 'admin' });
  const result = await leadService.createLead(
    { name: 'Riya Sen', phone: '+91 98765-43210', email: 'RIYA@example.com', source: 'website' },
    admin,
    'create-riya',
  );
  assert.equal(result.statusCode, 201);
  assert.equal(result.body.data.lead.phone, '+919876543210');
  assert.equal(result.body.data.lead.email, 'riya@example.com');
  assert.equal(await count('leads'), 1);
  assert.equal(await count('activities'), 1);
});
