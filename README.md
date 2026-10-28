# Sinar Berkah Backend

Backend dan panel admin untuk website Sinar Berkah. Dipakai untuk mengelola **produk**, **portofolio**, dan **galeri pola**. Data disimpan di PostgreSQL, foto disimpan di Vercel Blob.

- **Stack:** Next.js 16 (App Router), TypeScript, Tailwind CSS 4, PostgreSQL (Drizzle ORM), Zod, Vercel Blob
- **Panel admin:** `/admin` (login dulu di `/login`)
- **API:** `/api/...` (dibaca publik, diubah hanya oleh admin)

## Mulai

### 1. Pasang paket

```bash
npm install
```

### 2. Siapkan PostgreSQL

**Lokal (Docker Compose)** — disarankan untuk pengembangan. Pastikan Docker Desktop sudah jalan, lalu:

```bash
npm run db:up        # nyalakan PostgreSQL (menunggu sampai siap)
```

Database berjalan di `localhost:5432` (hanya bisa dijangkau dari komputer ini). Nilai bawaan ada di `docker-compose.yml`:

| Pengaturan | Nilai bawaan |
|---|---|
| User | `sinarberkah` |
| Password | `sinarberkah_dev` |
| Database | `sinarberkah` |
| Port | `5432` |

Untuk mengubahnya, buat file `.env` di folder ini, mis. `POSTGRES_PASSWORD=rahasia` atau `POSTGRES_PORT=5433`, lalu samakan `DATABASE_URL` di `.env.local`.
Data tersimpan di volume Docker `sinarberkah_pgdata`, jadi tetap ada setelah `npm run db:down`.

**Produksi** — pakai PostgreSQL terkelola, mis. [Neon](https://neon.tech) lewat Vercel Marketplace (**Storage > Create > Postgres**), Supabase, atau Railway. Pakai alamat **pooled** (untuk Neon, host mengandung `-pooler`). Salin ke `DATABASE_URL`.

### 3. Siapkan Vercel Blob (penyimpanan foto)

1. Di [Vercel Dashboard](https://vercel.com/dashboard) buka **Storage > Create > Blob**.
2. Salin `BLOB_READ_WRITE_TOKEN` dari tab **.env.local**.

Tanpa token ini unggah foto tidak aktif, tetapi Anda masih bisa menempel URL foto.

### 4. Isi file `.env.local`

```bash
copy .env.example .env.local      # Windows
# cp .env.example .env.local      # macOS / Linux
```

| Variabel | Isi |
|---|---|
| `DATABASE_URL` | Connection string PostgreSQL (nilai bawaan cocok dengan Docker Compose) |
| `BLOB_READ_WRITE_TOKEN` | Token Vercel Blob |
| `AUTH_SECRET` | Teks acak minimal 32 karakter |
| `ADMIN_EMAIL` | Email untuk login admin |
| `ADMIN_PASSWORD_HASH` | Hash password admin (lihat di bawah) |
| `ALLOWED_ORIGINS` | Alamat frontend yang boleh membaca API dari browser, pisahkan dengan koma |

Membuat `AUTH_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Membuat `ADMIN_PASSWORD_HASH` (password minimal 10 karakter):

```bash
npm run hash-password -- "password-anda"
```

Salin baris `ADMIN_PASSWORD_HASH=...` yang tercetak ke `.env.local`.

### 5. Buat tabel

```bash
npm run db:migrate
```

### 6. Jalankan

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000), lalu masuk dengan `ADMIN_EMAIL` dan password Anda.

> Frontend (`sinarberkah-plato`) juga memakai port 3000. Jalankan salah satunya di port lain, mis. `npm run dev -- -p 4000`.

## Perintah

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Server pengembangan |
| `npm run build` / `npm run start` | Build dan jalankan produksi |
| `npm run lint` | Cek kode |
| `npm run typecheck` | Cek tipe TypeScript |
| `npm run hash-password -- "..."` | Buat hash password admin |
| `npm run db:up` / `npm run db:down` | Nyalakan / matikan PostgreSQL lokal (Docker) |
| `npm run db:migrate` | Terapkan migrasi ke database |
| `npm run db:generate` | Buat file migrasi baru setelah `src/db/schema.ts` diubah |
| `npm run db:studio` | Buka Drizzle Studio untuk melihat isi tabel |

## API

Semua respons berbentuk `{ "data": ... }`. Daftar juga memuat `meta` (`total`, `page`, `limit`, `totalPages`). Error berbentuk `{ "error": { "message": "...", "details": { "fieldErrors": {...} } } }`.

| Metode | Alamat | Fungsi | Akses |
|---|---|---|---|
| GET | `/api/products/v1` | Daftar produk aktif | Publik |
| GET | `/api/products/v1/{id}` | Detail produk | Publik |
| POST | `/api/products/v1` | Tambah produk | Admin |
| PUT / PATCH | `/api/products/v1/{id}` | Ubah produk (kolom yang dikirim saja) | Admin |
| DELETE | `/api/products/v1/{id}` | Hapus produk dan fotonya | Admin |
| GET | `/api/gallery/v1/portfolio` | Daftar portofolio | Publik |
| POST, PUT, PATCH, DELETE | `/api/gallery/v1/portfolio[/{id}]` | Kelola portofolio | Admin |
| GET | `/api/gallery/v1` | Daftar galeri pola | Publik |
| POST, PUT, PATCH, DELETE | `/api/gallery/v1[/{id}]` | Kelola pola | Admin |
| POST | `/api/upload` | Unggah foto (`multipart/form-data`: `file`, `folder`) | Admin |
| POST | `/api/auth/login`, `/api/auth/logout` | Masuk / keluar | - |
| GET | `/api/health` | Cek server hidup | Publik |

Parameter daftar: `?page=1&limit=50&q=kata`. `limit` maksimal 100.

Alamat `/api/gallery/v1` dan `/api/gallery/v1/portfolio` sama dengan yang sudah dipanggil frontend, jadi frontend langsung jalan.

### Bentuk data

Produk:

```json
{
  "_id": "0b6c1c0e-5c0a-4a53-9d6e-2f4f6f0a1b2c",
  "name": "Pagar Motif Daun",
  "category": "Pagar",
  "description": "",
  "price": 1500000,
  "image": { "image_url": "https://....public.blob.vercel-storage.com/..." },
  "isActive": true,
  "createdAt": "2026-10-28T09:00:00.000Z",
  "updatedAt": "2026-10-28T09:00:00.000Z"
}
```

Portofolio dan pola:

```json
{
  "_id": "0b6c1c0e-5c0a-4a53-9d6e-2f4f6f0a1b2c",
  "kind": "portfolio",
  "title": "Pagar balkon motif daun",
  "type": "Pagar",
  "description": "",
  "image": { "image_url": "https://..." }
}
```

Saat mengirim data (POST/PUT), foto dikirim sebagai `image_url` (URL `https`):

```json
{ "title": "Pola LC 071", "type": "LC 071", "description": "", "image_url": "https://..." }
```

### Menyambungkan ke frontend

Di proyek frontend, isi `API_BASE_URL` dengan alamat backend ini (tanpa `/` di akhir), mis. `API_BASE_URL=https://sinarberkah-backend.vercel.app`.
Frontend membaca data di server dan menyimpannya 1 jam, jadi perubahan dari panel admin tampil dalam ±1 jam.

## Keamanan

- Perubahan data hanya lewat sesi admin (cookie `httpOnly`, `sameSite=lax`, berlaku 7 hari).
- Permintaan ubah-data dicek asalnya (`Origin` harus sama dengan host) untuk mencegah CSRF.
- Password admin disimpan sebagai hash `scrypt`, tidak pernah sebagai teks biasa.
- Login dibatasi 8 percobaan per 10 menit per IP. Batas ini ada di memori server, jadi di Vercel hanya berlaku per instance. Untuk perlindungan penuh aktifkan Vercel Firewall.
- Unggah foto dicek tipe, ukuran (maks 4 MB), dan isi file (JPG, PNG, WebP).
- Hanya ada satu akun admin (dari variabel lingkungan). Jangan commit `.env.local`.

## Deploy ke Vercel

Backend dan frontend adalah **dua proyek Vercel yang terpisah**. Deploy backend dulu, karena alamatnya dibutuhkan frontend.
Keduanya sudah memakai wilayah Singapura (`sin1`) lewat `vercel.json`, paling dekat ke Indonesia.

### 1. Push ke GitHub

Buat dua repositori (backend dan frontend), lalu push masing-masing. Pastikan `.env.local` tidak ikut (sudah ada di `.gitignore`).

### 2. Backend

1. Di [vercel.com/new](https://vercel.com/new) impor repositori backend. Framework terdeteksi otomatis sebagai Next.js.
2. Buka **Storage** pada proyek, lalu:
   - **Create > Postgres** (Neon via Marketplace). Pilih wilayah **Singapore** agar dekat dengan fungsi. Ini mengisi `DATABASE_URL` dan `POSTGRES_URL` otomatis.
   - **Create > Blob**. Ini mengisi `BLOB_READ_WRITE_TOKEN` otomatis. Pilih **Public**.
3. Buka **Settings > Environment Variables** dan tambahkan sendiri:

   | Variabel | Isi |
   |---|---|
   | `AUTH_SECRET` | Teks acak minimal 32 karakter (lihat langkah 4 di bagian Mulai) |
   | `ADMIN_EMAIL` | Email admin |
   | `ADMIN_PASSWORD_HASH` | Hasil `npm run hash-password -- "password-anda"` |
   | `ALLOWED_ORIGINS` | Alamat frontend produksi, mis. `https://sinarberkah.vercel.app` (isi setelah frontend jadi) |

4. Klik **Deploy**.

Saat build di **Production**, tabel dibuat otomatis (`scripts/vercel-build.mjs` menjalankan `drizzle-kit migrate`).
Build **Preview** tidak menjalankan migrasi, supaya deploy percobaan tidak mengubah database produksi.

Jika Anda mengubah `src/db/schema.ts`: jalankan `npm run db:generate` di komputer, commit folder `drizzle/`, lalu push. Migrasi berjalan pada deploy Production berikutnya.

### 3. Frontend

1. Impor repositori frontend di Vercel.
2. Tambahkan variabel:

   | Variabel | Isi |
   |---|---|
   | `API_BASE_URL` | Alamat backend, mis. `https://sinarberkah-backend.vercel.app` (tanpa `/` di akhir) |
   | `NEXT_PUBLIC_SITE_URL` | Alamat frontend, mis. `https://sinarberkah.vercel.app` |

3. Klik **Deploy**.

### 4. Setelah keduanya jalan

1. Isi `ALLOWED_ORIGINS` di backend dengan alamat frontend, lalu **Redeploy** backend.
2. Buka `https://<alamat-backend>/login`, masuk, lalu isi produk, portofolio, dan pola.
3. Frontend menyimpan data 1 jam. Untuk melihat perubahan segera, **Redeploy** frontend.

### Lewat terminal (opsional)

```bash
npm i -g vercel
vercel login
vercel link          # hubungkan folder ini ke proyek Vercel
vercel env pull .env.local   # salin variabel dari Vercel ke komputer
vercel --prod        # deploy produksi
```

`vercel env pull` menimpa `.env.local`. Setelah itu `DATABASE_URL` menunjuk ke database Vercel, jadi pakai dengan hati-hati saat mengembangkan.

## Struktur

```
src/
  app/
    admin/        Panel admin (dashboard, produk, portofolio, galeri pola)
    login/        Halaman masuk
    api/          Endpoint API
  components/
    admin/        Form, daftar, kerangka admin
    ui/           Tombol, kolom isian, pesan
  db/             Skema tabel (Drizzle)
  lib/            crud.ts (handler CRUD umum), repositories.ts (akses database), auth.ts, db.ts, blob.ts, validation.ts
```
