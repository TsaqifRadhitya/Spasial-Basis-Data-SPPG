import { PoolClient } from 'pg';

export async function up(client: PoolClient) {
  console.log('[migration] 002 - Creating table: kecamatan...');

  await client.query(`
    CREATE TABLE IF NOT EXISTS kecamatan (
      id             VARCHAR(50) PRIMARY KEY,
      nama_kecamatan VARCHAR(100) NOT NULL,
      geom           GEOMETRY(Polygon, 4326) NOT NULL
    );
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_kecamatan_geom ON kecamatan USING GIST(geom);
  `);

  const legacyCheck = await client.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'batas_kelurahan'
    );
  `);

  if (legacyCheck.rows[0].exists) {
    console.log('[migration] 002 - Migrating batas_kelurahan → kecamatan...');
    await client.query(`
      INSERT INTO kecamatan (id, nama_kecamatan, geom)
      SELECT DISTINCT LOWER(nama_kecamatan), nama_kecamatan, ST_Union(geom)
      FROM batas_kelurahan
      GROUP BY nama_kecamatan
      ON CONFLICT (id) DO NOTHING;
    `);
  }

  console.log('[migration] 002 - Done.');
}
