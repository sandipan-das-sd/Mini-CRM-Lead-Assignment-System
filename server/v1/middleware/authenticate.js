const { verifyAccessToken } = require('../utils/token');
const userRepository = require('../repositories/user.repository');
const AppError = require('../utils/app-error');

async function authenticate(req, _res, next) {
  try {
    const authorization = req.get('authorization') || '';
    const [scheme, token] = authorization.split(' ');
    if (scheme !== 'Bearer' || !token)
      throw new AppError(401, 'AUTHENTICATION_REQUIRED', 'A valid Bearer token is required');

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      throw new AppError(401, 'INVALID_TOKEN', 'Token is invalid or expired');
    }

    const user = await userRepository.findActiveById(payload.sub);
    if (!user || user.token_version !== payload.tokenVersion) {
      throw new AppError(401, 'INVALID_TOKEN', 'Token has been revoked or the user is inactive');
    }
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: true,
    };
    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = authenticate;
