const AppError = require('../utils/app-error');
module.exports = (req, _res, next) =>
  next(
    new AppError(
      404,
      'NOT_FOUND',

      `Route ${req.method} 
    ${req.originalUrl} was not found`,
    ),
  );
