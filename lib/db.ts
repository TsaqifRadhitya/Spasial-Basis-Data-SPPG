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
    console.log('Creating extensions and tables...');
    await client.query(`CREATE EXTENSION IF NOT EXISTS postgis`);
    await client.query(`CREATE EXTENSION IF NOT EXISTS pgrouting`);

    // Table sppg
    await client.query(`
      CREATE TABLE IF NOT EXISTS sppg (
        id          SERIAL PRIMARY KEY,
        nama_sppg   VARCHAR(255) NOT NULL,
        alamat      TEXT,
        node_id     INTEGER,
        geom        GEOMETRY(Point, 4326) NOT NULL,
        created_at  TIMESTAMP DEFAULT NOW()
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_sppg_geom ON sppg USING GIST(geom);`);

    // Table sekolah
    await client.query(`
      CREATE TABLE IF NOT EXISTS sekolah (
        id              SERIAL PRIMARY KEY,
        nama_sekolah    VARCHAR(255) NOT NULL,
        jenjang         VARCHAR(10) CHECK (jenjang IN ('SD', 'SMP', 'SMA', 'SMK')),
        alamat          TEXT,
        nama_kelurahan  VARCHAR(100),
        node_id         INTEGER,
        geom            GEOMETRY(Point, 4326) NOT NULL,
        created_at      TIMESTAMP DEFAULT NOW()
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_sekolah_geom ON sekolah USING GIST(geom);`);

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
        geom      GEOMETRY(LineString, 4326) NOT NULL
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_jalan_geom ON jaringan_jalan USING GIST(geom);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_jalan_source ON jaringan_jalan(source);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_jalan_target ON jaringan_jalan(target);`);

    // Table batas_kelurahan
    await client.query(`
      CREATE TABLE IF NOT EXISTS batas_kelurahan (
        id               SERIAL PRIMARY KEY,
        nama_kelurahan   VARCHAR(100) NOT NULL,
        nama_kecamatan   VARCHAR(100) DEFAULT 'Sumbersari',
        geom             GEOMETRY(Polygon, 4326) NOT NULL
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_kelurahan_geom ON batas_kelurahan USING GIST(geom);`);

    // Table service_area
    await client.query(`
      CREATE TABLE IF NOT EXISTS service_area (
        id                  SERIAL PRIMARY KEY,
        sppg_id             INTEGER REFERENCES sppg(id) ON DELETE CASCADE,
        service_area_geom   GEOMETRY(Polygon, 4326),
        max_cost_meter      FLOAT DEFAULT 6000,
        created_at          TIMESTAMP DEFAULT NOW()
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_service_area_geom ON service_area USING GIST(service_area_geom);`);

    // Table sekolah_blank_spot
    await client.query(`
      CREATE TABLE IF NOT EXISTS sekolah_blank_spot (
        id           SERIAL PRIMARY KEY,
        sekolah_id   INTEGER REFERENCES sekolah(id) ON DELETE CASCADE,
        kluster_id   INTEGER,
        geom         GEOMETRY(Point, 4326)
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_blank_spot_geom ON sekolah_blank_spot USING GIST(geom);`);

    // Table rekomendasi_sppg
    await client.query(`
      CREATE TABLE IF NOT EXISTS rekomendasi_sppg (
        id                      SERIAL PRIMARY KEY,
        kluster_id              INTEGER UNIQUE,
        jumlah_sekolah          INTEGER,
        titik_rekomendasi_sppg  GEOMETRY(Point, 4326),
        created_at              TIMESTAMP DEFAULT NOW()
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_rekomendasi_geom ON rekomendasi_sppg USING GIST(titik_rekomendasi_sppg);`);

    // 4. Seeding is not needed per request
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
