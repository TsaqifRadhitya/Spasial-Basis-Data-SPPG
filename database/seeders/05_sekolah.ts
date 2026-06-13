import path from 'path';
import { PoolClient } from 'pg';
import { parseCSV, toNull } from '../../lib/utils/csv';
import { SekolahRepository } from '../../lib/repositories/sekolahRepository';

export async function seed(client: PoolClient) {
  console.log('[seeder] 05 - Seeding sekolah...');

  const rows = parseCSV(path.join(process.cwd(), 'seeds/sekolah.csv'));

  for (const r of rows) {
    await client.query(`
      INSERT INTO sekolah (id, nama_satuan_pendidikan, jenjang, alamat, geom, id_kelurahan, created_at)
      VALUES (
        $1,
        $2,
        $3::jenjang_type,
        $4,
        COALESCE(
          CASE WHEN $5 ~ '^[0-9A-Fa-f]+$' THEN ST_GeomFromWKB(decode($5, 'hex'), 4326) ELSE NULL END,
          ST_GeomFromText($5, 4326)
        ),
        COALESCE(
          $6,
          (SELECT id FROM kelurahan k
           WHERE ST_Contains(k.geom,
             COALESCE(
               CASE WHEN $5 ~ '^[0-9A-Fa-f]+$' THEN ST_GeomFromWKB(decode($5, 'hex'), 4326) ELSE NULL END,
               ST_GeomFromText($5, 4326)
             )
           ) LIMIT 1)
        ),
        COALESCE($7::timestamp, NOW())
      )
      ON CONFLICT (id) DO UPDATE
        SET nama_satuan_pendidikan = EXCLUDED.nama_satuan_pendidikan,
            jenjang                = EXCLUDED.jenjang,
            alamat                 = EXCLUDED.alamat,
            geom                   = EXCLUDED.geom,
            id_kelurahan           = EXCLUDED.id_kelurahan,
            created_at             = EXCLUDED.created_at,
            id_sppg                = NULL,
            jalur_distribusi       = NULL
    `, [r.id, r.nama_satuan_pendidikan, r.jenjang, r.alamat, r.geom,
    toNull(r.id_kelurahan), toNull(r.created_at)]);
  }
  console.log(`[seeder] 05 - Inserted ${rows.length} sekolah records.`);

  console.log('[seeder] 05 - Assigning SPPG and computing routes via Google Maps / Fallback...');
  const schoolsRes = await client.query(`SELECT id, ST_X(geom) as lng, ST_Y(geom) as lat FROM sekolah`);
  
  for (const school of schoolsRes.rows) {
    await SekolahRepository.assignSppgAndRouteForSchool(
      school.id,
      parseFloat(school.lng),
      parseFloat(school.lat),
      client
    );
  }
  
  console.log('[seeder] 05 - Done.');
}
