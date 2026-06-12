import { createClient } from '../lib/utils/pool';
import { migrate } from './migrate';

import { seed as seed01 } from './seeders/01_kecamatan';
import { seed as seed02 } from './seeders/02_kelurahan';
import { seed as seed03 } from './seeders/03_jaringan_jalan';
import { seed as seed04 } from './seeders/04_sppg';
import { seed as seed05 } from './seeders/05_sekolah';

const seeders = [seed01, seed02, seed03, seed04, seed05];

async function run() {
  // 1. Run migrations first
  await migrate();

  // 2. Run seeders
  const { client, pool } = await createClient();
  try {
    console.log('\nRunning seeders...');
    for (const seeder of seeders) {
      await seeder(client);
    }
    console.log('\nAll seeders completed successfully.');
  } catch (err) {
    console.error('Seeding failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
