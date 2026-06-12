import path from 'path';
import { PoolClient } from 'pg';
import { parseCSV } from '../../lib/utils/csv';

export async function seed(client: PoolClient) {
  console.log('[seeder] 02 - Seeding kelurahan...');

  const rows = parseCSV(path.join(process.cwd(), 'seeds/kelurahan.csv'));

  for (const r of rows) {
    await client.query(`
      INSERT INTO kelurahan (id, nama_kelurahan, id_kecamatan, geom)
      VALUES (
        $1,
        $2,
        $3,
        COALESCE(
          CASE WHEN $4 ~ '^[0-9A-Fa-f]+$' THEN ST_GeomFromWKB(decode($4, 'hex'), 4326) ELSE NULL END,
          ST_GeomFromText($4, 4326)
        )
      )
      ON CONFLICT (id) DO UPDATE
        SET nama_kelurahan = EXCLUDED.nama_kelurahan,
            id_kecamatan   = EXCLUDED.id_kecamatan,
            geom           = EXCLUDED.geom
    `, [r.id, r.nama_kelurahan, r.id_kecamatan, r.geom]);
  }

  console.log(`[seeder] 02 - Seeded ${rows.length} kelurahan.`);
}
