import { createClient } from '../lib/utils/pool';

import { up as migration001 } from './migrations/001_extensions';
import { up as migration002 } from './migrations/002_kecamatan';
import { up as migration003 } from './migrations/003_kelurahan';
import { up as migration004 } from './migrations/004_jaringan_jalan';
import { up as migration005 } from './migrations/005_sppg';
import { up as migration006 } from './migrations/006_sekolah';

const migrations = [
  migration001,
  migration002,
  migration003,
  migration004,
  migration005,
  migration006,
];

export async function migrate() {
  const { client, pool } = await createClient();
  try {
    console.log('Running migrations...');
    for (const m of migrations) {
      await m(client);
    }
    console.log('All migrations completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run when called directly
migrate().catch(err => {
  console.error(err);
  process.exit(1);
});
