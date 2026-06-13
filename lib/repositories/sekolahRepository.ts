import db, { query } from '../../database/db';
import { getGoogleRoute, getGoogleDistanceMatrix } from '../utils/googleMaps';

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
    // 1. Fetch candidate SPPGs whose straight-line (Euclidean) distance to this school is <= 6km.
    // (A straight-line distance > 6km guarantees that the road distance is also > 6km, which saves API quota).
    const sppgRes = await executor.query(`
      SELECT id, ST_X(geom) as lng, ST_Y(geom) as lat,
             ST_Distance(geom::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) as straight_dist
      FROM sppg
      WHERE ST_DWithin(geom::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, 6000)
      ORDER BY straight_dist ASC
    `, [schoolLng, schoolLat]);

    let bestSppgId: string | null = null;
    let bestRouteWkt: string | null = null;

    if (sppgRes.rows.length > 0) {
      const candidates = sppgRes.rows;
      const destinations = candidates.map((sp: any) => ({
        lat: parseFloat(sp.lat),
        lng: parseFloat(sp.lng)
      }));

      // Call Distance Matrix API in a single batch request to fetch driving distances
      const elements = await getGoogleDistanceMatrix(
        { lat: schoolLat, lng: schoolLng },
        destinations
      );

      if (elements) {
        let minRoadDistance = Infinity;
        let chosenSppgIndex = -1;

        for (let i = 0; i < elements.length; i++) {
          const el = elements[i];
          if (el.status === 'OK' && el.distance && el.distance.value <= 6000) {
            if (el.distance.value < minRoadDistance) {
              minRoadDistance = el.distance.value;
              chosenSppgIndex = i;
            }
          }
        }

        // If we found a valid SPPG, fetch the route geometry using Directions API (1 call only)
        if (chosenSppgIndex !== -1) {
          const chosenSppg = candidates[chosenSppgIndex];
          bestSppgId = chosenSppg.id;

          const route = await getGoogleRoute(
            { lat: schoolLat, lng: schoolLng },
            { lat: parseFloat(chosenSppg.lat), lng: parseFloat(chosenSppg.lng) }
          );

          if (route && route.coordinates.length >= 2) {
            bestRouteWkt = `LINESTRING(${route.coordinates.map(p => `${p[0]} ${p[1]}`).join(',')})`;
          }
        }
      }
    }

    // Update school record in database with the closest SPPG by actual road distance
    if (bestSppgId) {
      await executor.query(`
        UPDATE sekolah
        SET id_sppg = $1,
            jalur_distribusi = ST_GeomFromText($2, 4326)
        WHERE id = $3
      `, [bestSppgId, bestRouteWkt, schoolId]);
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

  static async reassignSchoolsForNewSppg(
    newSppgId: string,
    newSppgLng: number,
    newSppgLat: number,
    executor: { query: (text: string, params?: any[]) => Promise<any> } = db
  ) {
    // 1. Fetch schools within 6km straight-line (Euclidean) distance of the new SPPG
    const schoolsRes = await executor.query(`
      SELECT 
        s.id, 
        ST_X(s.geom) as lng, 
        ST_Y(s.geom) as lat, 
        s.id_sppg,
        COALESCE(ST_Length(s.jalur_distribusi::geography), Infinity) as current_road_distance
      FROM sekolah s
      WHERE ST_DWithin(s.geom::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, 6000)
    `, [newSppgLng, newSppgLat]);

    for (const school of schoolsRes.rows) {
      const schoolLat = parseFloat(school.lat);
      const schoolLng = parseFloat(school.lng);

      // Fetch actual driving route to the new SPPG
      const route = await getGoogleRoute(
        { lat: schoolLat, lng: schoolLng },
        { lat: newSppgLat, lng: newSppgLng }
      );

      if (route && route.distanceMeters <= 6000) {
        const currentDistance = parseFloat(school.current_road_distance);
        
        // Reassign if:
        // - The school was a Blank Spot (no SPPG, currentDistance is Infinity) OR
        // - The new SPPG has a shorter actual driving road distance
        if (!school.id_sppg || route.distanceMeters < currentDistance) {
          const routeWkt = `LINESTRING(${route.coordinates.map((p: any) => `${p[0]} ${p[1]}`).join(',')})`;
          await executor.query(`
            UPDATE sekolah
            SET id_sppg = $1,
                jalur_distribusi = ST_GeomFromText($2, 4326)
            WHERE id = $3
          `, [newSppgId, routeWkt, school.id]);
        }
      }
    }
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

  static async delete(id: string) {
    await query(`DELETE FROM sekolah WHERE id = $1`, [id]);
  }
}
