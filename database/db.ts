import { Pool } from 'pg';

let pool: Pool;
let initPromise: Promise<void> | null = null;

const databaseUrl =
  process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/sppg_gis_db';

function getAdminConnectionString(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.pathname = '/postgres';
    return parsed.toString();
  } catch {
    return 'postgresql://postgres@localhost:5432/postgres';
  }
}

/**
 * Ensures the target database exists and the connection pool is initialized.
 * Table creation (DDL) is handled separately by database/migrate.ts.
 */
async function initializePool() {
  console.log('Initializing database pool...');

  const adminPool = new Pool({ connectionString: getAdminConnectionString(databaseUrl) });
  let targetDbName = 'sppg_gis_db';
  try {
    targetDbName = new URL(databaseUrl).pathname.replace('/', '') || 'sppg_gis_db';
  } catch {}

  try {
    const check = await adminPool.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [targetDbName]
    );
    if ((check.rowCount ?? 0) === 0) {
      console.log(`Creating database "${targetDbName}"...`);
      await adminPool.query(`CREATE DATABASE ${targetDbName}`);
    }
  } catch (err) {
    console.error('Error ensuring database exists:', err);
  } finally {
    await adminPool.end();
  }

  pool = new Pool({ connectionString: databaseUrl });
}

export const ensureInit = async () => {
  if (!initPromise) {
    initPromise = initializePool();
  }
  return initPromise;
};

export const query = async (text: string, params?: unknown[]) => {
  await ensureInit();
  return pool.query(text, params);
};

const db = { query, ensureInit };
export default db;
