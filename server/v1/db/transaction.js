const pool = require('./connection/pool');

async function withTransaction(work, { isolationLevel = 'READ COMMITTED', retries = 2 } = {}) {
  const allowedLevels = new Set([
    'READ UNCOMMITTED',
    'READ COMMITTED',
    'REPEATABLE READ',
    'SERIALIZABLE',
  ]);
  if (!allowedLevels.has(isolationLevel))
    throw new TypeError('Unsupported transaction isolation level');
  for (let attempt = 0; ; attempt += 1) {
    const connection = await pool.getConnection();
    try {
      await connection.query(`SET TRANSACTION ISOLATION LEVEL ${isolationLevel}`);
      await connection.beginTransaction();
      const result = await work(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      const retryable = error.code === 'ER_LOCK_DEADLOCK' || error.code === 'ER_LOCK_WAIT_TIMEOUT';
      if (!retryable || attempt >= retries) throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = { withTransaction };
