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
          CASE WHEN $2 ~ '^[0-9A-Fa-f]+$' THEN ST_GeomFromWKB(decode($2, 'hex'), 4326) ELSE NULL END,
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
      SELECT pgr_createTopology('jaringan_jalan', 0.0001, 'geom', 'id');
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

  // Step 5: Fast temp table fallback topology assignment
  if (!topologyBuilt) {
    console.log('[seeder] 03 - Running fast temp table topology fallback...');
    try {
      await client.query(`
        CREATE TEMP TABLE temp_nodes (
          node_id SERIAL PRIMARY KEY,
          geom GEOMETRY NOT NULL
        );
      `);

      await client.query(`
        WITH normalized_geom AS (
          SELECT id,
            ST_LineMerge(geom) AS merged_geom
          FROM jaringan_jalan
          WHERE geom IS NOT NULL
        ),
        endpoints AS (
          SELECT id,
            ST_SetSRID(ST_StartPoint(
              CASE WHEN ST_GeometryType(merged_geom) = 'ST_LineString' THEN merged_geom
                   ELSE ST_GeometryN(merged_geom, 1)
              END
            ), 4326) AS start_pt,
            ST_SetSRID(ST_EndPoint(
              CASE WHEN ST_GeometryType(merged_geom) = 'ST_LineString' THEN merged_geom
                   ELSE ST_GeometryN(merged_geom, 1)
              END
            ), 4326) AS end_pt
          FROM normalized_geom
        )
        INSERT INTO temp_nodes (geom)
        SELECT DISTINCT geom FROM (
          SELECT start_pt AS geom FROM endpoints WHERE start_pt IS NOT NULL
          UNION
          SELECT end_pt AS geom FROM endpoints WHERE end_pt IS NOT NULL
        ) sub;
      `);

      await client.query(`
        CREATE INDEX idx_temp_nodes_geom ON temp_nodes USING GIST(geom);
      `);

      await client.query(`ANALYZE temp_nodes;`);

      await client.query(`
        WITH normalized_geom AS (
          SELECT id,
            ST_LineMerge(geom) AS merged_geom
          FROM jaringan_jalan
          WHERE geom IS NOT NULL
        ),
        endpoints AS (
          SELECT id,
            ST_SetSRID(ST_StartPoint(
              CASE WHEN ST_GeometryType(merged_geom) = 'ST_LineString' THEN merged_geom
                   ELSE ST_GeometryN(merged_geom, 1)
              END
            ), 4326) AS start_pt
          FROM normalized_geom
        )
        UPDATE jaringan_jalan j
        SET source = n.node_id
        FROM endpoints e
        JOIN temp_nodes n ON ST_Equals(n.geom, e.start_pt)
        WHERE j.id = e.id AND j.source IS NULL;
      `);

      await client.query(`
        WITH normalized_geom AS (
          SELECT id,
            ST_LineMerge(geom) AS merged_geom
          FROM jaringan_jalan
          WHERE geom IS NOT NULL
        ),
        endpoints AS (
          SELECT id,
            ST_SetSRID(ST_EndPoint(
              CASE WHEN ST_GeometryType(merged_geom) = 'ST_LineString' THEN merged_geom
                   ELSE ST_GeometryN(merged_geom, 1)
              END
            ), 4326) AS end_pt
          FROM normalized_geom
        )
        UPDATE jaringan_jalan j
        SET target = n.node_id
        FROM endpoints e
        JOIN temp_nodes n ON ST_Equals(n.geom, e.end_pt)
        WHERE j.id = e.id AND j.target IS NULL;
      `);

      await client.query(`DROP TABLE IF EXISTS temp_nodes;`);

      const verify = await client.query(`
        SELECT COUNT(*) FROM jaringan_jalan WHERE source IS NOT NULL
      `);
      const count = parseInt(verify.rows[0].count, 10);
      if (count > 0) {
        topologyBuilt = true;
        console.log(`[seeder] 03 - Fast fallback succeeded: ${count} edges with source/target.`);
      } else {
        console.error('[seeder] 03 - Fast fallback also failed. node_id assignment may be incomplete.');
      }
    } catch (err: any) {
      console.error('[seeder] 03 - Fast fallback failed:', err.message);
    }
  }

  console.log(`[seeder] 03 - Done. Topology built: ${topologyBuilt}`);
}
