const test = require('node:test');
const assert = require('node:assert/strict');

// These tests cover the security primitives without requiring a live database.
process.env.JWT_SECRET ||= 'test-secret-that-is-definitely-longer-than-32-characters';
process.env.BCRYPT_ROUNDS ||= '10';

const { hashPassword, verifyPassword } = require('../../utils/password');
const { signAccessToken, verifyAccessToken } = require('../../utils/token');

test('passwords are hashed and can be verified', async () => {
  const hash = await hashPassword('StrongPassword123!');
  assert.notEqual(hash, 'StrongPassword123!');
  assert.equal(await verifyPassword('StrongPassword123!', hash), true);
  assert.equal(await verifyPassword('wrong-password', hash), false);
});

test('access token contains only authorization claims', () => {
  const token = signAccessToken({
    id: 42,
    role: 'admin',
    token_version: 3,
    password_hash: 'must-not-leak',
  });
  const payload = verifyAccessToken(token);
  assert.equal(payload.sub, '42');
  assert.equal(payload.role, 'admin');
  assert.equal(payload.tokenVersion, 3);
  assert.equal(payload.password_hash, undefined);
});
