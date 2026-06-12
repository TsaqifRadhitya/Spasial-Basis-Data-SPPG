import { query } from '../db';

export class JalanRepository {
  static async getAllGeoJSON() {
    const res = await query(`
      SELECT 
        id,
        ST_AsGeoJSON(geom)::json AS geometry
      FROM jaringan_jalan
    `);
    
    const features = res.rows.map((row: any) => ({
      type: 'Feature',
      geometry: row.geometry,
      properties: {
        id: row.id,
        tipe: 'jalan',
      },
    }));

    return {
      type: 'FeatureCollection',
      features,
    };
  }
}
