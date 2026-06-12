import { query } from '../db';

export interface SPPG {
  id?: number;
  nama_sppg: string;
  alamat: string;
  node_id?: number;
  latitude: number;
  longitude: number;
}

export class SppgRepository {
  static async getAll() {
    const res = await query(`
      SELECT id, nama_sppg, alamat, node_id,
        ST_X(geom) as longitude, ST_Y(geom) as latitude
      FROM sppg
      ORDER BY id
    `);
    return res.rows;
  }

  static async getById(id: string) {
    const res = await query(`
      SELECT id, nama_sppg, alamat, node_id,
        ST_X(geom) as longitude, ST_Y(geom) as latitude
      FROM sppg
      WHERE id = $1
    `, [id]);
    return res.rows[0] || null;
  }

  static async findClosestNode(lng: number, lat: number): Promise<number | null> {
    const res = await query(`
      SELECT node_id FROM (
        SELECT source AS node_id, geom <-> ST_SetSRID(ST_MakePoint($1, $2), 4326) AS dist FROM jaringan_jalan
        UNION ALL
        SELECT target, geom <-> ST_SetSRID(ST_MakePoint($1, $2), 4326) AS dist FROM jaringan_jalan
      ) AS sub 
      ORDER BY dist 
      LIMIT 1
    `, [lng, lat]);
    return res.rows[0]?.node_id || null;
  }

  static async create(sppg: SPPG) {
    const node_id = sppg.node_id || await this.findClosestNode(sppg.longitude, sppg.latitude);
    const res = await query(`
      INSERT INTO sppg (nama_sppg, alamat, id_kelurahan, node_id, geom)
      VALUES (
        $1, 
        $2, 
        (SELECT id FROM kelurahan WHERE ST_Contains(geom, ST_SetSRID(ST_MakePoint($3, $4), 4326)) LIMIT 1),
        $5, 
        ST_SetSRID(ST_MakePoint($3, $4), 4326)
      )
      RETURNING id, nama_sppg, alamat, node_id, ST_X(geom) as longitude, ST_Y(geom) as latitude
    `, [sppg.nama_sppg, sppg.alamat, sppg.longitude, sppg.latitude, node_id]);

    // Recalculate school SPPG mappings
    await query(`UPDATE sekolah SET id_sppg = NULL;`);
    try {
      await query(`
        WITH school_sppg_costs AS (
          SELECT 
            s.id AS sekolah_id,
            sp.id AS sppg_id,
            dd.agg_cost AS cost,
            ROW_NUMBER() OVER (PARTITION BY s.id ORDER BY dd.agg_cost ASC) as rn
          FROM sekolah s
          CROSS JOIN sppg sp
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
        UPDATE sekolah s
        SET id_sppg = ssc.sppg_id
        FROM school_sppg_costs ssc
        WHERE s.id = ssc.sekolah_id AND ssc.rn = 1;
      `);
    } catch (routingError) {
      try {
        await query(`
          WITH school_sppg_distances AS (
            SELECT 
              s.id AS sekolah_id,
              sp.id AS sppg_id,
              ST_Distance(s.geom::geography, sp.geom::geography) as dist,
              ROW_NUMBER() OVER (PARTITION BY s.id ORDER BY ST_Distance(s.geom::geography, sp.geom::geography) ASC) as rn
            FROM sekolah s
            CROSS JOIN sppg sp
            WHERE ST_Distance(s.geom::geography, sp.geom::geography) <= 6000
          )
          UPDATE sekolah s
          SET id_sppg = ssd.sppg_id
          FROM school_sppg_distances ssd
          WHERE s.id = ssd.sekolah_id AND ssd.rn = 1;
        `);
      } catch (err) {
        console.error('Fallback failed in SPPG creation:', err);
      }
    }

    return res.rows[0];
  }

  static async getSppgRoutes(id: string) {
    const sppgRes = await query(`SELECT id, node_id, geom FROM sppg WHERE id = $1`, [id]);
    if (sppgRes.rows.length === 0) return [];
    
    const sppg = sppgRes.rows[0];
    const nodeId = sppg.node_id;

    if (!nodeId) {
      return this.getSppgRoutesFallback(id);
    }

    try {
      const targetSchoolsRes = await query(`
        SELECT s.node_id
        FROM sekolah s
        JOIN LATERAL (
          SELECT agg_cost 
          FROM pgr_drivingDistance(
            'SELECT id, source, target, cost FROM jaringan_jalan',
            $1::integer,
            6000,
            false
          ) AS dd
          WHERE dd.node = s.node_id
        ) dd ON true
        WHERE s.node_id IS NOT NULL
      `, [nodeId]);

      if (targetSchoolsRes.rows.length === 0) {
        return this.getSppgRoutesFallback(id);
      }

      const schoolNodeIds = targetSchoolsRes.rows.map(r => r.node_id);

      const res = await query(`
        WITH routes AS (
          SELECT 
            r.end_id AS school_node_id,
            r.edge,
            r.node,
            r.path_seq
          FROM pgr_dijkstra(
            'SELECT id, source, target, cost FROM jaringan_jalan',
            $1::integer,
            $2::integer[],
            false
          ) AS r
        )
        SELECT 
          s.id AS sekolah_id,
          s.node_id AS school_node_id,
          r.edge,
          r.path_seq,
          ST_AsGeoJSON(j.geom)::json AS geometry
        FROM routes r
        JOIN sekolah s ON r.school_node_id = s.node_id
        JOIN jaringan_jalan j ON r.edge = j.id
        ORDER BY s.id, r.path_seq;
      `, [nodeId, schoolNodeIds]);

      if (res.rows.length === 0) {
        return this.getSppgRoutesFallback(id);
      }
      return res.rows;
    } catch (e) {
      console.warn('pgRouting failed in getSppgRoutes, using straight-line fallback:', e);
      return this.getSppgRoutesFallback(id);
    }
  }

  static async getSppgRoutesFallback(id: string) {
    const res = await query(`
      SELECT 
        s.id AS sekolah_id,
        s.node_id AS school_node_id,
        -1 AS edge,
        1 AS path_seq,
        ST_AsGeoJSON(ST_MakeLine(sp.geom, s.geom))::json AS geometry
      FROM sekolah s
      CROSS JOIN sppg sp
      WHERE sp.id = $1
        AND ST_Distance(s.geom::geography, sp.geom::geography) <= 6000;
    `, [id]);
    return res.rows;
  }
}
