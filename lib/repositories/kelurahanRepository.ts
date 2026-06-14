import { query } from '../../database/db';

export class KelurahanRepository {
  static async getAllWithCoverageSummary() {
    const res = await query(`
      SELECT 
        k.id,
        k.nama_kelurahan,
        kec.nama_kecamatan,
        ST_AsGeoJSON(k.geom)::json AS geometry,
        (SELECT COUNT(*) FROM sekolah s WHERE ST_Contains(k.geom, s.geom)) AS total_sekolah,
        (SELECT COUNT(*) FROM sekolah s WHERE ST_Contains(k.geom, s.geom) AND s.id_sppg IS NOT NULL) AS terlayani_count,
        (SELECT COUNT(*) FROM sekolah s WHERE ST_Contains(k.geom, s.geom) AND s.id_sppg IS NULL) AS blank_spot_count,
        (SELECT COUNT(*) FROM sppg sp WHERE ST_Contains(k.geom, sp.geom)) AS sppg_count
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
        (SELECT COUNT(*) FROM sekolah s WHERE ST_Contains(k.geom, s.geom)) AS total_sekolah,
        (SELECT COUNT(*) FROM sekolah s WHERE ST_Contains(k.geom, s.geom) AND s.id_sppg IS NOT NULL) AS terlayani_count,
        (SELECT COUNT(*) FROM sekolah s WHERE ST_Contains(k.geom, s.geom) AND s.id_sppg IS NULL) AS blank_spot_count,
        (SELECT COUNT(*) FROM sppg sp WHERE ST_Contains(k.geom, sp.geom)) AS sppg_count
      FROM kelurahan k
      LEFT JOIN kecamatan kec ON k.id_kecamatan = kec.id
      WHERE LOWER(kec.nama_kecamatan) = 'sumbersari'
      GROUP BY k.id, k.nama_kelurahan, kec.nama_kecamatan, k.geom;
    `);
    return res.rows;
  }

  static async checkLocation(longitude: number, latitude: number) {
    const kecRes = await query(`
      SELECT id, nama_kecamatan
      FROM kecamatan
      WHERE ST_Contains(geom, ST_SetSRID(ST_MakePoint($1, $2), 4326))
      LIMIT 1
    `, [longitude, latitude]);

    if (kecRes.rows.length === 0) {
      return { insideSumbersari: false, kecamatan: null, kelurahan: null };
    }

    const kec = kecRes.rows[0];
    const isSumbersari = kec.nama_kecamatan.toLowerCase() === 'sumbersari';

    if (!isSumbersari) {
      return { insideSumbersari: false, kecamatan: kec.nama_kecamatan, kelurahan: null };
    }

    const kelRes = await query(`
      SELECT id, nama_kelurahan
      FROM kelurahan
      WHERE ST_Contains(geom, ST_SetSRID(ST_MakePoint($1, $2), 4326))
      LIMIT 1
    `, [longitude, latitude]);

    const kel = kelRes.rows[0] || null;
    return {
      insideSumbersari: true,
      kecamatan: kec.nama_kecamatan,
      kelurahan: kel ? kel.nama_kelurahan : null,
      kelurahan_id: kel ? kel.id : null
    };
  }
}

