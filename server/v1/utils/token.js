const jwt = require('jsonwebtoken');
const env = require('../config/env');

function signAccessToken(user) {
  return jwt.sign(
    {
      role: user.role,
      tokenVersion: user.token_version,
    },
    env.JWT_SECRET,
    {
      subject: String(user.id),
      expiresIn: env.JWT_EXPIRES_IN,
      issuer: 'lead-assignment-api',
      audience: 'lead-assignment-client',
    },
  );
}

function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_SECRET, {
    issuer: 'lead-assignment-api',
    audience: 'lead-assignment-client',
  });
}

module.exports = { signAccessToken, verifyAccessToken };
