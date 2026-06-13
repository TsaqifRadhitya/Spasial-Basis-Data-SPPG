import { PoolClient } from 'pg';

export async function up(client: PoolClient) {
  console.log('[migration] 003 - Creating table: kelurahan...');

  await client.query(`
    CREATE TABLE IF NOT EXISTS kelurahan (
      id             VARCHAR(50) PRIMARY KEY,
      nama_kelurahan VARCHAR(100) NOT NULL,
      geom           GEOMETRY(Polygon, 4326) NOT NULL,
      id_kecamatan   VARCHAR(50) REFERENCES kecamatan(id) ON DELETE CASCADE
    );
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_kelurahan_geom ON kelurahan USING GIST(geom);
  `);

  const legacyCheck = await client.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'batas_kelurahan'
    );
  `);

  if (legacyCheck.rows[0].exists) {
    console.log('[migration] 003 - Migrating batas_kelurahan → kelurahan...');
    await client.query(`
      INSERT INTO kelurahan (id, nama_kelurahan, geom, id_kecamatan)
      SELECT LOWER(nama_kelurahan), nama_kelurahan, geom, LOWER(nama_kecamatan)
      FROM batas_kelurahan
      ON CONFLICT (id) DO NOTHING;
    `);
    await client.query(`DROP TABLE IF EXISTS batas_kelurahan CASCADE;`);
    console.log('[migration] 003 - batas_kelurahan migrated and dropped.');
  }

  console.log('[migration] 003 - Done.');
}
