module.exports = (error, _req, res, _next) => {
  let status = error.statusCode || 500;
  let code = error.code || 'INTERNAL_ERROR';
  let message = error.message || 'An unexpected error occurred';

  if (error.code === 'ER_DUP_ENTRY') {
    status = 409;
    code = 'CONFLICT';
    message = 'A record with that unique value already exists';
  }
  if (error.type === 'entity.parse.failed') {
    status = 400;
    code = 'INVALID_JSON';
    message = 'Request body contains invalid JSON';
  }
  if (status >= 500) console.error(error);

  const body = { error: { code, message } };
  if (error.details) body.error.details = error.details;
  return res.status(status).json(body);
};
