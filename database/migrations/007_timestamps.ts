import { PoolClient } from 'pg';

export async function up(client: PoolClient) {
  console.log('[migration] 007 - Adding created_at / updated_at to all tables...');

  await client.query(`
    CREATE OR REPLACE FUNCTION set_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);


  await client.query(`
    ALTER TABLE kecamatan
      ADD COLUMN IF NOT EXISTS created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW();
  `);
  await client.query(`
    DROP TRIGGER IF EXISTS trg_kecamatan_updated_at ON kecamatan;
    CREATE TRIGGER trg_kecamatan_updated_at
      BEFORE UPDATE ON kecamatan
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  `);

  await client.query(`
    ALTER TABLE kelurahan
      ADD COLUMN IF NOT EXISTS created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW();
  `);
  await client.query(`
    DROP TRIGGER IF EXISTS trg_kelurahan_updated_at ON kelurahan;
    CREATE TRIGGER trg_kelurahan_updated_at
      BEFORE UPDATE ON kelurahan
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  `);

  await client.query(`
    ALTER TABLE sppg
      ALTER COLUMN created_at SET DATA TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
      ALTER COLUMN created_at SET DEFAULT NOW(),
      ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW();
  `);
  await client.query(`
    DROP TRIGGER IF EXISTS trg_sppg_updated_at ON sppg;
    CREATE TRIGGER trg_sppg_updated_at
      BEFORE UPDATE ON sppg
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  `);

  await client.query(`
    ALTER TABLE sekolah
      ALTER COLUMN created_at SET DATA TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
      ALTER COLUMN created_at SET DEFAULT NOW(),
      ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW();
  `);
  await client.query(`
    DROP TRIGGER IF EXISTS trg_sekolah_updated_at ON sekolah;
    CREATE TRIGGER trg_sekolah_updated_at
      BEFORE UPDATE ON sekolah
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  `);

  console.log('[migration] 007 - Done.');
}
