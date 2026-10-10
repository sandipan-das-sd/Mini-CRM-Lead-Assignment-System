const AppError = require('../utils/app-error');

const authorize =
  (...allowedRoles) =>
  (req, _res, next) => {
    if (!req.user)
      return next(new AppError(401, 'AUTHENTICATION_REQUIRED', 'Authentication is required'));
    if (!allowedRoles.includes(req.user.role))
      return next(
        new AppError(403, 'FORBIDDEN', 'You do not have permission to perform this action'),
      );
    return next();
  };

module.exports = authorize;
