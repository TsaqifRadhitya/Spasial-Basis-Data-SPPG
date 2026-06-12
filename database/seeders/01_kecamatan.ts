import path from 'path';
import { PoolClient } from 'pg';
import { parseCSV } from '../../lib/utils/csv';

export async function seed(client: PoolClient) {
  console.log('[seeder] 01 - Seeding kecamatan...');

  const rows = parseCSV(path.join(process.cwd(), 'seeds/kecamatan.csv'));

  for (const r of rows) {
    await client.query(`
      INSERT INTO kecamatan (id, nama_kecamatan, geom)
      VALUES (
        $1,
        $2,
        COALESCE(
          CASE WHEN $3 ~ '^[0-9A-Fa-f]+$' THEN ST_GeomFromWKB(decode($3, 'hex')) ELSE NULL END,
          ST_GeomFromText($3, 4326)
        )
      )
      ON CONFLICT (id) DO UPDATE
        SET nama_kecamatan = EXCLUDED.nama_kecamatan,
            geom           = EXCLUDED.geom
    `, [r.id, r.nama_kecamatan, r.geom]);
  }

  console.log(`[seeder] 01 - Seeded ${rows.length} kecamatan.`);
}
