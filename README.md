# Sistem Informasi Geografis (SIG) SPPG & Sekolah Negeri
### Kecamatan Sumbersari, Jember

Aplikasi web berbasis GIS (Geographic Information System) untuk memetakan persebaran Satuan Pelayanan Gizi (SPPG) dan Sekolah Negeri di Kecamatan Sumbersari, Jember. Aplikasi ini menganalisis cakupan pelayanan sekolah berbasis jarak tempuh jaringan jalan (6 km) menggunakan PostGIS dan pgRouting, mengidentifikasi wilayah *blank spot*, dan merumuskan rekomendasi penempatan SPPG baru.

---

## 🚀 Fitur Utama

- **Peta Interaktif GIS (Leaflet.js)**: Menyajikan peta batas administrasi kelurahan, persebaran titik SPPG, titik sekolah, polygon area pelayanan (*Service Area*), serta titik rekomendasi SPPG baru.
- **Analisis Jaringan Jalan (Routing)**:
  - **SQ-01 (Panjang Jalan Coverage)**: Menghitung total panjang jaringan jalan yang tercover oleh masing-masing SPPG dalam radius 6 km.
  - **SQ-02 (Jarak Tempuh Terpendek)**: Menghitung jarak tempuh aktual dari sekolah ke SPPG terdekat berbasis jaringan jalan (menggunakan algoritma Dijkstra pgRouting).
- **Analisis Kesenangan Pelayanan (Blank Spot)**: Mengidentifikasi sekolah-sekolah yang berada di luar jangkauan pelayanan SPPG (> 6 km berkendara).
- **Rekomendasi Spasial (SQ-04 & SQ-05)**:
  - Mengelompokkan sekolah-sekolah *blank spot* menggunakan clustering spasial.
  - Menghitung koordinat centroid (`ST_Centroid`) untuk menentukan posisi usulan SPPG baru.
  - Memvalidasi jangkauan area usulan baru dengan buffer lingkaran spasial 6 km.
- **Desain Premium**: Mengadopsi prinsip desain dari **Mindful Moments Dashboard** dalam format *Light Mode* yang elegan:
  - **Palet Warna**: Cream (`#F8F3EE`), Forest Green (`#1C322D`), Terracotta (`#F1CDBE`), dan Gold (`#EBB552`).
  - **Tipografi**: Inter (Sanskrit/San-serif untuk headers), Playfair Display (Serif untuk deskripsi), JetBrains Mono (Monospace untuk metrics/data teknis).

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 14+ (App Router, React, Tailwind CSS)
- **Library Peta**: Leaflet.js
- **Backend/API Consumers**: Next.js Route Handlers
- **Arsitektur**: Service-Repository Pattern
- **Database**: PostgreSQL dengan ekstensi **PostGIS** dan **pgRouting**
- **Dockerization**: Dockerfile & Docker Compose

---

## 🗄️ Skema Database & Auto-Initialization

Saat aplikasi pertama kali terhubung ke PostgreSQL:
1. Melakukan deteksi keberadaan database target (`sppg_gis_db`). Jika belum ada, sistem akan membuat database tersebut secara otomatis.
2. Mengaktifkan ekstensi `postgis` dan `rtopo`/`pgrouting`.
3. Membangun tabel-tabel utama secara dinamis jika belum terbentuk:
   - `sppg`: Menyimpan titik koordinat lokasi SPPG.
   - `sekolah`: Menyimpan data sekolah negeri (SD, SMP, SMA, SMK) beserta status cakupannya.
   - `jaringan_jalan` & `jaringan_jalan_vertices_pgr`: Untuk pemrosesan graph routing jalan raya.
   - `batas_kelurahan`: Polygon wilayah kelurahan di Sumbersari.
   - `sekolah_blank_spot` & `rekomendasi_sppg`: Menampung hasil kalkulasi centroid spasial.

---

## 📦 Cara Menjalankan Aplikasi

### Persyaratan Utama
- Node.js (v18+)
- pnpm / npm / yarn
- Docker & Docker Compose (Direkomendasikan)

---

### Metode A: Menjalankan Menggunakan Docker (Sangat Direkomendasikan)

Docker Compose akan otomatis menginisialisasi database PostgreSQL yang dilengkapi PostGIS/pgRouting serta menjalankan aplikasi Next.js secara bersamaan.

1. **Jalankan Docker Compose**:
   ```bash
   docker compose up --build
   ```
2. **Akses Aplikasi**:
   Buka [http://localhost:3000](http://localhost:3000) pada browser Anda.

---

### Metode B: Menjalankan Secara Lokal (Development)

1. **Salin file Environment Variables**:
   Buat file `.env.local` di root direktori dan sesuaikan kredensial database Anda:
   ```env
   DATABASE_URL=postgres://postgres:password@localhost:5432/sppg_gis_db
   ```
2. **Install Dependensi**:
   ```bash
   pnpm install
   ```
3. **Jalankan Server Development**:
   ```bash
   pnpm run dev
   ```
4. **Akses Aplikasi**:
   Aplikasi berjalan di [http://localhost:3000](http://localhost:3000).
