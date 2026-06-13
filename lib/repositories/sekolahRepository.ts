import db, { query } from '../../database/db';
import { getGoogleRoute } from '../utils/googleMaps';

export interface Sekolah {
  id?: string;
  nama_sekolah: string;
  jenjang: 'SD' | 'SMP' | 'SMA' | 'SMK';
  alamat: string;
  nama_kelurahan: string;
  latitude: number;
  longitude: number;
}

export class SekolahRepository {
  static async getAll(kelurahan?: string) {
    let sql = `
      SELECT s.id, s.nama_satuan_pendidikan AS nama_sekolah, s.jenjang, s.alamat, 
        k.nama_kelurahan, s.id_sppg,
        ST_AsGeoJSON(s.jalur_distribusi)::json AS jalur_distribusi,
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
    const res = await query(`
      SELECT s.id, s.nama_satuan_pendidikan AS nama_sekolah, s.jenjang, s.alamat, 
        k.nama_kelurahan, s.id_sppg,
        ST_X(s.geom) as longitude, ST_Y(s.geom) as latitude,
        COALESCE(ST_ClusterDBSCAN(s.geom, 0.054, 1) OVER (), 0) AS kluster_id
      FROM sekolah s
      LEFT JOIN kelurahan k ON s.id_kelurahan = k.id
      WHERE s.id_sppg IS NULL
      ORDER BY kluster_id, s.id
    `);
    return res.rows;
  }

  /**
   * Recalculates SPPG assignment and distribution routes for all schools.
   */
  static async updateSchoolSppgIds() {
    const schools = await query(`SELECT id, ST_X(geom) as lng, ST_Y(geom) as lat FROM sekolah`);
    for (const school of schools.rows) {
      await this.assignSppgAndRouteForSchool(
        school.id,
        parseFloat(school.lng),
        parseFloat(school.lat)
      );
    }
  }

  /**
   * Pipeline to assign a school to the closest SPPG (max 6km driving distance)
   * and save the Google Maps overview polyline (decoded) as its jalur_distribusi geometry.
   * If Google Maps API key is missing or fails, falls back to straight-line Euclidean distance/geometry.
   */
  static async assignSppgAndRouteForSchool(
    schoolId: string,
    schoolLng: number,
    schoolLat: number,
    executor: { query: (text: string, params?: any[]) => Promise<any> } = db
  ) {
    // 1. Fetch all SPPGs ordered by straight-line (Euclidean) distance to this school
    const sppgRes = await executor.query(`
      SELECT id, ST_X(geom) as lng, ST_Y(geom) as lat,
             ST_Distance(geom::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) as straight_dist
      FROM sppg
      ORDER BY straight_dist ASC
    `, [schoolLng, schoolLat]);

    let assignedSppgId: string | null = null;
    let routeWkt: string | null = null;

    for (const sp of sppgRes.rows) {
      const straightDist = parseFloat(sp.straight_dist);
      if (straightDist > 6000) {
        // Since SPPGs are ordered by straight distance, if this one is > 6km,
        // all remaining ones will also exceed 6km.
        break;
      }

      // Try Google Maps Driving Route
      const route = await getGoogleRoute(
        { lat: schoolLat, lng: schoolLng },
        { lat: parseFloat(sp.lat), lng: parseFloat(sp.lng) }
      );

      if (route) {
        if (route.distanceMeters <= 6000) {
          assignedSppgId = sp.id;
          if (route.coordinates.length >= 2) {
            routeWkt = `LINESTRING(${route.coordinates.map(p => `${p[0]} ${p[1]}`).join(',')})`;
          }
          break; // Found the closest SPPG within 6km driving distance
        }
      } else {
        // Fallback: If Google Maps Directions API failed or is not configured, use straight-line distance
        if (straightDist <= 6000) {
          assignedSppgId = sp.id;
          routeWkt = `LINESTRING(${schoolLng} ${schoolLat}, ${sp.lng} ${sp.lat})`;
          break;
        }
      }
    }

    // Update school record in database
    if (assignedSppgId) {
      await executor.query(`
        UPDATE sekolah
        SET id_sppg = $1,
            jalur_distribusi = ST_GeomFromText($2, 4326)
        WHERE id = $3
      `, [assignedSppgId, routeWkt, schoolId]);
    } else {
      await executor.query(`
        UPDATE sekolah
        SET id_sppg = NULL,
            jalur_distribusi = NULL
        WHERE id = $1
      `, [schoolId]);
    }
  }

  static async create(sekolah: Sekolah) {
    const res = await query(`
      INSERT INTO sekolah (nama_satuan_pendidikan, jenjang, alamat, id_kelurahan, geom)
      VALUES (
        $1, 
        $2::jenjang_type, 
        $3, 
        COALESCE(
          (SELECT id FROM kelurahan WHERE ST_Contains(geom, ST_SetSRID(ST_MakePoint($5, $6), 4326)) LIMIT 1),
          (SELECT id FROM kelurahan WHERE LOWER(nama_kelurahan) = LOWER($4) LIMIT 1)
        ), 
        ST_SetSRID(ST_MakePoint($5, $6), 4326)
      )
      RETURNING id, nama_satuan_pendidikan as nama_sekolah, jenjang, alamat, 
        (SELECT nama_kelurahan FROM kelurahan WHERE id = id_kelurahan) as nama_kelurahan,
        ST_X(geom) as longitude, ST_Y(geom) as latitude
    `, [sekolah.nama_sekolah, sekolah.jenjang, sekolah.alamat, sekolah.nama_kelurahan, sekolah.longitude, sekolah.latitude]);
    
    const newSchool = res.rows[0];

    // Compute id_sppg and route
    await this.assignSppgAndRouteForSchool(
      newSchool.id,
      parseFloat(newSchool.longitude),
      parseFloat(newSchool.latitude)
    );

    // Return the latest data including id_sppg and jalur_distribusi as GeoJSON
    const updated = await query(`
      SELECT s.id, s.nama_satuan_pendidikan as nama_sekolah, s.jenjang, s.alamat,
        k.nama_kelurahan, s.id_sppg,
        ST_AsGeoJSON(s.jalur_distribusi)::json AS jalur_distribusi,
        ST_X(s.geom) as longitude, ST_Y(s.geom) as latitude
      FROM sekolah s
      LEFT JOIN kelurahan k ON s.id_kelurahan = k.id
      WHERE s.id = $1
    `, [newSchool.id]);
    return updated.rows[0];
  }

  static async getSchoolRoute(id: string) {
    const res = await query(`
      SELECT 
        -1 AS edge,
        1 AS path_seq,
        ST_AsGeoJSON(s.jalur_distribusi)::json AS geometry
      FROM sekolah s
      WHERE s.id = $1 AND s.jalur_distribusi IS NOT NULL;
    `, [id]);
    return res.rows;
  }
}
