import { Pool } from 'pg';

let pool: Pool;
let initPromise: Promise<void> | null = null;

// Parse DATABASE_URL or fallback to default postgres connection
const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/sppg_gis_db';

// Extract connection details to connect to default "postgres" database first
function getAdminConnectionString(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.pathname = '/postgres'; // connect to default admin database
    return parsed.toString();
  } catch (e) {
    return 'postgresql://postgres@localhost:5432/postgres';
  }
}

async function initializeDatabase() {
  console.log('Initializing database connection...');
  
  // 1. Connect to postgres admin database to check/create the target database
  const adminUrl = getAdminConnectionString(databaseUrl);
  const adminPool = new Pool({ connectionString: adminUrl });
  
  let targetDbName = 'sppg_gis_db';
  try {
    const parsed = new URL(databaseUrl);
    targetDbName = parsed.pathname.replace('/', '') || 'sppg_gis_db';
  } catch (e) {
    // ignore
  }

  try {
    const dbCheckResult = await adminPool.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [targetDbName]
    );

    if (dbCheckResult.rowCount === 0) {
      console.log(`Database "${targetDbName}" does not exist. Creating...`);
      // CREATE DATABASE cannot be executed in transaction block, so we run directly
      await adminPool.query(`CREATE DATABASE ${targetDbName}`);
      console.log(`Database "${targetDbName}" successfully created.`);
    }
  } catch (err) {
    console.error('Error checking/creating database:', err);
  } finally {
    await adminPool.end();
  }

  // 2. Initialize the main connection pool for target database
  pool = new Pool({ connectionString: databaseUrl });

  // 3. Create extensions and tables inside target database
  const client = await pool.connect();
  try {
    console.log('Creating extensions...');
    await client.query(`CREATE EXTENSION IF NOT EXISTS postgis`);
    await client.query(`CREATE EXTENSION IF NOT EXISTS pgrouting`);

    // Drop old analytical tables if they exist
    await client.query(`DROP TABLE IF EXISTS service_area CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS sekolah_blank_spot CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS rekomendasi_sppg CASCADE;`);

    // Create Jenjang Enum Type
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE jenjang_type AS ENUM ('SD', 'SMP', 'SMA', 'SMK');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Table kecamatan
    await client.query(`
      CREATE TABLE IF NOT EXISTS kecamatan (
        id             VARCHAR(50) PRIMARY KEY,
        nama_kecamatan VARCHAR(100) NOT NULL,
        geom           GEOMETRY(Polygon, 4326) NOT NULL
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_kecamatan_geom ON kecamatan USING GIST(geom);`);

    // Table kelurahan
    await client.query(`
      CREATE TABLE IF NOT EXISTS kelurahan (
        id             VARCHAR(50) PRIMARY KEY,
        nama_kelurahan VARCHAR(100) NOT NULL,
        geom           GEOMETRY(Polygon, 4326) NOT NULL,
        id_kecamatan   VARCHAR(50) REFERENCES kecamatan(id) ON DELETE CASCADE
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_kelurahan_geom ON kelurahan USING GIST(geom);`);

    // Migrate old batas_kelurahan to kecamatan and kelurahan if it exists
    const batasKelurahanCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'batas_kelurahan'
      );
    `);

    if (batasKelurahanCheck.rows[0].exists) {
      console.log('Migrating batas_kelurahan to kecamatan and kelurahan...');
      await client.query(`
        INSERT INTO kecamatan (id, nama_kecamatan, geom)
        SELECT DISTINCT 
          LOWER(nama_kecamatan) AS id, 
          nama_kecamatan, 
          ST_Union(geom) AS geom
        FROM batas_kelurahan
        GROUP BY nama_kecamatan
        ON CONFLICT (id) DO NOTHING;
      `);

      await client.query(`
        INSERT INTO kelurahan (id, nama_kelurahan, geom, id_kecamatan)
        SELECT 
          LOWER(nama_kelurahan) AS id, 
          nama_kelurahan, 
          geom, 
          LOWER(nama_kecamatan) AS id_kecamatan
        FROM batas_kelurahan
        ON CONFLICT (id) DO NOTHING;
      `);

      await client.query(`DROP TABLE IF EXISTS batas_kelurahan CASCADE;`);
      console.log('batas_kelurahan successfully migrated and dropped.');
    }

    // Check SPPG ID type for migration
    const sppgExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'sppg'
      );
    `);

    let migrateSppg = false;
    if (sppgExists.rows[0].exists) {
      const sppgIdType = await client.query(`
        SELECT data_type FROM information_schema.columns 
        WHERE table_name = 'sppg' AND column_name = 'id';
      `);
      if (sppgIdType.rows[0]?.data_type === 'integer') {
        migrateSppg = true;
      }
    }

    if (migrateSppg) {
      console.log('Migrating sppg table to match VARCHAR id and new columns...');
      await client.query(`ALTER TABLE sppg RENAME TO sppg_old;`);
    }

    // Table sppg
    await client.query(`
      CREATE TABLE IF NOT EXISTS sppg (
        id             VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        nama_sppg      VARCHAR(255) NOT NULL,
        alamat         VARCHAR(255),
        geom           GEOMETRY(Point, 4326) NOT NULL,
        id_kelurahan   VARCHAR(50) REFERENCES kelurahan(id) ON DELETE SET NULL,
        node_id        INTEGER,
        created_at     TIMESTAMP DEFAULT NOW()
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_sppg_geom ON sppg USING GIST(geom);`);

    if (migrateSppg) {
      await client.query(`
        INSERT INTO sppg (id, nama_sppg, alamat, geom, node_id, created_at, id_kelurahan)
        SELECT 
          id::varchar, 
          nama_sppg, 
          alamat, 
          geom, 
          node_id, 
          created_at,
          (SELECT id FROM kelurahan WHERE ST_Contains(geom, sppg_old.geom) LIMIT 1)
        FROM sppg_old;
      `);
      await client.query(`DROP TABLE IF EXISTS sppg_old CASCADE;`);
      console.log('sppg table successfully migrated.');
    }

    // Check Sekolah ID type for migration
    const sekolahExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'sekolah'
      );
    `);

    let migrateSekolah = false;
    if (sekolahExists.rows[0].exists) {
      const sekolahIdType = await client.query(`
        SELECT data_type FROM information_schema.columns 
        WHERE table_name = 'sekolah' AND column_name = 'id';
      `);
      if (sekolahIdType.rows[0]?.data_type === 'integer') {
        migrateSekolah = true;
      }
    }

    if (migrateSekolah) {
      console.log('Migrating sekolah table to match VARCHAR id, nama_satuan_pendidikan, and enum jenjang...');
      await client.query(`ALTER TABLE sekolah RENAME TO sekolah_old;`);
    }

    // Table sekolah
    await client.query(`
      CREATE TABLE IF NOT EXISTS sekolah (
        id                      VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        nama_satuan_pendidikan   VARCHAR(255) NOT NULL,
        jenjang                 jenjang_type NOT NULL,
        alamat                  VARCHAR(255),
        geom                    GEOMETRY(Point, 4326) NOT NULL,
        id_kelurahan            VARCHAR(50) REFERENCES kelurahan(id) ON DELETE SET NULL,
        node_id                 INTEGER,
        created_at              TIMESTAMP DEFAULT NOW()
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_sekolah_geom ON sekolah USING GIST(geom);`);

    if (migrateSekolah) {
      await client.query(`
        INSERT INTO sekolah (id, nama_satuan_pendidikan, jenjang, alamat, geom, node_id, created_at, id_kelurahan)
        SELECT 
          id::varchar, 
          nama_sekolah, 
          jenjang::jenjang_type, 
          alamat, 
          geom, 
          node_id, 
          created_at,
          (SELECT id FROM kelurahan WHERE ST_Contains(geom, sekolah_old.geom) LIMIT 1)
        FROM sekolah_old;
      `);
      await client.query(`DROP TABLE IF EXISTS sekolah_old CASCADE;`);
      console.log('sekolah table successfully migrated.');
    }

    // Table jaringan_jalan
    await client.query(`
      CREATE TABLE IF NOT EXISTS jaringan_jalan (
        id        BIGINT PRIMARY KEY,
        nama_jalan VARCHAR(255),
        kelas_jalan VARCHAR(50),
        source    INTEGER,
        target    INTEGER,
        cost      FLOAT,
        reverse_cost FLOAT,
        geom      GEOMETRY NOT NULL
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_jalan_geom ON jaringan_jalan USING GIST(geom);`);

    // Ensure geom column can accept Z-dimension geometries if the table already exists
    try {
      await client.query(`ALTER TABLE jaringan_jalan ALTER COLUMN geom TYPE GEOMETRY;`);
    } catch (geomAlterError) {
      console.warn('Failed to alter geom column type to generic GEOMETRY:', geomAlterError);
    }

    // Ensure SRID of jaringan_jalan is 4326 to prevent mixed SRID errors
    try {
      await client.query(`UPDATE jaringan_jalan SET geom = ST_SetSRID(geom, 4326) WHERE ST_SRID(geom) = 0 OR ST_SRID(geom) IS NULL;`);
    } catch (sridError) {
      console.warn('Failed to update ST_SetSRID on jaringan_jalan:', sridError);
    }

    // Ensure pgRouting columns exist even if the table already existed (e.g. created by shapefile import)
    await client.query(`ALTER TABLE jaringan_jalan ADD COLUMN IF NOT EXISTS source INTEGER;`);
    await client.query(`ALTER TABLE jaringan_jalan ADD COLUMN IF NOT EXISTS target INTEGER;`);
    await client.query(`ALTER TABLE jaringan_jalan ADD COLUMN IF NOT EXISTS cost FLOAT;`);
    await client.query(`ALTER TABLE jaringan_jalan ADD COLUMN IF NOT EXISTS reverse_cost FLOAT;`);

    await client.query(`CREATE INDEX IF NOT EXISTS idx_jalan_source ON jaringan_jalan(source);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_jalan_target ON jaringan_jalan(target);`);

    // Build network topology if source or target are unassigned
    const checkTopology = await client.query(`SELECT COUNT(*) FROM jaringan_jalan WHERE source IS NULL OR target IS NULL`);
    if (parseInt(checkTopology.rows[0].count, 10) > 0) {
      console.log('Building network topology for jaringan_jalan...');
      await client.query(`UPDATE jaringan_jalan SET cost = ST_Length(geom::geography) WHERE cost IS NULL;`);
      await client.query(`UPDATE jaringan_jalan SET reverse_cost = ST_Length(geom::geography) WHERE reverse_cost IS NULL;`);
      try {
        await client.query(`SELECT pgr_createTopology('jaringan_jalan', 0.00001, 'geom', 'id');`);
        console.log('Topology successfully built.');
      } catch (topoError) {
        console.warn('pgr_createTopology failed, calculating source/target nodes spatially instead:', topoError);
        // Fallback: Manually assign source/target based on start/end coordinates of the merged LineStrings
        await client.query(`
          WITH vertices AS (
            SELECT id, 
              ST_StartPoint(ST_LineMerge(geom)) AS start_pt, 
              ST_EndPoint(ST_LineMerge(geom)) AS end_pt 
            FROM jaringan_jalan
          ),
          nodes AS (
            SELECT DISTINCT geom FROM (
              SELECT start_pt AS geom FROM vertices WHERE start_pt IS NOT NULL
              UNION
              SELECT end_pt FROM vertices WHERE end_pt IS NOT NULL
            ) n
          ),
          nodes_with_id AS (
            SELECT geom, row_number() OVER () AS node_id FROM nodes
          )
          UPDATE jaringan_jalan j
          SET 
            source = (SELECT node_id FROM nodes_with_id WHERE ST_Equals(nodes_with_id.geom, ST_StartPoint(ST_LineMerge(j.geom))) LIMIT 1),
            target = (SELECT node_id FROM nodes_with_id WHERE ST_Equals(nodes_with_id.geom, ST_EndPoint(ST_LineMerge(j.geom))) LIMIT 1)
          WHERE source IS NULL OR target IS NULL;
        `);
        console.log('Manual spatial node assignment completed.');
      }
    }

    // Auto-update id_kelurahan relationships for sppg and sekolah if they are null
    await client.query(`
      UPDATE sppg SET id_kelurahan = (
        SELECT id FROM kelurahan WHERE ST_Contains(geom, sppg.geom) LIMIT 1
      ) WHERE id_kelurahan IS NULL;
    `);

    await client.query(`
      UPDATE sekolah SET id_kelurahan = (
        SELECT id FROM kelurahan WHERE ST_Contains(geom, sekolah.geom) LIMIT 1
      ) WHERE id_kelurahan IS NULL;
    `);

    console.log('Database schema successfully initialized.');

  } catch (err) {
    console.error('Error initializing tables:', err);
    throw err;
  } finally {
    client.release();
  }
}

export const ensureInit = async () => {
  if (!initPromise) {
    initPromise = initializeDatabase();
  }
  return initPromise;
};

export const query = async (text: string, params?: any[]) => {
  await ensureInit();
  return pool.query(text, params);
};

export default { query, ensureInit };
