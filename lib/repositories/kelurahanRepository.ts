import { query } from '../../database/db';

export class KelurahanRepository {
  static async getAllWithCoverageSummary() {
    const res = await query(`
      WITH blank_spot_sekolah AS (
        SELECT id AS sekolah_id
        FROM sekolah
        WHERE id_sppg IS NULL
      )
      SELECT 
        k.id,
        k.nama_kelurahan,
        kec.nama_kecamatan,
        ST_AsGeoJSON(k.geom)::json AS geometry,
        COUNT(s.id) AS total_sekolah,
        SUM(CASE WHEN s.id_sppg IS NOT NULL THEN 1 ELSE 0 END) AS terlayani_count,
        SUM(CASE WHEN s.id_sppg IS NULL AND s.id IS NOT NULL THEN 1 ELSE 0 END) AS blank_spot_count
      FROM kelurahan k
      LEFT JOIN kecamatan kec ON k.id_kecamatan = kec.id
      LEFT JOIN sekolah s ON s.id_kelurahan = k.id
      WHERE LOWER(kec.nama_kecamatan) = 'sumbersari'
      GROUP BY k.id, k.nama_kelurahan, kec.nama_kecamatan, k.geom
      ORDER BY k.nama_kelurahan
    `);
    return res.rows;
  }

  static async getAdminBoundaries() {
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
        SUM(CASE WHEN s.id_sppg IS NOT NULL THEN 1 ELSE 0 END) AS terlayani_count,
        SUM(CASE WHEN s.id_sppg IS NULL AND s.id IS NOT NULL THEN 1 ELSE 0 END) AS blank_spot_count
      FROM kelurahan k
      LEFT JOIN kecamatan kec ON k.id_kecamatan = kec.id
      LEFT JOIN sekolah s ON s.id_kelurahan = k.id
      WHERE LOWER(kec.nama_kecamatan) = 'sumbersari'
      GROUP BY k.id, k.nama_kelurahan, kec.nama_kecamatan, k.geom;
    `);
    return res.rows;
  }
}
