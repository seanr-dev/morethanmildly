import { databaseConnection } from './index';
let migrated: Promise<void> | undefined;
// Only called in Astro development. Netlify owns production migrations.
export async function ensureLocalMigrations() {
  if (!import.meta.env.DEV) return;
  migrated ||= (async () => {
    const { readdir, readFile } = await import('node:fs/promises');
    const connection = databaseConnection();
    if (connection.driver !== 'server')
      throw new Error(
        'Local migrations require the local PostgreSQL server driver.',
      );
    const client = await connection.pool.connect();
    try {
      await client.query(
        'CREATE TABLE IF NOT EXISTS mtm_local_migrations (name text PRIMARY KEY)',
      );
      const directories = (
        await readdir('netlify/database/migrations', { withFileTypes: true })
      )
        .filter((d) => d.isDirectory())
        .map((d) => d.name)
        .sort();
      for (const name of directories) {
        const check = await client.query(
          'SELECT name FROM mtm_local_migrations WHERE name = $1',
          [name],
        );
        if (check.rows.length) continue;
        const migration = await readFile(
          `netlify/database/migrations/${name}/migration.sql`,
          'utf8',
        );
        await client.query('BEGIN');
        try {
          await client.query(migration);
          await client.query(
            'INSERT INTO mtm_local_migrations(name) VALUES ($1)',
            [name],
          );
          await client.query('COMMIT');
        } catch (e) {
          await client.query('ROLLBACK');
          throw e;
        }
      }
    } finally {
      client.release();
    }
  })().catch((e) => {
    migrated = undefined;
    throw e;
  });
  await migrated;
}
