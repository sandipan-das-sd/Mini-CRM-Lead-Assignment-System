const pool = require('../db/connection/pool');
const userRepository = require('../repositories/user.repository');
const { hashPassword } = require('../utils/password');
const { ROLES } = require('../constants/roles');

async function seed() {
  const name = process.env.ADMIN_NAME || 'System Admin';
  const email = (process.env.ADMIN_EMAIL || 'admin@example.com').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!password || password.length < 12)
    throw new Error('ADMIN_PASSWORD must contain at least 12 characters');
  if (await userRepository.findAuthUserByEmail(email)) {
    console.log(`Admin ${email} already exists; no changes made`);
    return;
  }
  await userRepository.create({
    name,
    email,
    passwordHash: await hashPassword(password),
    role: ROLES.ADMIN,
  });
  console.log(`Created admin ${email}`);
}

seed()
  .then(() => pool.end())
  .catch(async (error) => {
    console.error(error);
    await pool.end();
    process.exitCode = 1;
  });
