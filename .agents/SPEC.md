# SPEC.md
# Sistem Informasi Geografis Pemetaan dan Cakupan SPPG terhadap Sekolah Negeri
## Kecamatan Sumbersari, Jember

---

## 1. Overview Sistem

Aplikasi web berbasis GIS untuk memetakan persebaran SPPG dan Sekolah Negeri di Kecamatan Sumbersari, menganalisis cakupan pelayanan berbasis jaringan jalan 6 km, mengidentifikasi *blank spot*, dan menentukan rekomendasi lokasi SPPG baru secara spasial.

**Stack Teknologi:**
- **Frontend:** Next.js (React) + Leaflet.js / MapLibre GL JS
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL + PostGIS + pgRouting
- **Data Sumber:** OpenStreetMap (OSM), Google Maps, Dinas Pendidikan, Badan Gizi Nasional

---

## 2. Tech Stack Detail

### 2.1 Frontend
| Komponen | Teknologi |
|----------|-----------|
| Framework | Next.js 14+ (App Router) |
| Peta Interaktif | Leaflet.js atau MapLibre GL JS |
| State Management | React useState / useContext |
| HTTP Client | fetch / axios |
| Styling | Tailwind CSS |

### 2.2 Backend
| Komponen | Teknologi |
|----------|-----------|
| API Layer | Next.js API Routes (`/app/api/`) |
| Database Client | node-postgres (`pg`) — raw SQL, tanpa ORM |
| Spasial | PostGIS + pgRouting |

### 2.3 Database
| Komponen | Teknologi |
|----------|-----------|
| RDBMS | PostgreSQL 15+ |
| Ekstensi Spasial | PostGIS 3+ |
| Ekstensi Routing | pgRouting 3+ |
| Format Koordinat | WGS 84 (EPSG:4326) |

---

## 3. Struktur Database

Struktur tabel mengikuti ERD yang telah dirancang, terdiri dari 5 tabel utama beserta tabel analisis pendukung.

### 3.1 Tabel `kecamatan`
Menyimpan data wilayah administratif kecamatan.

```sql
CREATE TABLE kecamatan (
  id               VARCHAR PRIMARY KEY,
  nama_kecamatan   VARCHAR NOT NULL,
  geom             GEOMETRY(Polygon, 4326) NOT NULL
);
CREATE INDEX idx_kecamatan_geom ON kecamatan USING GIST(geom);
```

### 3.2 Tabel `kelurahan`
Menyimpan data wilayah administratif kelurahan, berelasi ke kecamatan.

```sql
CREATE TABLE kelurahan (
  id               VARCHAR PRIMARY KEY,
  nama_kelurahan   VARCHAR NOT NULL,
  geom             GEOMETRY(Polygon, 4326) NOT NULL,
  id_kecamatan     VARCHAR REFERENCES kecamatan(id)
);
CREATE INDEX idx_kelurahan_geom ON kelurahan USING GIST(geom);
```

### 3.3 Tabel `sppg`
Menyimpan titik lokasi Satuan Pelayanan Pemenuhan Gizi, berelasi ke kelurahan.

```sql
CREATE TABLE sppg (
  id             VARCHAR PRIMARY KEY,
  nama_sppg      VARCHAR NOT NULL,
  alamat         VARCHAR,
  geom           GEOMETRY(Point, 4326) NOT NULL,
  id_kelurahan   VARCHAR REFERENCES kelurahan(id)
);
CREATE INDEX idx_sppg_geom ON sppg USING GIST(geom);
```

### 3.4 Tabel `sekolah`
Menyimpan titik lokasi Sekolah Negeri, berelasi ke kelurahan.

```sql
CREATE TYPE jenjang_enum AS ENUM ('SD', 'SMP', 'SMA', 'SMK');

CREATE TABLE sekolah (
  id                      VARCHAR PRIMARY KEY,
  nama_satuan_pendidikan  VARCHAR NOT NULL,
  jenjang                 jenjang_enum NOT NULL,
  alamat                  VARCHAR,
  geom                    GEOMETRY(Point, 4326) NOT NULL,
  id_kelurahan            VARCHAR REFERENCES kelurahan(id)
);
CREATE INDEX idx_sekolah_geom ON sekolah USING GIST(geom);
```

### 3.5 Tabel `jaringan_jalan`
Menyimpan data jaringan jalan Jember. Data asli hanya memiliki `id` dan `geom`; kolom `source`, `target`, `cost`, dan `reverse_cost` digenerate secara otomatis oleh `pgr_createTopology` sebelum analisis pgRouting dijalankan.

```sql
-- Struktur awal (sesuai data asli)
CREATE TABLE jaringan_jalan (
  id    INT PRIMARY KEY,
  geom  GEOMETRY(LineString, 4326) NOT NULL
);
CREATE INDEX idx_jalan_geom ON jaringan_jalan USING GIST(geom);

-- Setelah import, tambahkan kolom pgRouting dan generate topologi
ALTER TABLE jaringan_jalan
  ADD COLUMN source      INTEGER,
  ADD COLUMN target      INTEGER,
  ADD COLUMN cost        FLOAT,
  ADD COLUMN reverse_cost FLOAT;

-- Hitung cost dari panjang aktual segmen jalan
UPDATE jaringan_jalan
  SET cost = ST_Length(geom::geography),
      reverse_cost = ST_Length(geom::geography);

-- Generate topologi jaringan (node source & target)
SELECT pgr_createTopology('jaringan_jalan', 0.00001, 'geom', 'id');

CREATE INDEX idx_jalan_source ON jaringan_jalan(source);
CREATE INDEX idx_jalan_target ON jaringan_jalan(target);
```



---

## 4. Spatial Query

### SQ-01: ST_Length — Akumulasi Panjang Jaringan Jalan Coverage SPPG
```sql
SELECT 
  sp.id AS sppg_id,
  sp.nama_sppg,
  SUM(ST_Length(j.geom::geography)) AS total_panjang_meter
FROM sppg sp
JOIN jaringan_jalan j 
  ON ST_DWithin(sp.geom::geography, j.geom::geography, 6000)
GROUP BY sp.id, sp.nama_sppg
ORDER BY total_panjang_meter DESC;
```

### SQ-02: pgr_drivingDistance — Identifikasi Sekolah Terlayani dan Blank Spot
```sql
SELECT 
  s.id AS sekolah_id,
  s.nama_satuan_pendidikan,
  sp.nama_sppg,
  dd.agg_cost AS jarak_tempuh_meter,
  CASE 
    WHEN dd.agg_cost <= 6000 THEN 'Terlayani'
    ELSE 'Blank Spot'
  END AS status_cakupan
FROM sppg sp
CROSS JOIN sekolah s
JOIN LATERAL (
  SELECT agg_cost 
  FROM pgr_drivingDistance(
    'SELECT id, source, target, ST_Length(geom::geography) AS cost FROM jaringan_jalan',
    sp.node_id,
    6000,
    directed := false
  ) AS dd
  WHERE dd.node = s.node_id
) dd ON true
ORDER BY sp.id, jarak_tempuh_meter;
```

### SQ-03: ST_Distance — Pengelompokan Sekolah Blank Spot
```sql
-- Blank spot dihitung on-the-fly dari hasil pgr_drivingDistance
WITH blank_spot AS (
  SELECT s.id, s.nama_satuan_pendidikan, s.geom
  FROM sekolah s
  WHERE NOT EXISTS (
    SELECT 1
    FROM sppg sp
    JOIN LATERAL (
      SELECT agg_cost
      FROM pgr_drivingDistance(
        'SELECT id, source, target, ST_Length(geom::geography) AS cost FROM jaringan_jalan',
        sp.node_id,
        6000,
        directed := false
      ) dd
      WHERE dd.node = s.node_id
    ) dd ON true
    WHERE dd.agg_cost <= 6000
  )
)
SELECT
  a.id AS sekolah_a_id,
  a.nama_satuan_pendidikan AS sekolah_a,
  b.id AS sekolah_b_id,
  b.nama_satuan_pendidikan AS sekolah_b,
  ST_Distance(a.geom::geography, b.geom::geography) AS jarak_meter
FROM blank_spot a
JOIN blank_spot b ON a.id < b.id
WHERE ST_Distance(a.geom::geography, b.geom::geography) <= 6000
ORDER BY jarak_meter;
```

### SQ-04: ST_Centroid — Titik Rekomendasi Lokasi SPPG Baru
```sql
-- kluster_id ditetapkan dari hasil SQ-03, dihitung on-the-fly
WITH blank_spot AS (
  SELECT s.id, s.geom, s.kluster_id
  FROM sekolah s
  WHERE NOT EXISTS (
    SELECT 1
    FROM sppg sp
    JOIN LATERAL (
      SELECT agg_cost
      FROM pgr_drivingDistance(
        'SELECT id, source, target, ST_Length(geom::geography) AS cost FROM jaringan_jalan',
        sp.node_id,
        6000,
        directed := false
      ) dd
      WHERE dd.node = s.node_id
    ) dd ON true
    WHERE dd.agg_cost <= 6000
  )
)
SELECT
  kluster_id,
  COUNT(*) AS jumlah_sekolah_blank_spot,
  ST_Centroid(ST_Collect(geom)) AS titik_rekomendasi_sppg
FROM blank_spot
GROUP BY kluster_id
ORDER BY jumlah_sekolah_blank_spot DESC;
```

### SQ-05: ST_Buffer — Validasi Jangkauan Titik Rekomendasi SPPG Baru
```sql
-- Rekomendasi dan blank spot dihitung on-the-fly
WITH blank_spot AS (
  SELECT s.id, s.nama_satuan_pendidikan, s.geom, s.kluster_id
  FROM sekolah s
  WHERE NOT EXISTS (
    SELECT 1
    FROM sppg sp
    JOIN LATERAL (
      SELECT agg_cost
      FROM pgr_drivingDistance(
        'SELECT id, source, target, ST_Length(geom::geography) AS cost FROM jaringan_jalan',
        sp.node_id,
        6000,
        directed := false
      ) dd
      WHERE dd.node = s.node_id
    ) dd ON true
    WHERE dd.agg_cost <= 6000
  )
),
rekomendasi AS (
  SELECT
    kluster_id,
    ST_Centroid(ST_Collect(geom)) AS titik_rekomendasi_sppg
  FROM blank_spot
  GROUP BY kluster_id
)
SELECT
  r.kluster_id,
  s.nama_satuan_pendidikan,
  ROUND(ST_Distance(r.titik_rekomendasi_sppg::geography, s.geom::geography)::numeric, 2) AS jarak_meter,
  CASE
    WHEN ST_Within(s.geom, ST_Buffer(r.titik_rekomendasi_sppg::geography, 6000)::geometry)
    THEN 'Terjangkau'
    ELSE 'Di luar jangkauan'
  END AS status_validasi
FROM rekomendasi r
JOIN blank_spot s ON s.kluster_id = r.kluster_id
ORDER BY r.kluster_id, jarak_meter;
```

### SQ-06: ST_Contains — Pengelompokan Output per Kelurahan
```sql
WITH coverage AS (
  SELECT DISTINCT ON (s.id)
    s.id AS sekolah_id,
    dd.agg_cost
  FROM sekolah s
  CROSS JOIN sppg sp
  JOIN LATERAL (
    SELECT agg_cost
    FROM pgr_drivingDistance(
      'SELECT id, source, target, ST_Length(geom::geography) AS cost FROM jaringan_jalan',
      sp.node_id,
      6000,
      directed := false
    ) dd
    WHERE dd.node = s.node_id
  ) dd ON true
  ORDER BY s.id, dd.agg_cost ASC
)
SELECT
  k.nama_kelurahan,
  s.nama_satuan_pendidikan,
  s.jenjang,
  CASE
    WHEN c.agg_cost <= 6000 THEN 'Terlayani'
    ELSE 'Blank Spot'
  END AS status_cakupan
FROM kelurahan k
JOIN sekolah s ON ST_Contains(k.geom, s.geom)
LEFT JOIN coverage c ON c.sekolah_id = s.id
ORDER BY k.nama_kelurahan, status_cakupan;
```

### SQ-07: ST_Area — Luas Area Coverage per SPPG
```sql
WITH driving AS (
  SELECT
    sp.id AS sppg_id,
    sp.nama_sppg,
    ST_ConvexHull(ST_Collect(v.geom)) AS coverage_geom
  FROM sppg sp
  JOIN LATERAL (
    SELECT jj.geom
    FROM pgr_drivingDistance(
      'SELECT id, source, target, ST_Length(geom::geography) AS cost FROM jaringan_jalan',
      sp.node_id,
      6000,
      directed := false
    ) dd
    JOIN jaringan_jalan jj ON jj.source = dd.node OR jj.target = dd.node
  ) v ON true
  GROUP BY sp.id, sp.nama_sppg
)
SELECT
  nama_sppg,
  ROUND((ST_Area(coverage_geom::geography) / 1e6)::numeric, 2) AS luas_coverage_km2
FROM driving
ORDER BY luas_coverage_km2 DESC;
```

---

## 5. API Routes (Next.js)

### 5.1 SPPG
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/sppg` | Ambil semua data SPPG beserta koordinat |
| GET | `/api/sppg/:id` | Detail satu SPPG |
| POST | `/api/sppg` | Tambah data SPPG baru |

### 5.2 Sekolah
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/sekolah` | Ambil semua data sekolah |
| GET | `/api/sekolah?kelurahan=:nama` | Filter sekolah per kelurahan |
| GET | `/api/sekolah/blank-spot` | Ambil sekolah yang belum terlayani |

### 5.3 Analisis Coverage
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/coverage` | Hasil analisis cakupan semua SPPG (SQ-01 + SQ-02) |
| GET | `/api/coverage/:sppg_id` | Coverage satu SPPG spesifik |
| GET | `/api/coverage/service-area` | GeoJSON poligon service area untuk ditampilkan di peta |

### 5.4 Rekomendasi
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/rekomendasi` | Ambil semua titik rekomendasi SPPG baru (SQ-04) |
| GET | `/api/rekomendasi/validasi` | Hasil validasi jangkauan rekomendasi (SQ-05) |
| POST | `/api/rekomendasi/generate` | Trigger kalkulasi ulang kluster dan sentroid |

### 5.5 Kelurahan
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/kelurahan` | Ambil semua data kelurahan beserta status cakupan (SQ-06) |
| GET | `/api/kelurahan/geojson` | GeoJSON batas kelurahan untuk layer peta |

---

## 6. Struktur Halaman (Next.js App Router)

```
app/
├── page.tsx                  # Halaman utama — peta interaktif
├── layout.tsx
├── dashboard/
│   └── page.tsx              # Ringkasan statistik cakupan per kelurahan
├── analisis/
│   ├── coverage/
│   │   └── page.tsx          # Peta coverage SPPG eksisting
│   ├── blank-spot/
│   │   └── page.tsx          # Peta sekolah blank spot
│   └── rekomendasi/
│       └── page.tsx          # Peta titik rekomendasi SPPG baru
├── data/
│   ├── sppg/
│   │   └── page.tsx          # Tabel data SPPG
│   └── sekolah/
│       └── page.tsx          # Tabel data sekolah
└── api/
    ├── sppg/route.ts
    ├── sekolah/route.ts
    ├── coverage/route.ts
    ├── rekomendasi/route.ts
    └── kelurahan/route.ts
```

---

## 7. Fitur Utama Aplikasi

### F-01: Peta Persebaran
Menampilkan titik lokasi seluruh SPPG dan Sekolah Negeri di atas peta dasar Kecamatan Sumbersari dengan marker berbeda per jenis objek dan jenjang sekolah.

### F-02: Visualisasi Coverage
Menampilkan poligon *service area* jaringan jalan 6 km dari setiap SPPG sebagai layer overlay pada peta, dengan warna berbeda per SPPG.

### F-03: Identifikasi Blank Spot
Menandai sekolah yang berada di luar coverage semua SPPG eksisting dengan marker khusus, dilengkapi informasi nama, jenjang, dan kelurahan.

### F-04: Peta Rekomendasi
Menampilkan titik sentroid rekomendasi lokasi SPPG baru beserta radius buffer 6 km validasinya, dilengkapi informasi jumlah sekolah yang akan terlayani per titik rekomendasi.

### F-05: Filter per Kelurahan
Memungkinkan pengguna memfilter tampilan peta dan tabel berdasarkan kelurahan, menampilkan ringkasan jumlah sekolah terlayani dan blank spot per kelurahan.

### F-06: Info Panel
Menampilkan detail informasi saat marker diklik: nama, alamat, status cakupan, SPPG terdekat, dan jarak tempuh.

---

## 8. Alur Analisis Sistem

```
Data OSM (Jaringan Jalan Jember)
        ↓
  PostgreSQL + pgRouting
        ↓
[SQ-01] ST_Length → Hitung panjang jaringan jalan dari SPPG
        ↓
[SQ-02] pgr_drivingDistance → Klasifikasi sekolah: Terlayani / Blank Spot
        ↓
[SQ-03] ST_Distance → Kelompokkan sekolah blank spot (kluster ≤ 6 km)
        ↓
[SQ-04] ST_Centroid → Hitung titik rekomendasi SPPG baru per kluster
        ↓
[SQ-05] ST_Buffer → Validasi jangkauan titik rekomendasi
        ↓
[SQ-06] ST_Contains → Kelompokkan output per kelurahan
        ↓
[SQ-07] ST_Area → Hitung luas coverage per SPPG
        ↓
  Next.js API Routes → Frontend (Leaflet/MapLibre) → Peta Interaktif
```

---

## 9. Format Data GeoJSON (Response API Peta)

Seluruh endpoint yang melayani data peta mengembalikan format GeoJSON standar:

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [113.7207, -8.1589]
      },
      "properties": {
        "id": 1,
        "nama": "SPPG Sumbersari",
        "tipe": "sppg",
        "status": "aktif",
        "luas_coverage_km2": 28.27
      }
    }
  ]
}
```

---

## 10. Catatan Implementasi

- Kolom `node_id` pada tabel `sppg` dan `sekolah` diisi dengan node pgRouting terdekat menggunakan fungsi `pgr_findCloseEdges` setelah data diimport.
- Data jaringan jalan OSM diimport menggunakan `osm2pgrouting` untuk memastikan topologi jaringan valid sebelum digunakan dalam `pgr_drivingDistance`.
- Sistem koordinat seluruh data menggunakan **WGS 84 (EPSG:4326)**; kalkulasi jarak menggunakan cast `::geography` untuk akurasi dalam satuan meter.
- Poligon `service_area` digenerate satu kali setelah data SPPG lengkap, disimpan ke tabel `service_area`, dan diperbarui hanya jika ada penambahan/perubahan data SPPG.
- Pengelompokan kluster blank spot (SQ-03) dilakukan secara manual berbasis threshold jarak 6 km; `kluster_id` diisi melalui skrip Python atau prosedur PostgreSQL tersendiri sebelum SQ-04 dijalankan.

## 11. Pola Koneksi Database (pg Adapter)

Seluruh akses database menggunakan `node-postgres` (`pg`) secara langsung tanpa ORM. Query ditulis sebagai raw SQL dan dieksekusi melalui `Pool`.

```javascript
// lib/db.js
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const query = (text, params) => pool.query(text, params);
```

Contoh penggunaan di API Route:

```javascript
// app/api/sppg/route.js
import { query } from '@/lib/db';

export async function GET() {
  const result = await query(`
    SELECT id, nama_sppg, alamat,
      ST_AsGeoJSON(geom)::json AS geometry
    FROM sppg
    ORDER BY id
  `);
  return Response.json({ data: result.rows });
}
```

Variabel lingkungan yang diperlukan di `.env.local`:

```
DATABASE_URL=postgresql://user:password@localhost:5432/sppg_gis_db
```
