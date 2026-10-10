const fs = require('node:fs/promises');
const path = require('node:path');
const pool = require('../db/connection/pool');

async function migrate() {
  const directory = path.resolve(__dirname, '..', 'db', 'migrations');
  const files = (await fs.readdir(directory)).filter((name) => name.endsWith('.sql')).sort();

  await pool.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    filename VARCHAR(255) NOT NULL PRIMARY KEY,
    applied_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
  ) ENGINE=InnoDB`);

  for (const filename of files) {
    const [applied] = await pool.execute('SELECT 1 FROM schema_migrations WHERE filename = ?', [
      filename,
    ]);
    if (applied.length) continue;
    const sql = await fs.readFile(path.join(directory, filename), 'utf8');
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.query(sql);
      await connection.execute('INSERT INTO schema_migrations (filename) VALUES (?)', [filename]);
      await connection.commit();
      console.log(`Applied ${filename}`);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

migrate()
  .then(() => pool.end())
  .catch(async (error) => {
    console.error(error);
    await pool.end();
    process.exitCode = 1;
  });
