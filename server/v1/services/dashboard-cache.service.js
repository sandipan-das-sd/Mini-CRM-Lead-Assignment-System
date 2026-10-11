const { getRedis } = require('../config/redis');
const env = require('../config/env');

function cacheKey(range, actor) {
  const scope = actor.role === 'admin' ? 'all' : `sales:${actor.id}`;
  const from = range.createdFrom ? new Date(range.createdFrom).toISOString() : 'any';
  const to = range.createdTo ? new Date(range.createdTo).toISOString() : 'any';
  return `dashboard:${scope}:${from}:${to}`;
}

async function getCachedDashboard(range, actor) {
  try {
    const redis = await getRedis();
    const value = await redis.get(cacheKey(range, actor));
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error('Dashboard cache read failed:', error.message);
    return null;
  }
}

async function setCachedDashboard(range, actor, dashboard) {
  try {
    const redis = await getRedis();
    await redis.set(cacheKey(range, actor),
     JSON.stringify(dashboard), {
      EX: env.DASHBOARD_CACHE_TTL_SECONDS,
    });
  } catch (error) {
    console.error('Dashboard cache write failed:', error.message);
  }
}

async function invalidateDashboardCache() {
  try {
    const redis = await getRedis();
    for await (const keys of redis.scanIterator({ MATCH: 'dashboard:*', COUNT: 100 })) {
      const batch = Array.isArray(keys) ? keys : [keys];
      if (batch.length)
         await redis.del(batch);
    }
  } catch (error) {
    console.error('Dashboard cache invalidation failed:', error.message);
  }
}

module.exports = { getCachedDashboard, setCachedDashboard, invalidateDashboardCache };
