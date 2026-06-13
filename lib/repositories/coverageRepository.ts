import { query } from '../../database/db';

export class CoverageRepository {
  static async getPanjangJalanCoverage() {
    const res = await query(`
      SELECT 
        sp.id AS sppg_id,
        sp.nama_sppg,
        COALESCE(SUM(ST_Length(s.jalur_distribusi::geography)), 0) AS total_panjang_meter
      FROM sppg sp
      LEFT JOIN sekolah s ON s.id_sppg = sp.id
      GROUP BY sp.id, sp.nama_sppg
      ORDER BY total_panjang_meter DESC
    `);
    return res.rows;
  }

  static async calculateDrivingDistances() {
    const checkSppg = await query('SELECT COUNT(*) FROM sppg');
    if (parseInt(checkSppg.rows[0].count, 10) === 0) {
      return [];
    }

    const res = await query(`
      SELECT 
        s.id AS sekolah_id,
        s.nama_satuan_pendidikan AS nama_sekolah,
        k.nama_kelurahan,
        s.jenjang,
        sp.id AS sppg_id,
        sp.nama_sppg,
        COALESCE(ST_Length(s.jalur_distribusi::geography), 0) AS jarak_tempuh_meter,
        CASE 
          WHEN s.id_sppg IS NOT NULL AND COALESCE(ST_Length(s.jalur_distribusi::geography), 0) <= 6000 THEN 'Terlayani'
          ELSE 'Blank Spot'
        END AS status_cakupan
      FROM sekolah s
      LEFT JOIN sppg sp ON s.id_sppg = sp.id
      LEFT JOIN kelurahan k ON s.id_kelurahan = k.id
      ORDER BY s.nama_satuan_pendidikan
    `);
    return res.rows;
  }

  static async getServiceAreaPolygons() {
    const res = await query(`
      SELECT 
        sp.id,
        sp.id AS sppg_id,
        sp.nama_sppg,
        6000 AS max_cost_meter,
        ST_AsGeoJSON(ST_Buffer(sp.geom, 0.054))::json AS geometry
      FROM sppg sp
    `);
    return res.rows;
  }

  static async getLuasCoverage() {
    const res = await query(`
      SELECT 
        sp.id AS sppg_id,
        sp.nama_sppg,
        ROUND((ST_Area(ST_Buffer(sp.geom, 0.054)::geography) / 1e6)::numeric, 2) AS luas_coverage_km2
      FROM sppg sp
      ORDER BY luas_coverage_km2 DESC
    `);
    return res.rows;
  }
}
