import { PoolClient } from 'pg';

export async function up(client: PoolClient) {
  console.log('[migration] 005 - Creating table: sppg...');

  const exists = await client.query(`
    SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'sppg');
  `);

  if (exists.rows[0].exists) {
    const idType = await client.query(`
      SELECT data_type FROM information_schema.columns
      WHERE table_name = 'sppg' AND column_name = 'id';
    `);
    if (idType.rows[0]?.data_type === 'integer') {
      console.log('[migration] 005 - Migrating sppg (integer id → varchar)...');
      await client.query(`ALTER TABLE sppg RENAME TO sppg_old;`);

      await client.query(`
        CREATE TABLE sppg (
          id           VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
          nama_sppg    VARCHAR(255) NOT NULL,
          alamat       VARCHAR(255),
          geom         GEOMETRY(Point, 4326) NOT NULL,
          id_kelurahan VARCHAR(50) REFERENCES kelurahan(id) ON DELETE SET NULL,
          created_at   TIMESTAMP DEFAULT NOW()
        );
      `);

      await client.query(`
        INSERT INTO sppg (id, nama_sppg, alamat, geom, created_at, id_kelurahan)
        SELECT
          id::varchar, nama_sppg, alamat, geom, created_at,
          (SELECT id FROM kelurahan WHERE ST_Contains(geom, sppg_old.geom) LIMIT 1)
        FROM sppg_old;
      `);
      await client.query(`DROP TABLE IF EXISTS sppg_old CASCADE;`);
      console.log('[migration] 005 - sppg migrated.');
    }
  } else {
    await client.query(`
      CREATE TABLE IF NOT EXISTS sppg (
        id           VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        nama_sppg    VARCHAR(255) NOT NULL,
        alamat       VARCHAR(255),
        geom         GEOMETRY(Point, 4326) NOT NULL,
        id_kelurahan VARCHAR(50) REFERENCES kelurahan(id) ON DELETE SET NULL,
        created_at   TIMESTAMP DEFAULT NOW()
      );
    `);
  }

  await client.query(`CREATE INDEX IF NOT EXISTS idx_sppg_geom ON sppg USING GIST(geom);`);

  console.log('[migration] 005 - Done.');
}
