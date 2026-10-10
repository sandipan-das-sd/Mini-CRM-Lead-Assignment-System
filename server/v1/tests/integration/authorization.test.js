const test = require('node:test');
const assert = require('node:assert/strict');
const { accessScope, canUpdateLead } = require('../../policies/lead-access.policy');

test('admin lead access is unrestricted', () => {
  const admin = { id: 1, role: 'admin' };
  assert.deepEqual(accessScope(admin), {});
  assert.equal(canUpdateLead(admin, { assigned_user_id: 99 }), true);
});

test('sales lead access is restricted to their own assignment', () => {
  const sales = { id: 7, role: 'sales' };
  assert.deepEqual(accessScope(sales), { assignedUserId: 7 });
  assert.equal(canUpdateLead(sales, { assigned_user_id: 7 }), true);
  assert.equal(canUpdateLead(sales, { assigned_user_id: 8 }), false);
});
