const { Pool } = require('pg');
const databaseUrl = 'postgresql://postgres@localhost:5432/sppg_gis_db';
const pool = new Pool({ connectionString: databaseUrl });

async function run() {
  const client = await pool.connect();
  try {
    const sppgRes = await client.query('SELECT id, node_id, nama_sppg FROM sppg LIMIT 1');
    if (sppgRes.rows.length === 0) {
      console.log("No SPPGs found.");
      return;
    }
    const sppg = sppgRes.rows[0];
    console.log("Selected SPPG:", sppg);
    
    const routesRes = await client.query(`
      SELECT 
        s.id AS sekolah_id,
        s.node_id AS school_node_id,
        -1 AS edge,
        1 AS path_seq,
        ST_AsGeoJSON(ST_MakeLine(sp.geom, s.geom))::json AS geometry
      FROM sekolah s
      CROSS JOIN sppg sp
      WHERE sp.id = $1
        AND ST_Distance(s.geom::geography, sp.geom::geography) <= 6000
    `, [sppg.id]);
    
    console.log("Fallback Route count:", routesRes.rows.length);
    console.log("Sample route geometry:", routesRes.rows[0]?.geometry);
  } catch (err) {
    console.error("FAILED:", err);
  } finally {
    client.release();
    await pool.end();
  }
}
run();
