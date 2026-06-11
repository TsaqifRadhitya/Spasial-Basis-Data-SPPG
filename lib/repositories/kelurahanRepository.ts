import { query } from '../db';

export class KelurahanRepository {
  static async getAllWithCoverageSummary() {
    const res = await query(`
      SELECT 
        k.id,
        k.nama_kelurahan,
        k.nama_kecamatan,
        ST_AsGeoJSON(k.geom)::json AS geometry,
        COUNT(s.id) AS total_sekolah,
        SUM(CASE WHEN sbs.sekolah_id IS NULL AND s.id IS NOT NULL THEN 1 ELSE 0 END) AS terlayani_count,
        SUM(CASE WHEN sbs.sekolah_id IS NOT NULL THEN 1 ELSE 0 END) AS blank_spot_count
      FROM batas_kelurahan k
      LEFT JOIN sekolah s ON ST_Contains(k.geom, s.geom)
      LEFT JOIN sekolah_blank_spot sbs ON sbs.sekolah_id = s.id
      GROUP BY k.id, k.nama_kelurahan, k.nama_kecamatan, k.geom
      ORDER BY k.nama_kelurahan
    `);
    return res.rows;
  }
}
