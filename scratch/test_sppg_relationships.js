const { Pool } = require('pg');
const databaseUrl = 'postgresql://postgres@localhost:5432/sppg_gis_db';
const pool = new Pool({ connectionString: databaseUrl });

async function run() {
  const client = await pool.connect();
  try {
    console.log("Running manual calculation queries...");
    
    const resBefore = await client.query('SELECT count(*) FROM sekolah WHERE id_sppg IS NOT NULL');
    const resNullBefore = await client.query('SELECT count(*) FROM sekolah WHERE id_sppg IS NULL');
    console.log("Before manual calculation - served schools count:", resBefore.rows[0].count);
    console.log("Before manual calculation - blank spot schools count:", resNullBefore.rows[0].count);

    await client.query('ALTER TABLE sekolah ADD COLUMN IF NOT EXISTS id_sppg VARCHAR(50) REFERENCES sppg(id) ON DELETE SET NULL;');
    await client.query('UPDATE sekolah SET id_sppg = NULL;');
    
    await client.query(`
      WITH school_sppg_distances AS (
        SELECT 
          s.id AS sekolah_id,
          sp.id AS sppg_id,
          ST_Distance(s.geom::geography, sp.geom::geography) as dist,
          ROW_NUMBER() OVER (PARTITION BY s.id ORDER BY ST_Distance(s.geom::geography, sp.geom::geography) ASC) as rn
        FROM sekolah s
        CROSS JOIN sppg sp
        WHERE ST_Distance(s.geom::geography, sp.geom::geography) <= 6000
      )
      UPDATE sekolah s
      SET id_sppg = ssd.sppg_id
      FROM school_sppg_distances ssd
      WHERE s.id = ssd.sekolah_id AND ssd.rn = 1;
    `);

    const resAfter = await client.query('SELECT count(*) FROM sekolah WHERE id_sppg IS NOT NULL');
    const resNullAfter = await client.query('SELECT count(*) FROM sekolah WHERE id_sppg IS NULL');
    console.log("After manual calculation - served schools count:", resAfter.rows[0].count);
    console.log("After manual calculation - blank spot schools count:", resNullAfter.rows[0].count);
    
    const sampleServed = await client.query('SELECT id, nama_satuan_pendidikan, id_sppg FROM sekolah WHERE id_sppg IS NOT NULL LIMIT 3');
    console.log("Sample served schools:", sampleServed.rows);
  } catch (err) {
    console.error("FAILED:", err);
  } finally {
    client.release();
    await pool.end();
  }
}
run();
