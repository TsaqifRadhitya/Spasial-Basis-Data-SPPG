import fs from 'fs';
import path from 'path';
import { Pool, PoolClient } from 'pg';

// Load .env.local for CLI scripts
try {
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split(/\r?\n/).forEach(line => {
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim().replace(/^"|"$/g, '');
        if (key && !key.startsWith('#')) process.env[key] = value;
      }
    });
  }
} catch {
  console.warn('Could not read .env.local, using system env.');
}

const DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/sppg_gis_db';

function getAdminUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.pathname = '/postgres';
    return parsed.toString();
  } catch {
    return 'postgresql://postgres@localhost:5432/postgres';
  }
}

/** Ensure target DB exists, then return a connected client from the main pool. */
export async function createClient(): Promise<{ client: PoolClient; pool: Pool }> {
  // 1. Ensure DB exists
  const adminPool = new Pool({ connectionString: getAdminUrl(DATABASE_URL) });
  try {
    let targetDb = 'sppg_gis_db';
    try {
      targetDb = new URL(DATABASE_URL).pathname.replace('/', '') || 'sppg_gis_db';
    } catch {}

    const check = await adminPool.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [targetDb]
    );
    if ((check.rowCount ?? 0) === 0) {
      console.log(`Database "${targetDb}" not found, creating...`);
      await adminPool.query(`CREATE DATABASE ${targetDb}`);
      console.log(`Database "${targetDb}" created.`);
    } else {
      console.log(`Terminating active connections to "${targetDb}"...`);
      await adminPool.query(`
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE datname = $1
          AND pid <> pg_backend_pid();
      `, [targetDb]);
    }
  } finally {
    await adminPool.end();
  }

  // 2. Connect to target DB
  const pool = new Pool({ connectionString: DATABASE_URL });
  const client = await pool.connect();
  return { client, pool };
}
