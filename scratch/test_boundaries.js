const { Pool } = require('pg');
const databaseUrl = 'postgresql://postgres@localhost:5432/sppg_gis_db';
const pool = new Pool({ connectionString: databaseUrl });

async function run() {
  const client = await pool.connect();
  try {
    const res = await client.query(`
        -- 1. All Kecamatan except Sumbersari
        SELECT 
          id,
          nama_kecamatan AS nama,
          'kecamatan' AS tipe,
          NULL AS kecamatan,
          ST_AsGeoJSON(geom)::json AS geometry,
          0 AS total_sekolah,
          0 AS terlayani_count,
          0 AS blank_spot_count
        FROM kecamatan
        WHERE LOWER(nama_kecamatan) != 'sumbersari'

        UNION ALL

        -- 2. Sumbersari Kelurahans with coverage stats
        SELECT 
          k.id,
          k.nama_kelurahan AS nama,
          'kelurahan' AS tipe,
          kec.nama_kecamatan AS kecamatan,
          ST_AsGeoJSON(k.geom)::json AS geometry,
          COUNT(s.id) AS total_sekolah,
          SUM(CASE WHEN sbs.sekolah_id IS NULL AND s.id IS NOT NULL THEN 1 ELSE 0 END) AS terlayani_count,
          SUM(CASE WHEN sbs.sekolah_id IS NOT NULL THEN 1 ELSE 0 END) AS blank_spot_count
        FROM kelurahan k
        LEFT JOIN kecamatan kec ON k.id_kecamatan = kec.id
        LEFT JOIN sekolah s ON s.id_kelurahan = k.id
        LEFT JOIN (
          WITH served_sekolah AS (
            SELECT DISTINCT s.id
            FROM sppg sp
            CROSS JOIN sekolah s
            WHERE ST_Distance(s.geom::geography, sp.geom::geography) <= 6000
          )
          SELECT id AS sekolah_id
          FROM sekolah
          WHERE id NOT IN (SELECT id FROM served_sekolah)
        ) sbs ON sbs.sekolah_id = s.id
        WHERE LOWER(kec.nama_kecamatan) = 'sumbersari'
        GROUP BY k.id, k.nama_kelurahan, kec.nama_kecamatan, k.geom
    `);
    
    console.log("Boundary row count:", res.rows.length);
    console.log("Kecamatan count:", res.rows.filter(r => r.tipe === 'kecamatan').length);
    console.log("Kelurahan (Sumbersari) count:", res.rows.filter(r => r.tipe === 'kelurahan').length);
    console.log("Sample kelurahan row:", res.rows.find(r => r.tipe === 'kelurahan'));
  } catch (err) {
    console.error("FAILED:", err);
  } finally {
    client.release();
    await pool.end();
  }
}
run();
