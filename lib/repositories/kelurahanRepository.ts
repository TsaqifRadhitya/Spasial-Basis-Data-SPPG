import { query } from '../../database/db';

export class KelurahanRepository {
  static async getAllWithCoverageSummary() {
    try {
      const res = await query(`
        WITH served_sekolah AS (
          SELECT DISTINCT s.id
          FROM sppg sp
          CROSS JOIN sekolah s
          JOIN LATERAL (
            SELECT agg_cost 
            FROM pgr_drivingDistance(
              'SELECT id, source, target, cost FROM jaringan_jalan',
              sp.node_id,
              6000,
              false
            ) AS dd
            WHERE dd.node = s.node_id
          ) dd ON true
          WHERE dd.agg_cost <= 6000
        ),
        blank_spot_sekolah AS (
          SELECT id AS sekolah_id
          FROM sekolah
          WHERE id NOT IN (SELECT id FROM served_sekolah)
        )
        SELECT 
          k.id,
          k.nama_kelurahan,
          kec.nama_kecamatan,
          ST_AsGeoJSON(k.geom)::json AS geometry,
          COUNT(s.id) AS total_sekolah,
          SUM(CASE WHEN sbs.sekolah_id IS NULL AND s.id IS NOT NULL THEN 1 ELSE 0 END) AS terlayani_count,
          SUM(CASE WHEN sbs.sekolah_id IS NOT NULL THEN 1 ELSE 0 END) AS blank_spot_count
        FROM kelurahan k
        LEFT JOIN kecamatan kec ON k.id_kecamatan = kec.id
        LEFT JOIN sekolah s ON s.id_kelurahan = k.id
        LEFT JOIN blank_spot_sekolah sbs ON sbs.sekolah_id = s.id
        WHERE LOWER(kec.nama_kecamatan) = 'sumbersari'
        GROUP BY k.id, k.nama_kelurahan, kec.nama_kecamatan, k.geom
        ORDER BY k.nama_kelurahan
      `);
      return res.rows;
    } catch (e) {
      console.warn('pgRouting failed in getAllWithCoverageSummary, falling back to ST_Distance', e);
      const res = await query(`
        WITH served_sekolah AS (
          SELECT DISTINCT s.id
          FROM sppg sp
          CROSS JOIN sekolah s
          WHERE ST_Distance(s.geom::geography, sp.geom::geography) <= 6000
        ),
        blank_spot_sekolah AS (
          SELECT id AS sekolah_id
          FROM sekolah
          WHERE id NOT IN (SELECT id FROM served_sekolah)
        )
        SELECT 
          k.id,
          k.nama_kelurahan,
          kec.nama_kecamatan,
          ST_AsGeoJSON(k.geom)::json AS geometry,
          COUNT(s.id) AS total_sekolah,
          SUM(CASE WHEN sbs.sekolah_id IS NULL AND s.id IS NOT NULL THEN 1 ELSE 0 END) AS terlayani_count,
          SUM(CASE WHEN sbs.sekolah_id IS NOT NULL THEN 1 ELSE 0 END) AS blank_spot_count
        FROM kelurahan k
        LEFT JOIN kecamatan kec ON k.id_kecamatan = kec.id
        LEFT JOIN sekolah s ON s.id_kelurahan = k.id
        LEFT JOIN blank_spot_sekolah sbs ON sbs.sekolah_id = s.id
        WHERE LOWER(kec.nama_kecamatan) = 'sumbersari'
        GROUP BY k.id, k.nama_kelurahan, kec.nama_kecamatan, k.geom
        ORDER BY k.nama_kelurahan
      `);
      return res.rows;
    }
  }

  static async getAdminBoundaries() {
    try {
      const res = await query(`
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
            JOIN LATERAL (
              SELECT agg_cost 
              FROM pgr_drivingDistance(
                'SELECT id, source, target, cost FROM jaringan_jalan',
                sp.node_id,
                6000,
                false
              ) AS dd
              WHERE dd.node = s.node_id
            ) dd ON true
            WHERE dd.agg_cost <= 6000
          )
          SELECT id AS sekolah_id
          FROM sekolah
          WHERE id NOT IN (SELECT id FROM served_sekolah)
        ) sbs ON sbs.sekolah_id = s.id
        WHERE LOWER(kec.nama_kecamatan) = 'sumbersari'
        GROUP BY k.id, k.nama_kelurahan, kec.nama_kecamatan, k.geom;
      `);
      return res.rows;
    } catch (e) {
      console.warn('pgRouting failed in getAdminBoundaries, falling back to ST_Distance', e);
      const res = await query(`
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
        GROUP BY k.id, k.nama_kelurahan, kec.nama_kecamatan, k.geom;
      `);
      return res.rows;
    }
  }
}
