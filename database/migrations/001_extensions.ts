import { PoolClient } from 'pg';

export async function up(client: PoolClient) {
  console.log('[migration] 001 - Creating extensions and enum types...');

  await client.query(`CREATE EXTENSION IF NOT EXISTS postgis`);
  await client.query(`CREATE EXTENSION IF NOT EXISTS pgrouting`);

  // Drop legacy analytical tables if they exist
  await client.query(`DROP TABLE IF EXISTS service_area CASCADE`);
  await client.query(`DROP TABLE IF EXISTS sekolah_blank_spot CASCADE`);
  await client.query(`DROP TABLE IF EXISTS rekomendasi_sppg CASCADE`);

  // Jenjang enum
  await client.query(`
    DO $$ BEGIN
      CREATE TYPE jenjang_type AS ENUM ('SD', 'SMP', 'SMA', 'SMK');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  console.log('[migration] 001 - Done.');
}
