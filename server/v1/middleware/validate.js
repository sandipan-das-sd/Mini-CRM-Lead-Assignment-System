const AppError = require('../utils/app-error');

const validate = (schema) => (req, _res, next) => {
  const result = schema.safeParse({
     body: req.body, 
     params: req.params,
      query: req.query
     });
  if (!result.success) {
    return next(
      new AppError(422, 'VALIDATION_ERROR', 'Request validation failed', result.error.flatten()),
    );
  }
  if (result.data.body) req.body = result.data.body;
  if (result.data.params) req.params = result.data.params;
  if (result.data.query) req.query = result.data.query;
  return next();
};

module.exports = validate;
