import { query } from '../../database/db';

export class KelurahanRepository {
  static async getAllWithCoverageSummary() {
    const res = await query(`
      SELECT 
        k.id,
        k.nama_kelurahan,
        kec.nama_kecamatan,
        ST_AsGeoJSON(k.geom)::json AS geometry,
        (SELECT COUNT(*) FROM sekolah s WHERE s.id_kelurahan = k.id) AS total_sekolah,
        (SELECT COUNT(*) FROM sekolah s WHERE s.id_kelurahan = k.id AND s.id_sppg IS NOT NULL) AS terlayani_count,
        (SELECT COUNT(*) FROM sekolah s WHERE s.id_kelurahan = k.id AND s.id_sppg IS NULL) AS blank_spot_count,
        (SELECT COUNT(*) FROM sppg sp WHERE sp.id_kelurahan = k.id OR ST_Contains(k.geom, sp.geom)) AS sppg_count
      FROM kelurahan k
      LEFT JOIN kecamatan kec ON k.id_kecamatan = kec.id
      WHERE LOWER(kec.nama_kecamatan) = 'sumbersari'
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
        0 AS blank_spot_count,
        0 AS sppg_count
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
        (SELECT COUNT(*) FROM sekolah s WHERE s.id_kelurahan = k.id) AS total_sekolah,
        (SELECT COUNT(*) FROM sekolah s WHERE s.id_kelurahan = k.id AND s.id_sppg IS NOT NULL) AS terlayani_count,
        (SELECT COUNT(*) FROM sekolah s WHERE s.id_kelurahan = k.id AND s.id_sppg IS NULL) AS blank_spot_count,
        (SELECT COUNT(*) FROM sppg sp WHERE sp.id_kelurahan = k.id OR ST_Contains(k.geom, sp.geom)) AS sppg_count
      FROM kelurahan k
      LEFT JOIN kecamatan kec ON k.id_kecamatan = kec.id
      WHERE LOWER(kec.nama_kecamatan) = 'sumbersari'
      GROUP BY k.id, k.nama_kelurahan, kec.nama_kecamatan, k.geom;
    `);
    return res.rows;
  }
}
