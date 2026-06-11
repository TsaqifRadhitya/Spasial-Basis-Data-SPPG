import { query } from '../db';

export class RekomendasiRepository {
  static async clearAll() {
    await query('DELETE FROM rekomendasi_sppg');
    await query('DELETE FROM sekolah_blank_spot');
  }

  static async recalculateBlankSpots(servedSchoolIds: number[]) {
    await this.clearAll();

    // 1. Insert blank spots and calculate clusters using ST_ClusterDBSCAN (eps 0.054 deg ~ 6km)
    let queryText = '';
    const params: any[] = [];

    if (servedSchoolIds.length > 0) {
      queryText = `
        INSERT INTO sekolah_blank_spot (sekolah_id, kluster_id, geom)
        SELECT 
          id, 
          COALESCE(ST_ClusterDBSCAN(geom, 0.054, 1) OVER (), 0) AS kluster_id,
          geom
        FROM sekolah
        WHERE id NOT IN (${servedSchoolIds.map((_, i) => `$${i + 1}`).join(', ')})
      `;
      params.push(...servedSchoolIds);
    } else {
      queryText = `
        INSERT INTO sekolah_blank_spot (sekolah_id, kluster_id, geom)
        SELECT 
          id, 
          COALESCE(ST_ClusterDBSCAN(geom, 0.054, 1) OVER (), 0) AS kluster_id,
          geom
        FROM sekolah
      `;
    }

    await query(queryText, params);

    // 2. Insert recommended centroids per cluster
    await query(`
      INSERT INTO rekomendasi_sppg (kluster_id, jumlah_sekolah, titik_rekomendasi_sppg)
      SELECT 
        kluster_id,
        COUNT(*) AS jumlah_sekolah_blank_spot,
        ST_Centroid(ST_Collect(geom)) AS titik_rekomendasi_sppg
      FROM sekolah_blank_spot
      GROUP BY kluster_id
    `);
  }

  static async getAll() {
    const res = await query(`
      SELECT 
        id, 
        kluster_id, 
        jumlah_sekolah,
        ST_X(titik_rekomendasi_sppg) AS longitude,
        ST_Y(titik_rekomendasi_sppg) AS latitude
      FROM rekomendasi_sppg
      ORDER BY jumlah_sekolah DESC
    `);
    return res.rows;
  }

  static async getValidasi() {
    const res = await query(`
      SELECT 
        r.kluster_id,
        sch.nama_sekolah,
        ROUND(ST_Distance(r.titik_rekomendasi_sppg::geography, sbs.geom::geography)::numeric, 2) AS jarak_meter,
        CASE 
          WHEN ST_Distance(r.titik_rekomendasi_sppg::geography, sbs.geom::geography) <= 6000 THEN 'Terjangkau'
          ELSE 'Di luar jangkauan'
        END AS status_validasi
      FROM rekomendasi_sppg r
      JOIN sekolah_blank_spot sbs ON sbs.kluster_id = r.kluster_id
      JOIN sekolah sch ON sch.id = sbs.sekolah_id
      ORDER BY r.kluster_id, jarak_meter
    `);
    return res.rows;
  }
}
