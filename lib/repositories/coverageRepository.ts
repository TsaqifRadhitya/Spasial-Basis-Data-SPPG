import { query } from '../db';

export class CoverageRepository {
  static async getPanjangJalanCoverage() {
    const res = await query(`
      SELECT 
        sp.id AS sppg_id,
        sp.nama_sppg,
        COALESCE(SUM(ST_Length(j.geom::geography)), 0) AS total_panjang_meter
      FROM sppg sp
      LEFT JOIN jaringan_jalan j 
        ON ST_DWithin(sp.geom::geography, j.geom::geography, 6000)
      GROUP BY sp.id, sp.nama_sppg
      ORDER BY total_panjang_meter DESC
    `);
    return res.rows;
  }

  static async calculateDrivingDistances() {
    // Check if there are roads and SPPGs
    const checkJalan = await query('SELECT COUNT(*) FROM jaringan_jalan');
    const checkSppg = await query('SELECT COUNT(*) FROM sppg');
    if (parseInt(checkJalan.rows[0].count, 10) === 0 || parseInt(checkSppg.rows[0].count, 10) === 0) {
      return [];
    }

    try {
      const res = await query(`
        SELECT 
          s.id AS sekolah_id,
          s.nama_satuan_pendidikan AS nama_sekolah,
          k.nama_kelurahan,
          s.jenjang,
          sp.id AS sppg_id,
          sp.nama_sppg,
          dd.agg_cost AS jarak_tempuh_meter,
          CASE 
            WHEN dd.agg_cost <= 6000 THEN 'Terlayani'
            ELSE 'Blank Spot'
          END AS status_cakupan
        FROM sppg sp
        CROSS JOIN sekolah s
        LEFT JOIN kelurahan k ON s.id_kelurahan = k.id
        JOIN LATERAL (
          SELECT agg_cost 
          FROM pgr_drivingDistance(
            'SELECT id, source, target, cost AS cost FROM jaringan_jalan',
            sp.node_id,
            6000,
            false
          ) AS dd
          WHERE dd.node = s.node_id
        ) dd ON true
        ORDER BY sp.id, jarak_tempuh_meter
      `);
      return res.rows;
    } catch (e) {
      console.error('Error executing pgRouting driving distance:', e);
      // Fallback: use straight-line ST_Distance if pgRouting topology is not ready
      const res = await query(`
        SELECT 
          s.id AS sekolah_id,
          s.nama_satuan_pendidikan AS nama_sekolah,
          k.nama_kelurahan,
          s.jenjang,
          sp.id AS sppg_id,
          sp.nama_sppg,
          ST_Distance(s.geom::geography, sp.geom::geography) AS jarak_tempuh_meter,
          CASE 
            WHEN ST_Distance(s.geom::geography, sp.geom::geography) <= 6000 THEN 'Terlayani'
            ELSE 'Blank Spot'
          END AS status_cakupan
        FROM sppg sp
        CROSS JOIN sekolah s
        LEFT JOIN kelurahan k ON s.id_kelurahan = k.id
        ORDER BY sp.id, jarak_tempuh_meter
      `);
      return res.rows;
    }
  }

  static async getServiceAreaPolygons() {
    try {
      const res = await query(`
        SELECT 
          sp.id,
          sp.id AS sppg_id,
          sp.nama_sppg,
          6000 AS max_cost_meter,
          ST_AsGeoJSON(
            COALESCE(
              (
                SELECT ST_Buffer(ST_Union(j.geom), 0.0015)
                FROM (
                  SELECT j_inner.geom 
                  FROM jaringan_jalan j_inner
                  JOIN (
                    SELECT node 
                    FROM pgr_drivingDistance(
                      'SELECT id, source, target, cost FROM jaringan_jalan',
                      sp.node_id,
                      6000,
                      false
                    )
                  ) dd ON j_inner.source = dd.node OR j_inner.target = dd.node
                ) j
              ),
              ST_Buffer(sp.geom, 0.054)
            )
          )::json AS geometry
        FROM sppg sp
      `);
      return res.rows;
    } catch (e) {
      console.warn('pgRouting failed in getServiceAreaPolygons, falling back to ST_Buffer', e);
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
  }

  static async clearServiceAreas() {
    // No-op
  }

  static async generateServiceAreaPolygon(sppgId: string, node_id: number) {
    // No-op
  }

  static async getLuasCoverage() {
    try {
      const res = await query(`
        SELECT 
          sp.id AS sppg_id,
          sp.nama_sppg,
          ROUND(
            (ST_Area(
              COALESCE(
                (
                  SELECT ST_Buffer(ST_Union(j.geom), 0.0015)
                  FROM (
                    SELECT j_inner.geom 
                    FROM jaringan_jalan j_inner
                    JOIN (
                      SELECT node 
                      FROM pgr_drivingDistance(
                        'SELECT id, source, target, cost FROM jaringan_jalan',
                        sp.node_id,
                        6000,
                        false
                      )
                    ) dd ON j_inner.source = dd.node OR j_inner.target = dd.node
                  ) j
                ),
                ST_Buffer(sp.geom, 0.054)
              )::geography
            ) / 1e6)::numeric, 
            2
          ) AS luas_coverage_km2
        FROM sppg sp
        ORDER BY luas_coverage_km2 DESC
      `);
      return res.rows;
    } catch (e) {
      console.warn('pgRouting failed in getLuasCoverage, falling back to ST_Buffer', e);
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
}
