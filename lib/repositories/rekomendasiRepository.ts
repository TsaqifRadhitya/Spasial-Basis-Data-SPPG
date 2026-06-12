import { query } from '../../database/db';

export class RekomendasiRepository {
  static async clearAll() {
    // No-op
  }

  static async recalculateBlankSpots(servedSchoolIds: string[]) {
    // No-op
  }

  static async getAll() {
    try {
      const res = await query(`
        WITH blank_spot_sekolah AS (
          SELECT 
            id, 
            geom,
            COALESCE(ST_ClusterDBSCAN(geom, 0.054, 1) OVER (), 0) AS kluster_id
          FROM sekolah
          WHERE id_sppg IS NULL
        )
        SELECT 
          kluster_id AS id,
          kluster_id,
          COUNT(*) AS jumlah_sekolah,
          ST_X(ST_Centroid(ST_Collect(geom))) AS longitude,
          ST_Y(ST_Centroid(ST_Collect(geom))) AS latitude
        FROM blank_spot_sekolah
        GROUP BY kluster_id
        ORDER BY jumlah_sekolah DESC
      `);
      return res.rows;
    } catch (e) {
      console.warn('getAll query failed:', e);
      const res = await query(`
        WITH blank_spot_sekolah AS (
          SELECT 
            id, 
            geom,
            COALESCE(ST_ClusterDBSCAN(geom, 0.054, 1) OVER (), 0) AS kluster_id
          FROM sekolah
          WHERE id_sppg IS NULL
        )
        SELECT 
          kluster_id AS id,
          kluster_id,
          COUNT(*) AS jumlah_sekolah,
          ST_X(ST_Centroid(ST_Collect(geom))) AS longitude,
          ST_Y(ST_Centroid(ST_Collect(geom))) AS latitude
        FROM blank_spot_sekolah
        GROUP BY kluster_id
        ORDER BY jumlah_sekolah DESC
      `);
      return res.rows;
    }
  }

  static async getValidasi() {
    try {
      const res = await query(`
        WITH blank_spot_sekolah AS (
          SELECT 
            id, 
            nama_satuan_pendidikan AS nama_sekolah,
            geom,
            COALESCE(ST_ClusterDBSCAN(geom, 0.054, 1) OVER (), 0) AS kluster_id
          FROM sekolah
          WHERE id_sppg IS NULL
        ),
        rekomendasi AS (
          SELECT 
            kluster_id,
            ST_Centroid(ST_Collect(geom)) AS titik_rekomendasi_sppg
          FROM blank_spot_sekolah
          GROUP BY kluster_id
        )
        SELECT 
          r.kluster_id,
          sbs.nama_sekolah,
          ROUND(ST_Distance(r.titik_rekomendasi_sppg::geography, sbs.geom::geography)::numeric, 2) AS jarak_meter,
          CASE 
            WHEN ST_Distance(r.titik_rekomendasi_sppg::geography, sbs.geom::geography) <= 6000 THEN 'Terjangkau'
            ELSE 'Di luar jangkauan'
          END AS status_validasi
        FROM rekomendasi r
        JOIN blank_spot_sekolah sbs ON sbs.kluster_id = r.kluster_id
        ORDER BY r.kluster_id, jarak_meter
      `);
      return res.rows;
    } catch (e) {
      console.warn('getValidasi query failed:', e);
      const res = await query(`
        WITH blank_spot_sekolah AS (
          SELECT 
            id, 
            nama_satuan_pendidikan AS nama_sekolah,
            geom,
            COALESCE(ST_ClusterDBSCAN(geom, 0.054, 1) OVER (), 0) AS kluster_id
          FROM sekolah
          WHERE id_sppg IS NULL
        ),
        rekomendasi AS (
          SELECT 
            kluster_id,
            ST_Centroid(ST_Collect(geom)) AS titik_rekomendasi_sppg
          FROM blank_spot_sekolah
          GROUP BY kluster_id
        )
        SELECT 
          r.kluster_id,
          sbs.nama_sekolah,
          ROUND(ST_Distance(r.titik_rekomendasi_sppg::geography, sbs.geom::geography)::numeric, 2) AS jarak_meter,
          CASE 
            WHEN ST_Distance(r.titik_rekomendasi_sppg::geography, sbs.geom::geography) <= 6000 THEN 'Terjangkau'
            ELSE 'Di luar jangkauan'
          END AS status_validasi
        FROM rekomendasi r
        JOIN blank_spot_sekolah sbs ON sbs.kluster_id = r.kluster_id
        ORDER BY r.kluster_id, jarak_meter
      `);
      return res.rows;
    }
  }
}
