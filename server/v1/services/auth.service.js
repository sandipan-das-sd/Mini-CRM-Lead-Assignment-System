const userRepository = require('../repositories/user.repository');
const { verifyPassword } = require('../utils/password');
const { signAccessToken } = require('../utils/token');
const AppError = require('../utils/app-error');

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: Boolean(user.is_active),
  };
}

async function login({ email, password }) {
  const user = await userRepository.findAuthUserByEmail(email);

  if (!user || !user.is_active || !(await verifyPassword(password, user.password_hash))) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }
  return {
    accessToken: signAccessToken(user),
    tokenType: 'Bearer',
    user: publicUser(user),
  };
}

async function getCurrentUser(id) {
  const user = await userRepository.findActiveById(id);
  if (!user) throw new AppError(401, 'AUTHENTICATION_REQUIRED', 'User is no longer active');
  return publicUser(user);
}

module.exports = { login, getCurrentUser };
