const test = require('node:test');
const assert = require('node:assert/strict');
const { withTransaction } = require('../../db/transaction');
const { pool, resetDatabase, createUser, count } = require('../helpers/test-db');

test.before(resetDatabase);
test.after(() => pool.end());

test('a failed multi-write transaction leaves no partial lead', async () => {
  const admin = await createUser({ name: 'Admin', email: 'admin@test.local', role: 'admin' });
  await assert.rejects(
    withTransaction(async (db) => {
      await db.execute(
        'INSERT INTO leads (name, email, source, created_by, updated_by) VALUES (?, ?, ?, ?, ?)',
        ['Rollback Lead', 'rollback@example.com', 'test', admin.id, admin.id],
      );
      throw new Error('simulated activity failure');
    }),
    /simulated activity failure/,
  );
  assert.equal(await count('leads'), 0);
});
