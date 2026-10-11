const { getRedis } = require('../config/redis');

const INCREMENT_SCRIPT = `
local current = redis.call('INCR', KEYS[1])
if current == 1 then
  redis.call('EXPIRE', KEYS[1], ARGV[1])
end
local ttl = redis.call('TTL', KEYS[1])
return {current, ttl}
`;

function rateLimit({ prefix, max, windowSeconds }) {
  return async (req, res, next) => {
    try {
      const redis = await getRedis();
      const identity = req.ip || req.socket.remoteAddress || 'unknown';
      const key = `rate-limit:${prefix}:${identity}`;
      const [count, ttl] = await redis.eval(INCREMENT_SCRIPT, {
        keys: [key],
        arguments: [String(windowSeconds)],
      });
      res.set('X-RateLimit-Limit', String(max));
      res.set('X-RateLimit-Remaining', String(Math.max(0, max - Number(count))));
      if (Number(count) > max) {
        res.set('Retry-After', String(Math.max(1, Number(ttl))));
        return res.status(429).json({
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many login attempts; please try again later',
          },
        });
      }
    } catch (error) {
      // Fail open: a Redis outage must not make authentication unavailable.
      console.error('Rate limiter unavailable:', error.message);
    }
    return next();
  };
}

module.exports = rateLimit;
