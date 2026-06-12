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
    return res.rows[0];
  }
}
