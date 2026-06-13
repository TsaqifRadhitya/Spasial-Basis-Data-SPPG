# Sistem Informasi Geografis (SIG) SPPG & Sekolah Negeri
### Kecamatan Sumbersari, Jember

Aplikasi web berbasis GIS (**Geographic Information System**) untuk memetakan persebaran **Satuan Pelayanan Gizi (SPPG)** dan **Sekolah Negeri** di Kecamatan Sumbersari, Jember. Aplikasi menganalisis cakupan pelayanan berbasis jarak tempuh aktual jaringan jalan (≤ 6 km) menggunakan **PostGIS**, **pgRouting**, dan **Google Maps Routes API**, mengidentifikasi wilayah *blank spot*, serta merumuskan rekomendasi penempatan SPPG baru secara spasial.

---

## 🚀 Fitur Utama

### 🗺️ Peta Interaktif (Leaflet.js)
- Peta berbasis tile **CartoDB Voyager** dengan overlay layer yang dapat di-toggle secara independen:
  - **Batas Wilayah Administrasi** — Polygon kelurahan & kecamatan dengan warna unik per kelurahan
  - **Jaringan Distribusi** — Visualisasi semua rute distribusi aktif sebagai garis tipis ungu; disorot tebal saat sekolah/SPPG dipilih
  - **Satuan Pelayanan Gizi (SPPG)** — Marker ikon bangunan gold/green yang dapat diklik
  - **Sekolah Negeri** — Marker ikon sekolah dengan badge status (terlayani / blank spot)
  - **Rekomendasi SPPG Baru** — Centroid kluster blank spot dengan buffer radius 6 km

### 📊 Analisis Spasial
| Kode | Analisis | Keterangan |
|------|----------|------------|
| SQ-01 | Panjang Jalan Coverage | Total panjang jaringan jalan dalam radius 6 km tiap SPPG |
| SQ-02 | Jarak Tempuh Terpendek | Jarak berkendara aktual sekolah → SPPG terdekat (Dijkstra / Google Maps) |
| SQ-03 | Blank Spot Detection | Sekolah di luar jangkauan ≤ 6 km dari semua SPPG aktif |
| SQ-04 | Clustering Blank Spot | Pengelompokan spasial sekolah blank spot |
| SQ-05 | Rekomendasi Posisi SPPG | Centroid (`ST_Centroid`) per kluster sebagai usulan lokasi SPPG baru |

### 🏫 Manajemen Data (CRUD)
- **Tambah SPPG** — Input nama, alamat, koordinat. Sistem otomatis menetapkan & merutekan sekolah-sekolah dalam radius 6 km ke SPPG baru menggunakan jarak tempuh aktual (Google Maps Routes API).
- **Hapus SPPG** — Menghapus SPPG dan secara otomatis merelokasi sekolah yang terdampak ke SPPG terdekat berikutnya (atau menjadi blank spot bila tidak ada).
- **Tambah Sekolah** — Input data sekolah. Sistem otomatis mencari & menetapkan SPPG terdekat via routing aktual.
- **Hapus Sekolah** — Hapus data sekolah beserta rute distribusinya.
- **Kalkulasi Ulang Rekomendasi** — Trigger ulang seluruh proses clustering & centroid setelah perubahan data.

### 🃏 Overlay Detail Interaktif
- **Detail Sekolah** — Card overlay top-right: nama, jenjang, kelurahan, alamat, status, nama SPPG yang melayani, dan jarak tempuh berkendara.
- **Detail SPPG** — Card overlay: nama, alamat, jumlah sekolah dilayani, daftar sekolah lengkap dengan jarak tempuh.
- **Ringkasan Kelurahan** — Card overlay: statistik terlayani/blank spot, daftar SPPG dan sekolah di kelurahan tersebut (klik untuk navigasi ke marker).

---

## 🛠️ Tech Stack

| Layer | Teknologi |
|-------|-----------|
| **Frontend** | Next.js 16 (App Router), React 19, Tailwind CSS v4 |
| **Peta** | Leaflet.js 1.9 |
| **Backend API** | Next.js Route Handlers |
| **Arsitektur** | Service-Repository Pattern |
| **Database** | PostgreSQL + **PostGIS** + **pgRouting** |
| **Routing Eksternal** | Google Maps Routes API |
| **Runtime DB Client** | `pg` (node-postgres) |
| **Container** | Docker & Docker Compose |

---

## 📁 Struktur Direktori

```
spatial/
├── app/
│   ├── page.tsx              # Dashboard utama (h-screen, sidebar + peta)
│   ├── layout.tsx            # Root layout, metadata SEO, font
│   ├── globals.css           # Global styles & Tailwind config
│   └── api/
│       ├── sppg/             # GET, POST /api/sppg | DELETE /api/sppg/[id]
│       ├── sekolah/          # GET, POST /api/sekolah | DELETE /api/sekolah/[id]
│       ├── coverage/         # GET /api/coverage & /api/coverage/service-area
│       ├── kelurahan/        # GET /api/kelurahan & /api/kelurahan/geojson
│       ├── rekomendasi/      # GET /api/rekomendasi | POST /api/rekomendasi/generate
│       └── jalan/            # GET /api/jalan (raw road network)
├── components/
│   └── MapComponent.tsx      # Leaflet map (SSR-disabled), semua layer & interaksi
├── lib/
│   ├── db.ts                 # Koneksi PostgreSQL pool
│   ├── repositories/         # Data-access layer (raw SQL + PostGIS queries)
│   │   ├── sekolahRepository.ts
│   │   ├── sppgRepository.ts
│   │   ├── kelurahanRepository.ts
│   │   ├── coverageRepository.ts
│   │   ├── rekomendasiRepository.ts
│   │   └── jalanRepository.ts
│   ├── services/             # Business logic & GeoJSON transformation
│   │   ├── sekolahService.ts
│   │   └── sppgService.ts
│   └── utils/
│       └── googleMaps.ts     # Google Maps Routes API & Distance Matrix client
├── database/
│   └── migrate.ts            # Script migrasi & inisialisasi skema DB
├── seeds/                    # Data CSV benih (SPPG, sekolah, kelurahan, jalan)
├── Dockerfile
├── docker-compose.yml
└── .env.example
```

---

## 🗄️ Skema Database

| Tabel | Keterangan |
|-------|------------|
| `sppg` | Titik koordinat & metadata SPPG |
| `sekolah` | Data sekolah negeri + `id_sppg` (FK) + `jalur_distribusi` (geometry LineString) |
| `kelurahan` | Polygon batas wilayah administrasi kelurahan & kecamatan |
| `jaringan_jalan` | Graph topologi jaringan jalan untuk pgRouting |
| `jaringan_jalan_vertices_pgr` | Node-node graph (auto-generated pgRouting) |
| `rekomendasi_sppg` | Hasil centroid kluster blank spot |

> **`jalur_distribusi`** — kolom geometry `LINESTRING` di tabel `sekolah` yang menyimpan rute berkendara aktual dari sekolah ke SPPG-nya, dihitung via Google Maps Routes API dan disimpan dalam format WKT (`ST_GeomFromText`).

---

## 📦 Cara Menjalankan

### Persyaratan
- Node.js ≥ 18 & `pnpm`
- PostgreSQL dengan ekstensi **PostGIS** & **pgRouting** (atau gunakan Docker)
- (Opsional) Google Maps API Key untuk routing aktual

---

### Metode A: Docker (Direkomendasikan)

Docker Compose otomatis menyiapkan PostgreSQL+PostGIS/pgRouting dan aplikasi Next.js.

```bash
# 1. Salin env dan isi kredensial
cp .env.example .env.local

# 2. Jalankan semua service
docker compose up --build
```

Buka [http://localhost:3000](http://localhost:3000).

---

### Metode B: Lokal (Development)

```bash
# 1. Salin dan konfigurasi environment
cp .env.example .env.local
# Edit .env.local — isi DATABASE_URL & GOOGLE_MAPS_API_KEY

# 2. Install dependensi
pnpm install

# 3. Jalankan migrasi database
pnpm run migrate

# 4. (Opsional) Seed data awal
pnpm run seed

# 5. Jalankan dev server
pnpm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

---

### Environment Variables

```env
# .env.local
DATABASE_URL=postgres://postgres:password@localhost:5432/sppg_gis_db
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

> Tanpa `GOOGLE_MAPS_API_KEY`, sistem tetap berjalan menggunakan fallback routing Dijkstra berbasis pgRouting.

---

## 🎨 Desain

Menggunakan palet warna yang konsisten dan tipografi premium:

| Peran | Nilai |
|-------|-------|
| Background | `#F8F3EE` (Cream) |
| Primary | `#1C322D` (Forest Green) |
| Accent | `#EBB552` (Gold) |
| Highlight | `#8B5CF6` (Purple — rute distribusi) |
| Alert | `#E0533C` (Terracotta — blank spot / SPPG selection) |
| Soft fill | `#F1CDBE` (Pastel Coral) |

**Tipografi**: Inter (sans-serif), Playfair Display (serif deskripsi), JetBrains Mono (data/metrik).

---

## 👤 Author

**Tsaqif Radhitya** — Tugas Akhir Basis Data Spasial, Sistem Informasi Geografis  
Universitas Jember · 2025
