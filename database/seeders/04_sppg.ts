import path from 'path';
import { PoolClient } from 'pg';
import { parseCSV, toNull } from '../../lib/utils/csv';

export async function seed(client: PoolClient) {
  console.log('[seeder] 04 - Seeding sppg...');

  const rows = parseCSV(path.join(process.cwd(), 'seeds/sppg.csv'));

  for (const r of rows) {
    await client.query(`
      INSERT INTO sppg (id, nama_sppg, alamat, geom, id_kelurahan, node_id, created_at)
      VALUES (
        $1,
        $2,
        $3,
        COALESCE(
          CASE WHEN $4 ~ '^[0-9A-Fa-f]+$' THEN ST_GeomFromWKB(decode($4, 'hex')) ELSE NULL END,
          ST_GeomFromText($4, 4326)
        ),
        COALESCE(
          $5,
          (SELECT id FROM kelurahan k
           WHERE ST_Contains(k.geom,
             COALESCE(
               CASE WHEN $4 ~ '^[0-9A-Fa-f]+$' THEN ST_GeomFromWKB(decode($4, 'hex')) ELSE NULL END,
               ST_GeomFromText($4, 4326)
             )
           ) LIMIT 1)
        ),
        COALESCE(
          $6::integer,
          (
            SELECT node_id FROM (
              SELECT source AS node_id,
                geom <-> COALESCE(
                  CASE WHEN $4 ~ '^[0-9A-Fa-f]+$' THEN ST_GeomFromWKB(decode($4, 'hex')) ELSE NULL END,
                  ST_GeomFromText($4, 4326)
                ) AS dist
              FROM jaringan_jalan
              UNION ALL
              SELECT target,
                geom <-> COALESCE(
                  CASE WHEN $4 ~ '^[0-9A-Fa-f]+$' THEN ST_GeomFromWKB(decode($4, 'hex')) ELSE NULL END,
                  ST_GeomFromText($4, 4326)
                ) AS dist
              FROM jaringan_jalan
            ) sub
            ORDER BY dist
            LIMIT 1
          )
        ),
        COALESCE($7::timestamp, NOW())
      )
      ON CONFLICT (id) DO UPDATE
        SET nama_sppg    = EXCLUDED.nama_sppg,
            alamat       = EXCLUDED.alamat,
            geom         = EXCLUDED.geom,
            id_kelurahan = EXCLUDED.id_kelurahan,
            node_id      = EXCLUDED.node_id,
            created_at   = EXCLUDED.created_at
    `, [r.id, r.nama_sppg, r.alamat, r.geom, toNull(r.id_kelurahan), toNull(r.node_id), toNull(r.created_at)]);
  }

  console.log(`[seeder] 04 - Seeded ${rows.length} SPPG records.`);
}
