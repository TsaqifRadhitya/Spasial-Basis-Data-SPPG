import path from 'path';
import { PoolClient } from 'pg';
import { parseCSV } from '../../lib/utils/csv';

export async function seed(client: PoolClient) {
  console.log('[seeder] 03 - Seeding jaringan_jalan...');

  const rows = parseCSV(path.join(process.cwd(), 'seeds/jaringan_jalan.csv'), ';');

  for (const r of rows) {
    await client.query(`
      INSERT INTO jaringan_jalan (id, geom)
      VALUES (
        $1::bigint,
        COALESCE(
          CASE WHEN $2 ~ '^[0-9A-Fa-f]+$' THEN ST_GeomFromWKB(decode($2, 'hex')) ELSE NULL END,
          ST_GeomFromText($2, 4326)
        )
      )
      ON CONFLICT (id) DO UPDATE SET geom = EXCLUDED.geom
    `, [r.id, r.geom]);
  }
  console.log(`[seeder] 03 - Inserted ${rows.length} raw segments.`);

  // Step 1: Fix SRID
  await client.query(`
    UPDATE jaringan_jalan
    SET geom = ST_SetSRID(geom, 4326)
    WHERE ST_SRID(geom) != 4326 OR ST_SRID(geom) IS NULL;
  `);

  // Step 2: Convert MultiLineString → LineString
  console.log('[seeder] 03 - Normalizing geometry types...');
  await client.query(`
    UPDATE jaringan_jalan
    SET geom = ST_SetSRID(ST_LineMerge(geom), 4326)
    WHERE ST_GeometryType(geom) IN ('ST_MultiLineString', 'ST_GeometryCollection');
  `);

  // Step 3: Calculate costs
  await client.query(`
    UPDATE jaringan_jalan
    SET cost = ST_Length(geom::geography),
        reverse_cost = ST_Length(geom::geography)
    WHERE cost IS NULL;
  `);

  // Step 4: Try pgr_createTopology
  let topologyBuilt = false;
  try {
    await client.query(`
      SELECT pgr_createTopology('jaringan_jalan', 0.00001, 'geom', 'id');
    `);
    const check = await client.query(`
      SELECT COUNT(*) FROM jaringan_jalan WHERE source IS NOT NULL AND target IS NOT NULL
    `);
    const count = parseInt(check.rows[0].count, 10);
    if (count > 0) {
      topologyBuilt = true;
      console.log(`[seeder] 03 - pgr_createTopology succeeded: ${count} edges.`);
    } else {
      console.warn('[seeder] 03 - pgr_createTopology ran but source/target still NULL, using fallback...');
    }
  } catch (err: any) {
    console.warn('[seeder] 03 - pgr_createTopology failed:', err.message);
  }

  // Step 5: CTE fallback (fast ST_Equals bulk approach)
  if (!topologyBuilt) {
    console.log('[seeder] 03 - Running CTE topology fallback...');
    try {
      await client.query(`
        WITH vertices AS (
          SELECT id,
            ST_StartPoint(ST_LineMerge(geom)) AS start_pt,
            ST_EndPoint(ST_LineMerge(geom))   AS end_pt
          FROM jaringan_jalan
          WHERE geom IS NOT NULL
        ),
        all_pts AS (
          SELECT start_pt AS geom FROM vertices WHERE start_pt IS NOT NULL
          UNION
          SELECT end_pt             FROM vertices WHERE end_pt IS NOT NULL
        ),
        nodes_with_id AS (
          SELECT geom, ROW_NUMBER() OVER () AS node_id FROM all_pts
        )
        UPDATE jaringan_jalan j
        SET
          source = (SELECT node_id FROM nodes_with_id WHERE ST_Equals(nodes_with_id.geom, ST_StartPoint(ST_LineMerge(j.geom))) LIMIT 1),
          target = (SELECT node_id FROM nodes_with_id WHERE ST_Equals(nodes_with_id.geom, ST_EndPoint(ST_LineMerge(j.geom)))  LIMIT 1)
        WHERE source IS NULL OR target IS NULL;
      `);

      const verify = await client.query(`
        SELECT COUNT(*) FROM jaringan_jalan WHERE source IS NOT NULL
      `);
      const count = parseInt(verify.rows[0].count, 10);
      if (count > 0) {
        topologyBuilt = true;
        console.log(`[seeder] 03 - CTE fallback succeeded: ${count} edges with source/target.`);
      } else {
        console.error('[seeder] 03 - CTE fallback also failed. node_id assignment may be incomplete.');
      }
    } catch (err: any) {
      console.error('[seeder] 03 - CTE fallback failed:', err.message);
    }
  }

  console.log(`[seeder] 03 - Done. Topology built: ${topologyBuilt}`);
}
