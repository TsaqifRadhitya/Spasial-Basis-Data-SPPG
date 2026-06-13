import { PoolClient } from 'pg';

export async function up(client: PoolClient) {
  console.log('[migration] 006 - Creating table: sekolah...');

  // Handle legacy integer-id migration
  const exists = await client.query(`
    SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'sekolah');
  `);

  if (exists.rows[0].exists) {
    const idType = await client.query(`
      SELECT data_type FROM information_schema.columns
      WHERE table_name = 'sekolah' AND column_name = 'id';
    `);
    if (idType.rows[0]?.data_type === 'integer') {
      console.log('[migration] 006 - Migrating sekolah (integer id → varchar)...');
      await client.query(`ALTER TABLE sekolah RENAME TO sekolah_old;`);

      await client.query(`
        CREATE TABLE sekolah (
          id                     VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
          nama_satuan_pendidikan  VARCHAR(255) NOT NULL,
          jenjang                jenjang_type NOT NULL,
          alamat                 VARCHAR(255),
          geom                   GEOMETRY(Point, 4326) NOT NULL,
          id_kelurahan           VARCHAR(50) REFERENCES kelurahan(id) ON DELETE SET NULL,
          id_sppg                VARCHAR(50) REFERENCES sppg(id) ON DELETE SET NULL,
          jalur_distribusi       GEOMETRY,
          created_at             TIMESTAMP DEFAULT NOW()
        );
      `);

      await client.query(`
        INSERT INTO sekolah (id, nama_satuan_pendidikan, jenjang, alamat, geom, created_at, id_kelurahan)
        SELECT
          id::varchar, nama_sekolah, jenjang::jenjang_type, alamat, geom, created_at,
          (SELECT id FROM kelurahan WHERE ST_Contains(geom, sekolah_old.geom) LIMIT 1)
        FROM sekolah_old;
      `);
      await client.query(`DROP TABLE IF EXISTS sekolah_old CASCADE;`);
      console.log('[migration] 006 - sekolah migrated.');
    }
  } else {
    await client.query(`
      CREATE TABLE IF NOT EXISTS sekolah (
        id                     VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        nama_satuan_pendidikan  VARCHAR(255) NOT NULL,
        jenjang                jenjang_type NOT NULL,
        alamat                 VARCHAR(255),
        geom                   GEOMETRY(Point, 4326) NOT NULL,
        id_kelurahan           VARCHAR(50) REFERENCES kelurahan(id) ON DELETE SET NULL,
        id_sppg                VARCHAR(50) REFERENCES sppg(id) ON DELETE SET NULL,
        jalur_distribusi       GEOMETRY,
        created_at             TIMESTAMP DEFAULT NOW()
      );
    `);
  }

  // Ensure columns exist for incremental migrations
  await client.query(`ALTER TABLE sekolah ADD COLUMN IF NOT EXISTS id_sppg VARCHAR(50) REFERENCES sppg(id) ON DELETE SET NULL;`);
  await client.query(`ALTER TABLE sekolah ADD COLUMN IF NOT EXISTS jalur_distribusi GEOMETRY;`);

  await client.query(`CREATE INDEX IF NOT EXISTS idx_sekolah_geom   ON sekolah USING GIST(geom);`);
  await client.query(`CREATE INDEX IF NOT EXISTS idx_sekolah_jalur  ON sekolah USING GIST(jalur_distribusi);`);

  console.log('[migration] 006 - Done.');
}
