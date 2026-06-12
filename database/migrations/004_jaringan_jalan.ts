import { PoolClient } from 'pg';

export async function up(client: PoolClient) {
  console.log('[migration] 004 - Creating table: jaringan_jalan...');

  await client.query(`
    CREATE TABLE IF NOT EXISTS jaringan_jalan (
      id           BIGINT PRIMARY KEY,
      source       INTEGER,
      target       INTEGER,
      cost         FLOAT,
      reverse_cost FLOAT,
      geom         GEOMETRY NOT NULL
    );
  `);

  // Ensure generic GEOMETRY type (handles Z-dimension)
  try {
    await client.query(`ALTER TABLE jaringan_jalan ALTER COLUMN geom TYPE GEOMETRY;`);
  } catch {}

  // Drop legacy columns if they exist
  await client.query(`ALTER TABLE jaringan_jalan DROP COLUMN IF EXISTS nama_jalan;`);
  await client.query(`ALTER TABLE jaringan_jalan DROP COLUMN IF EXISTS kelas_jalan;`);

  // Ensure pgRouting columns exist
  await client.query(`ALTER TABLE jaringan_jalan ADD COLUMN IF NOT EXISTS source INTEGER;`);
  await client.query(`ALTER TABLE jaringan_jalan ADD COLUMN IF NOT EXISTS target INTEGER;`);
  await client.query(`ALTER TABLE jaringan_jalan ADD COLUMN IF NOT EXISTS cost FLOAT;`);
  await client.query(`ALTER TABLE jaringan_jalan ADD COLUMN IF NOT EXISTS reverse_cost FLOAT;`);

  await client.query(`CREATE INDEX IF NOT EXISTS idx_jalan_geom   ON jaringan_jalan USING GIST(geom);`);
  await client.query(`CREATE INDEX IF NOT EXISTS idx_jalan_source ON jaringan_jalan(source);`);
  await client.query(`CREATE INDEX IF NOT EXISTS idx_jalan_target ON jaringan_jalan(target);`);

  console.log('[migration] 004 - Done.');
}
