const crypto = require('node:crypto');
const repository = require('../repositories/idempotency.repository');
const AppError = require('../utils/app-error');

const hashPayload = (payload) =>
  crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');

/** Use inside withTransaction(). The unique DB key arbitrates concurrent requests. */
async function reserve({ userId, operation, key, payload }, db) {
  if (!key || key.length > 128)
    throw new AppError(
      400,
      'INVALID_IDEMPOTENCY_KEY',
      'Idempotency-Key is required and must not exceed 128 characters',
    );
  const requestHash = hashPayload(payload);
  const existing = await repository.find(userId, operation, key, db);
  if (existing) {
    if (existing.request_hash !== requestHash)
      throw new AppError(
        409,
        'IDEMPOTENCY_KEY_REUSED',
        'That idempotency key was used with a different request',
      );
    if (existing.status === 'completed')
      return { replay: true, statusCode: existing.response_status, body: existing.response_body };
    throw new AppError(
      409,
      'REQUEST_IN_PROGRESS',
      'An identical request is already being processed',
    );
  }
  await repository.reserve({ userId, operation, key, requestHash }, db);
  return { replay: false };
}

module.exports = { reserve, complete: repository.complete, hashPayload };
