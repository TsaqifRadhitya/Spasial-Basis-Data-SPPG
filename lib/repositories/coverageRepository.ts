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
          s.nama_sekolah,
          s.nama_kelurahan,
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
          s.nama_sekolah,
          s.nama_kelurahan,
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
        ORDER BY sp.id, jarak_tempuh_meter
      `);
      return res.rows;
    }
  }

  static async getServiceAreaPolygons() {
    const res = await query(`
      SELECT 
        sa.id,
        sa.sppg_id,
        sp.nama_sppg,
        ST_AsGeoJSON(sa.service_area_geom)::json AS geometry,
        sa.max_cost_meter
      FROM service_area sa
      JOIN sppg sp ON sa.sppg_id = sp.id
    `);
    return res.rows;
  }

  static async clearServiceAreas() {
    await query('DELETE FROM service_area');
  }

  static async generateServiceAreaPolygon(sppgId: number, node_id: number) {
    try {
      // Find all roads within 6km driving distance and create a buffer around them
      await query(`
        INSERT INTO service_area (sppg_id, service_area_geom)
        SELECT 
          $1, 
          ST_Buffer(ST_Union(j.geom), 0.0015) -- approx 150m buffer around paths for visual coverage
        FROM (
          SELECT geom FROM jaringan_jalan WHERE source IN (
            SELECT node FROM pgr_drivingDistance(
              'SELECT id, source, target, cost FROM jaringan_jalan',
              $2,
              6000,
              false
            )
          ) OR target IN (
            SELECT node FROM pgr_drivingDistance(
              'SELECT id, source, target, cost FROM jaringan_jalan',
              $2,
              6000,
              false
            )
          )
        ) j
      `, [sppgId, node_id]);
    } catch (e) {
      console.warn('Failed pgRouting service area generation, falling back to ST_Buffer', e);
      // Fallback: standard 6km buffer around SPPG
      await query(`
        INSERT INTO service_area (sppg_id, service_area_geom)
        SELECT id, ST_Buffer(geom, 0.054) FROM sppg WHERE id = $1
      `, [sppgId]);
    }
  }

  static async getLuasCoverage() {
    const res = await query(`
      SELECT 
        sp.id AS sppg_id,
        sp.nama_sppg,
        ROUND((ST_Area(sa.service_area_geom::geography) / 1e6)::numeric, 2) AS luas_coverage_km2
      FROM sppg sp
      JOIN service_area sa ON sa.sppg_id = sp.id
      ORDER BY luas_coverage_km2 DESC
    `);
    return res.rows;
  }
}
