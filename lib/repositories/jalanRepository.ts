import { query } from '../db';

export class JalanRepository {
  static async getAllGeoJSON() {
    const res = await query(`
      SELECT 
        id,
        nama_jalan,
        kelas_jalan,
        ST_AsGeoJSON(geom)::json AS geometry
      FROM jaringan_jalan
    `);
    
    const features = res.rows.map((row: any) => ({
      type: 'Feature',
      geometry: row.geometry,
      properties: {
        id: row.id,
        nama: row.nama_jalan,
        kelas: row.kelas_jalan,
        tipe: 'jalan',
      },
    }));

    return {
      type: 'FeatureCollection',
      features,
    };
  }
}
