const test = require('node:test');
const assert = require('node:assert/strict');
const { canTransition } = require('../../policies/lead-status.policy');

test('normal lead status transitions are allowed', () => {
  assert.equal(canTransition('new', 'contacted'), true);
  assert.equal(canTransition('interested', 'converted'), true);
  assert.equal(canTransition('follow_up', 'lost'), true);
});

test('converted and lost are terminal statuses', () => {
  assert.equal(canTransition('converted', 'new'), false);
  assert.equal(canTransition('lost', 'contacted'), false);
});
