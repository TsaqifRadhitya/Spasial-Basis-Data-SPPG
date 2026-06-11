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
      SELECT id, nama_sekolah, jenjang, alamat, nama_kelurahan, node_id,
        ST_X(geom) as longitude, ST_Y(geom) as latitude
      FROM sekolah
    `;
    const params = [];
    if (kelurahan) {
      sql += ` WHERE nama_kelurahan = $1`;
      params.push(kelurahan);
    }
    sql += ` ORDER BY id`;
    const res = await query(sql, params);
    return res.rows;
  }

  static async getBlankSpots() {
    const res = await query(`
      SELECT s.id, s.nama_sekolah, s.jenjang, s.alamat, s.nama_kelurahan, s.node_id,
        ST_X(s.geom) as longitude, ST_Y(s.geom) as latitude,
        sbs.kluster_id
      FROM sekolah_blank_spot sbs
      JOIN sekolah s ON sbs.sekolah_id = s.id
      ORDER BY sbs.kluster_id, s.id
    `);
    return res.rows;
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
      INSERT INTO sekolah (nama_sekolah, jenjang, alamat, nama_kelurahan, node_id, geom)
      VALUES ($1, $2, $3, $4, $5, ST_SetSRID(ST_MakePoint($6, $7), 4326))
      RETURNING id, nama_sekolah, jenjang, alamat, nama_kelurahan, node_id, ST_X(geom) as longitude, ST_Y(geom) as latitude
    `, [sekolah.nama_sekolah, sekolah.jenjang, sekolah.alamat, sekolah.nama_kelurahan, node_id, sekolah.longitude, sekolah.latitude]);
    return res.rows[0];
  }
}
