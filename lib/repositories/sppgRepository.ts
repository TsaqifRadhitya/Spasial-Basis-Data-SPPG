import { query } from '../../database/db';
import { SekolahRepository } from './sekolahRepository';

export interface SPPG {
  id?: string;
  nama_sppg: string;
  alamat: string;
  latitude: number;
  longitude: number;
}

export class SppgRepository {
  static async getAll() {
    const res = await query(`
      SELECT s.id, s.nama_sppg, s.alamat,
        ST_X(s.geom) as longitude, ST_Y(s.geom) as latitude,
        k.nama_kelurahan AS kelurahan
      FROM sppg s
      LEFT JOIN kelurahan k ON ST_Contains(k.geom, s.geom)
      ORDER BY s.id
    `);
    return res.rows;
  }

  static async getById(id: string) {
    const res = await query(`
      SELECT id, nama_sppg, alamat,
        ST_X(geom) as longitude, ST_Y(geom) as latitude
      FROM sppg
      WHERE id = $1
    `, [id]);
    return res.rows[0] || null;
  }

  static async create(sppg: SPPG) {
    const res = await query(`
      INSERT INTO sppg (nama_sppg, alamat, id_kelurahan, geom)
      VALUES (
        $1, 
        $2, 
        (SELECT id FROM kelurahan WHERE ST_Contains(geom, ST_SetSRID(ST_MakePoint($3, $4), 4326)) LIMIT 1),
        ST_SetSRID(ST_MakePoint($3, $4), 4326)
      )
      RETURNING id, nama_sppg, alamat, ST_X(geom) as longitude, ST_Y(geom) as latitude
    `, [sppg.nama_sppg, sppg.alamat, sppg.longitude, sppg.latitude]);

    const newSppg = res.rows[0];

    await SekolahRepository.reassignSchoolsForNewSppg(
      newSppg.id,
      parseFloat(newSppg.longitude),
      parseFloat(newSppg.latitude)
    );

    return newSppg;
  }

  static async delete(id: string) {
    const schoolsRes = await query(`
      SELECT id, ST_X(geom) as lng, ST_Y(geom) as lat 
      FROM sekolah 
      WHERE id_sppg = $1
    `, [id]);

    await query(`DELETE FROM sppg WHERE id = $1`, [id]);

    for (const school of schoolsRes.rows) {
      await SekolahRepository.assignSppgAndRouteForSchool(
        school.id,
        parseFloat(school.lng),
        parseFloat(school.lat)
      );
    }
  }

  static async getSppgRoutes(id: string) {
    const res = await query(`
      SELECT 
        s.id AS sekolah_id,
        -1 AS edge,
        1 AS path_seq,
        ST_AsGeoJSON(s.jalur_distribusi)::json AS geometry
      FROM sekolah s
      WHERE s.id_sppg = $1 AND s.jalur_distribusi IS NOT NULL;
    `, [id]);
    return res.rows;
  }

  static async simulateNewSppg(lat: number, lng: number) {
    // Blank spot schools that would be newly covered (within 6km of candidate)
    const blankSpotRes = await query(`
      SELECT 
        s.id,
        s.nama_sekolah AS nama,
        s.jenjang,
        ST_X(s.geom) AS longitude,
        ST_Y(s.geom) AS latitude,
        ROUND(ST_Distance(
          s.geom::geography,
          ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography
        )) AS jarak_meter
      FROM sekolah s
      WHERE s.id_sppg IS NULL
        AND ST_DWithin(
          s.geom::geography,
          ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography,
          6000
        )
      ORDER BY jarak_meter ASC
    `, [lat, lng]);

    // Schools currently served by another SPPG that are closer to the new candidate
    const reassignedRes = await query(`
      SELECT 
        s.id,
        s.nama_sekolah AS nama,
        s.jenjang,
        ST_X(s.geom) AS longitude,
        ST_Y(s.geom) AS latitude,
        ROUND(ST_Distance(
          s.geom::geography,
          ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography
        )) AS jarak_ke_baru_meter,
        ROUND(ST_Distance(
          s.geom::geography,
          sp.geom::geography
        )) AS jarak_ke_lama_meter,
        sp.nama_sppg AS nama_sppg_lama
      FROM sekolah s
      JOIN sppg sp ON sp.id = s.id_sppg
      WHERE s.id_sppg IS NOT NULL
        AND ST_DWithin(
          s.geom::geography,
          ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography,
          6000
        )
        AND ST_Distance(
          s.geom::geography,
          ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography
        ) < ST_Distance(
          s.geom::geography,
          sp.geom::geography
        )
      ORDER BY jarak_ke_baru_meter ASC
    `, [lat, lng]);

    return {
      blankSpotsCovered: blankSpotRes.rows,
      schoolsReassigned: reassignedRes.rows,
    };
  }
}

