import { query } from '../db';

export interface Sekolah {
  id?: number;
  nama_sekolah: string;
  jenjang: 'SD' | 'SMP' | 'SMA' | 'SMK';
  alamat: string;
  nama_kelurahan: string;
  node_id?: number;
  latitude: number;
  longitude: number;
}

export class SekolahRepository {
  static async getAll(kelurahan?: string) {
    let sql = `
      SELECT s.id, s.nama_satuan_pendidikan AS nama_sekolah, s.jenjang, s.alamat, 
        k.nama_kelurahan, s.node_id,
        ST_X(s.geom) as longitude, ST_Y(s.geom) as latitude
      FROM sekolah s
      LEFT JOIN kelurahan k ON s.id_kelurahan = k.id
    `;
    const params = [];
    if (kelurahan) {
      sql += ` WHERE k.nama_kelurahan = $1`;
      params.push(kelurahan);
    }
    sql += ` ORDER BY s.id`;
    const res = await query(sql, params);
    return res.rows;
  }

  static async getBlankSpots() {
    try {
      const res = await query(`
        WITH served_sekolah AS (
          SELECT DISTINCT s.id
          FROM sppg sp
          CROSS JOIN sekolah s
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
        SELECT s.id, s.nama_satuan_pendidikan AS nama_sekolah, s.jenjang, s.alamat, 
          k.nama_kelurahan, s.node_id,
          ST_X(s.geom) as longitude, ST_Y(s.geom) as latitude,
          COALESCE(ST_ClusterDBSCAN(s.geom, 0.054, 1) OVER (), 0) AS kluster_id
        FROM sekolah s
        LEFT JOIN kelurahan k ON s.id_kelurahan = k.id
        WHERE s.id NOT IN (SELECT id FROM served_sekolah)
        ORDER BY kluster_id, s.id
      `);
      return res.rows;
    } catch (e) {
      console.warn('pgRouting failed in getBlankSpots, falling back to ST_Distance', e);
      const res = await query(`
        WITH served_sekolah AS (
          SELECT DISTINCT s.id
          FROM sppg sp
          CROSS JOIN sekolah s
          WHERE ST_Distance(s.geom::geography, sp.geom::geography) <= 6000
        )
        SELECT s.id, s.nama_satuan_pendidikan AS nama_sekolah, s.jenjang, s.alamat, 
          k.nama_kelurahan, s.node_id,
          ST_X(s.geom) as longitude, ST_Y(s.geom) as latitude,
          COALESCE(ST_ClusterDBSCAN(s.geom, 0.054, 1) OVER (), 0) AS kluster_id
        FROM sekolah s
        LEFT JOIN kelurahan k ON s.id_kelurahan = k.id
        WHERE s.id NOT IN (SELECT id FROM served_sekolah)
        ORDER BY kluster_id, s.id
      `);
      return res.rows;
    }
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

  static async create(sekolah: Sekolah) {
    const node_id = sekolah.node_id || await this.findClosestNode(sekolah.longitude, sekolah.latitude);
    const res = await query(`
      INSERT INTO sekolah (nama_satuan_pendidikan, jenjang, alamat, id_kelurahan, node_id, geom)
      VALUES (
        $1, 
        $2::jenjang_type, 
        $3, 
        COALESCE(
          (SELECT id FROM kelurahan WHERE ST_Contains(geom, ST_SetSRID(ST_MakePoint($5, $6), 4326)) LIMIT 1),
          (SELECT id FROM kelurahan WHERE LOWER(nama_kelurahan) = LOWER($4) LIMIT 1)
        ), 
        $7, 
        ST_SetSRID(ST_MakePoint($5, $6), 4326)
      )
      RETURNING id, nama_satuan_pendidikan as nama_sekolah, jenjang, alamat, 
        (SELECT nama_kelurahan FROM kelurahan WHERE id = id_kelurahan) as nama_kelurahan,
        node_id, ST_X(geom) as longitude, ST_Y(geom) as latitude
    `, [sekolah.nama_sekolah, sekolah.jenjang, sekolah.alamat, sekolah.nama_kelurahan, node_id, sekolah.longitude, sekolah.latitude]);
    return res.rows[0];
  }
}
