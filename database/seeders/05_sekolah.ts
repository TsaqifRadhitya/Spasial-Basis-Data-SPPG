import path from 'path';
import { PoolClient } from 'pg';
import { parseCSV, toNull } from '../../lib/utils/csv';

export async function seed(client: PoolClient) {
  console.log('[seeder] 05 - Seeding sekolah...');

  const rows = parseCSV(path.join(process.cwd(), 'seeds/sekolah.csv'));

  for (const r of rows) {
    await client.query(`
      INSERT INTO sekolah (id, nama_satuan_pendidikan, jenjang, alamat, geom, id_kelurahan, node_id, created_at)
      VALUES (
        $1,
        $2,
        $3::jenjang_type,
        $4,
        COALESCE(
          CASE WHEN $5 ~ '^[0-9A-Fa-f]+$' THEN ST_GeomFromWKB(decode($5, 'hex'), 4326) ELSE NULL END,
          ST_GeomFromText($5, 4326)
        ),
        COALESCE(
          $6,
          (SELECT id FROM kelurahan k
           WHERE ST_Contains(k.geom,
             COALESCE(
               CASE WHEN $5 ~ '^[0-9A-Fa-f]+$' THEN ST_GeomFromWKB(decode($5, 'hex'), 4326) ELSE NULL END,
               ST_GeomFromText($5, 4326)
             )
           ) LIMIT 1)
        ),
        COALESCE(
          $7::integer,
          (
            SELECT node_id FROM (
              SELECT source AS node_id,
                geom <-> COALESCE(
                  CASE WHEN $5 ~ '^[0-9A-Fa-f]+$' THEN ST_GeomFromWKB(decode($5, 'hex'), 4326) ELSE NULL END,
                  ST_GeomFromText($5, 4326)
                ) AS dist
              FROM jaringan_jalan
              UNION ALL
              SELECT target,
                geom <-> COALESCE(
                  CASE WHEN $5 ~ '^[0-9A-Fa-f]+$' THEN ST_GeomFromWKB(decode($5, 'hex'), 4326) ELSE NULL END,
                  ST_GeomFromText($5, 4326)
                ) AS dist
              FROM jaringan_jalan
            ) sub
            ORDER BY dist
            LIMIT 1
          )
        ),
        COALESCE($8::timestamp, NOW())
      )
      ON CONFLICT (id) DO UPDATE
        SET nama_satuan_pendidikan = EXCLUDED.nama_satuan_pendidikan,
            jenjang                = EXCLUDED.jenjang,
            alamat                 = EXCLUDED.alamat,
            geom                   = EXCLUDED.geom,
            id_kelurahan           = EXCLUDED.id_kelurahan,
            node_id                = EXCLUDED.node_id,
            created_at             = EXCLUDED.created_at,
            id_sppg                = NULL,
            jalur_distribusi       = NULL
    `, [r.id, r.nama_satuan_pendidikan, r.jenjang, r.alamat, r.geom,
    toNull(r.id_kelurahan), toNull(r.node_id), toNull(r.created_at)]);
  }
  console.log(`[seeder] 05 - Inserted ${rows.length} sekolah records.`);

  // Assign id_sppg via pgRouting driving distance (≤ 6km)
  console.log('[seeder] 05 - Assigning id_sppg via pgRouting...');
  let routingOk = false;
  try {
    await client.query(`UPDATE sekolah SET id_sppg = NULL, jalur_distribusi = NULL;`);
    await client.query(`
      WITH school_sppg_costs AS (
        SELECT
          s.id AS sekolah_id,
          sp.id AS sppg_id,
          dd.agg_cost AS cost,
          ROW_NUMBER() OVER (PARTITION BY s.id ORDER BY dd.agg_cost ASC) AS rn
        FROM sekolah s
        CROSS JOIN sppg sp
        JOIN LATERAL (
          SELECT agg_cost
          FROM pgr_drivingDistance(
            'SELECT id, source, target, cost FROM jaringan_jalan WHERE source IS NOT NULL AND target IS NOT NULL',
            sp.node_id,
            6000,
            false
          ) AS dd
          WHERE dd.node = s.node_id
        ) dd ON true
        WHERE dd.agg_cost <= 6000
      )
      UPDATE sekolah s
      SET id_sppg = ssc.sppg_id
      FROM school_sppg_costs ssc
      WHERE s.id = ssc.sekolah_id AND ssc.rn = 1;
    `);
    console.log('[seeder] 05 - id_sppg assigned via pgRouting.');

    // Compute jalur_distribusi via Dijkstra
    await client.query(`
      UPDATE sekolah s
      SET jalur_distribusi = (
        SELECT ST_LineMerge(ST_Collect(j.geom ORDER BY r.path_seq))
        FROM pgr_dijkstra(
          'SELECT id, source, target, cost FROM jaringan_jalan WHERE source IS NOT NULL AND target IS NOT NULL',
          sp.node_id,
          s.node_id,
          false
        ) AS r
        JOIN jaringan_jalan j ON r.edge = j.id
      )
      FROM sppg sp
      WHERE s.id_sppg = sp.id
        AND s.node_id IS NOT NULL
        AND sp.node_id IS NOT NULL;
    `);
    console.log('[seeder] 05 - jalur_distribusi computed via Dijkstra.');
    routingOk = true;
  } catch (err: any) {
    console.warn('[seeder] 05 - pgRouting failed, using spatial fallback:', err.message);
  }

  if (!routingOk) {
    try {
      await client.query(`
        WITH school_sppg_distances AS (
          SELECT
            s.id AS sekolah_id,
            sp.id AS sppg_id,
            ST_Distance(s.geom::geography, sp.geom::geography) AS dist,
            ROW_NUMBER() OVER (PARTITION BY s.id ORDER BY ST_Distance(s.geom::geography, sp.geom::geography) ASC) AS rn
          FROM sekolah s
          CROSS JOIN sppg sp
          WHERE ST_Distance(s.geom::geography, sp.geom::geography) <= 6000
        )
        UPDATE sekolah s
        SET id_sppg = ssd.sppg_id
        FROM school_sppg_distances ssd
        WHERE s.id = ssd.sekolah_id AND ssd.rn = 1;
      `);
      // Fallback jalur: straight line
      await client.query(`
        UPDATE sekolah s
        SET jalur_distribusi = ST_MakeLine(sp.geom, s.geom)
        FROM sppg sp
        WHERE s.id_sppg = sp.id;
      `);
      console.log('[seeder] 05 - Spatial fallback: id_sppg + jalur_distribusi (straight line) assigned.');
    } catch (err: any) {
      console.error('[seeder] 05 - Spatial fallback also failed:', err.message);
    }
  }

  console.log('[seeder] 05 - Done.');
}
