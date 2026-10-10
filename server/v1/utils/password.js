const bcrypt = require('bcryptjs');
const env = require('../config/env');

const hashPassword = (plainText) => bcrypt.hash(plainText, env.BCRYPT_ROUNDS);
const verifyPassword = (plainText, hash) => bcrypt.compare(plainText, hash);

module.exports = { hashPassword, verifyPassword };
