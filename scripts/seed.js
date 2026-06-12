const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// 1. Load Environment Variables from .env.local
try {
  const envPath = path.join(__dirname, '../.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split(/\r?\n/).forEach(line => {
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim().replace(/^"|"$/g, '');
        if (key && !key.startsWith('#')) {
          process.env[key] = value;
        }
      }
    });
  }
} catch (e) {
  console.warn('Could not read .env.local file, using system env values.');
}

const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/sppg_gis_db';
const pool = new Pool({ connectionString: databaseUrl });

// 2. Self-Contained CSV Parser
function parseCSV(filePath) {
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${filePath}`);
    return [];
  }
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  if (lines.length === 0) return [];
  
  const headers = lines[0].split(',').map(h => h.trim());
  const rows = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const values = [];
    let insideQuote = false;
    let currentValue = '';
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        insideQuote = !insideQuote;
      } else if (char === ',' && !insideQuote) {
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue.trim());
    
    const row = {};
    headers.forEach((header, index) => {
      let val = values[index];
      if (val !== undefined) {
        val = val.replace(/^"|"$/g, '').trim();
      }
      row[header] = val || null;
    });
    rows.push(row);
  }
  return rows;
}

// Helper to convert empty string to null
const toNull = val => (val === '' || val === undefined ? null : val);

// 3. Main Seeder Process
async function run() {
  console.log(`Connecting to: ${databaseUrl}`);
  const client = await pool.connect();
  
  try {
    // Ensure SRID of jaringan_jalan is 4326 to prevent mixed SRID errors
    try {
      await client.query(`UPDATE jaringan_jalan SET geom = ST_SetSRID(geom, 4326) WHERE ST_SRID(geom) = 0 OR ST_SRID(geom) IS NULL;`);
    } catch (sridError) {
      console.warn('Could not update SRID of jaringan_jalan inside seeder:', sridError);
    }

    // A. Seed Kecamatan
    console.log('Seeding Kecamatan...');
    const kecamatanRows = parseCSV(path.join(__dirname, '../seeds/kecamatan.csv'));
    for (const r of kecamatanRows) {
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
        SET nama_kecamatan = EXCLUDED.nama_kecamatan, geom = EXCLUDED.geom
      `, [r.id, r.nama_kecamatan, r.geom]);
    }
    console.log(`Successfully seeded ${kecamatanRows.length} kecamatan.`);

    // B. Seed Kelurahan
    console.log('Seeding Kelurahan...');
    const kelurahanRows = parseCSV(path.join(__dirname, '../seeds/kelurahan.csv'));
    for (const r of kelurahanRows) {
      await client.query(`
        INSERT INTO kelurahan (id, nama_kelurahan, id_kecamatan, geom)
        VALUES (
          $1, 
          $2, 
          $3, 
          COALESCE(
            CASE WHEN $4 ~ '^[0-9A-Fa-f]+$' THEN ST_GeomFromWKB(decode($4, 'hex')) ELSE NULL END,
            ST_GeomFromText($4, 4326)
          )
        )
        ON CONFLICT (id) DO UPDATE 
        SET nama_kelurahan = EXCLUDED.nama_kelurahan, id_kecamatan = EXCLUDED.id_kecamatan, geom = EXCLUDED.geom
      `, [r.id, r.nama_kelurahan, r.id_kecamatan, r.geom]);
    }
    console.log(`Successfully seeded ${kelurahanRows.length} kelurahan.`);

    // C. Seed Jaringan Jalan
    console.log('Seeding Jaringan Jalan...');
    const jalanRows = parseCSV(path.join(__dirname, '../seeds/jaringan_jalan.csv'));
    for (const r of jalanRows) {
      await client.query(`
        INSERT INTO jaringan_jalan (id, source, target, cost, reverse_cost, geom)
        VALUES (
          $1::bigint, 
          $2::integer, 
          $3::integer, 
          $4::float, 
          $5::float, 
          COALESCE(
            CASE WHEN $6 ~ '^[0-9A-Fa-f]+$' THEN ST_GeomFromWKB(decode($6, 'hex')) ELSE NULL END,
            ST_GeomFromText($6, 4326)
          )
        )
        ON CONFLICT (id) DO UPDATE 
        SET source = EXCLUDED.source, target = EXCLUDED.target, 
            cost = EXCLUDED.cost, reverse_cost = EXCLUDED.reverse_cost, 
            geom = EXCLUDED.geom
      `, [
        r.id, 
        toNull(r.source), 
        toNull(r.target), 
        toNull(r.cost), 
        toNull(r.reverse_cost), 
        r.geom
      ]);
    }
    console.log(`Successfully seeded ${jalanRows.length} jaringan jalan.`);

    // D. Seed SPPG
    console.log('Seeding SPPG...');
    const sppgRows = parseCSV(path.join(__dirname, '../seeds/sppg.csv'));
    for (const r of sppgRows) {
      await client.query(`
        INSERT INTO sppg (id, nama_sppg, alamat, geom, id_kelurahan, node_id, created_at)
        VALUES (
          $1, 
          $2, 
          $3, 
          COALESCE(
            CASE WHEN $4 ~ '^[0-9A-Fa-f]+$' THEN ST_GeomFromWKB(decode($4, 'hex')) ELSE NULL END,
            ST_GeomFromText($4, 4326)
          ),
          COALESCE(
            $5, 
            (SELECT id FROM kelurahan k WHERE ST_Contains(k.geom, COALESCE(CASE WHEN $4 ~ '^[0-9A-Fa-f]+$' THEN ST_GeomFromWKB(decode($4, 'hex')) ELSE NULL END, ST_GeomFromText($4, 4326))) LIMIT 1)
          ),
          COALESCE(
            $6::integer,
            (
              SELECT node_id FROM (
                SELECT source AS node_id, geom <-> COALESCE(CASE WHEN $4 ~ '^[0-9A-Fa-f]+$' THEN ST_GeomFromWKB(decode($4, 'hex')) ELSE NULL END, ST_GeomFromText($4, 4326)) AS dist FROM jaringan_jalan
                UNION ALL
                SELECT target, geom <-> COALESCE(CASE WHEN $4 ~ '^[0-9A-Fa-f]+$' THEN ST_GeomFromWKB(decode($4, 'hex')) ELSE NULL END, ST_GeomFromText($4, 4326)) AS dist FROM jaringan_jalan
              ) sub 
              ORDER BY dist 
              LIMIT 1
            )
          ),
          COALESCE($7::timestamp, NOW())
        )
        ON CONFLICT (id) DO UPDATE 
        SET nama_sppg = EXCLUDED.nama_sppg, alamat = EXCLUDED.alamat, geom = EXCLUDED.geom, 
            id_kelurahan = EXCLUDED.id_kelurahan, node_id = EXCLUDED.node_id, created_at = EXCLUDED.created_at
      `, [r.id, r.nama_sppg, r.alamat, r.geom, toNull(r.id_kelurahan), toNull(r.node_id), toNull(r.created_at)]);
    }
    console.log(`Successfully seeded ${sppgRows.length} SPPG records.`);

    // D. Seed Sekolah
    console.log('Seeding Sekolah...');
    const sekolahRows = parseCSV(path.join(__dirname, '../seeds/sekolah.csv'));
    for (const r of sekolahRows) {
      await client.query(`
        INSERT INTO sekolah (id, nama_satuan_pendidikan, jenjang, alamat, geom, id_kelurahan, node_id, created_at)
        VALUES (
          $1, 
          $2, 
          $3::jenjang_type, 
          $4, 
          COALESCE(
            CASE WHEN $5 ~ '^[0-9A-Fa-f]+$' THEN ST_GeomFromWKB(decode($5, 'hex')) ELSE NULL END,
            ST_GeomFromText($5, 4326)
          ),
          COALESCE(
            $6, 
            (SELECT id FROM kelurahan k WHERE ST_Contains(k.geom, COALESCE(CASE WHEN $5 ~ '^[0-9A-Fa-f]+$' THEN ST_GeomFromWKB(decode($5, 'hex')) ELSE NULL END, ST_GeomFromText($5, 4326))) LIMIT 1)
          ),
          COALESCE(
            $7::integer,
            (
              SELECT node_id FROM (
                SELECT source AS node_id, geom <-> COALESCE(CASE WHEN $5 ~ '^[0-9A-Fa-f]+$' THEN ST_GeomFromWKB(decode($5, 'hex')) ELSE NULL END, ST_GeomFromText($5, 4326)) AS dist FROM jaringan_jalan
                UNION ALL
                SELECT target, geom <-> COALESCE(CASE WHEN $5 ~ '^[0-9A-Fa-f]+$' THEN ST_GeomFromWKB(decode($5, 'hex')) ELSE NULL END, ST_GeomFromText($5, 4326)) AS dist FROM jaringan_jalan
              ) sub 
              ORDER BY dist 
              LIMIT 1
            )
          ),
          COALESCE($8::timestamp, NOW())
        )
        ON CONFLICT (id) DO UPDATE 
        SET nama_satuan_pendidikan = EXCLUDED.nama_satuan_pendidikan, jenjang = EXCLUDED.jenjang, alamat = EXCLUDED.alamat,
            geom = EXCLUDED.geom, id_kelurahan = EXCLUDED.id_kelurahan, node_id = EXCLUDED.node_id, created_at = EXCLUDED.created_at
      `, [r.id, r.nama_satuan_pendidikan, r.jenjang, r.alamat, r.geom, toNull(r.id_kelurahan), toNull(r.node_id), toNull(r.created_at)]);
    }
    console.log(`Successfully seeded ${sekolahRows.length} sekolah records.`);
    console.log('Database seeding completed successfully!');
  } catch (err) {
    console.error('Seeding process encountered an error:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
