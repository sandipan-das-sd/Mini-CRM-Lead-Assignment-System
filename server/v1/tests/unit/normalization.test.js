const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeEmail, normalizePhone } = require('../../utils/normalize-contact');

test('email normalization used by login is deterministic', () => {
  assert.equal(normalizeEmail('  Person@Example.COM '), 'person@example.com');
});

test('phone normalization removes display punctuation and retains international prefix', () => {
  assert.equal(normalizePhone('+91 98765-43210'), '+919876543210');
  assert.equal(normalizePhone('(987) 654-3210'), '9876543210');
  assert.equal(normalizePhone('123'), null);
});
