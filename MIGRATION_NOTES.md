# Migration Notes: TanStack Start -> SvelteKit 3 (`sinarberkah-backend`)

Audit Fase 0 (sebelum perubahan kode aplikasi). Target deployment: Vercel Hobby (Node.js >= 22.17 via `@sveltejs/adapter-vercel`), package manager: Bun (`bun.lock`).

---

## 1. Daftar Rute

Seluruh rute halaman dan API bersifat **dinamis** (menggunakan cookie sesi admin, database Neon PostgreSQL, atau header `Cache-Control: private, no-store`).

### 1A. Rute Halaman

| File Route TanStack | URL Final | Statis / Dinamis | Auth & Catatan |
|---|---|---|---|
| `src/routes/__root.tsx` | *(Root layout)* | Dinamis | `lang="id"`, `noindex, nofollow`, memuat `globals.css?url`, `ThemeProvider`, `QueryProvider`, `Toaster`. |
| `src/routes/index.tsx` | `/` | Dinamis (redirect) | `beforeLoad` redirect ke `/admin`. |
| `src/routes/login.tsx` | `/login` | Dinamis | Guest-only (`beforeLoad` cek `getAdminServerFn()`, redirect ke `/admin` jika sudah login). Render `LoginForm` + Turnstile. |
| `src/routes/admin.tsx` | `/admin` *(layout)* | Dinamis | Admin-only (`beforeLoad` redirect ke `/login` jika belum login). Render `AdminShell`. |
| `src/routes/admin/index.tsx` | `/admin` | Dinamis | `loader`: `getDashboardServerFn()` (jumlah item & status readiness R2). |
| `src/routes/admin/storage.tsx` | `/admin/storage` | Dinamis (`?page=`) | Monitor kuota R2 & daftar aset (`GET /api/admin/storage`). |
| `src/routes/admin/products/index.tsx` | `/admin/products` | Dinamis (`?q=&page=`) | Daftar produk admin (`GET /api/admin/products`). |
| `src/routes/admin/products/new.tsx` | `/admin/products/new` | Dinamis | Form tambah produk (`POST /api/admin/products`). |
| `src/routes/admin/products/$id.edit.tsx` | `/admin/products/:id/edit` | Dinamis | Form edit produk (`GET/PATCH/DELETE /api/admin/products/:id`). |
| `src/routes/admin/portfolio/index.tsx` | `/admin/portfolio` | Dinamis (`?q=&page=`) | Daftar portofolio (`GET /api/admin/portfolio`). |
| `src/routes/admin/portfolio/new.tsx` | `/admin/portfolio/new` | Dinamis | Form tambah portofolio (`POST /api/admin/portfolio`). |
| `src/routes/admin/portfolio/$id.edit.tsx` | `/admin/portfolio/:id/edit` | Dinamis | Form edit portofolio (`GET/PATCH/DELETE /api/admin/portfolio/:id`). |
| `src/routes/admin/patterns/index.tsx` | `/admin/patterns` | Dinamis (`?q=&page=`) | Daftar pola (`GET /api/admin/patterns`). |
| `src/routes/admin/patterns/new.tsx` | `/admin/patterns/new` | Dinamis | Form tambah pola (`POST /api/admin/patterns`). |
| `src/routes/admin/patterns/$id.edit.tsx` | `/admin/patterns/:id/edit` | Dinamis | Form edit pola (`GET/PATCH/DELETE /api/admin/patterns/:id`). |

### 1B. Endpoint API (`src/routes/api/`)

Semua endpoint dibungkus `withApi(...)` dan mengembalikan `Cache-Control: private, no-store`.

| File Route | URL Final | Method | Auth / Akses | Rate Limit Eksisting | Menulis Data? (Acuan Prompt 2) |
|---|---|---|---|---|---|
| `api/health.ts` | `/api/health` | `GET` | `public` | `health` (30/60s) | Read-only (`SELECT 1`; rate limiter menulis tabel `rate_limits`) |
| `api/auth/login.ts` | `/api/auth/login` | `POST` | `session` (same-origin + Turnstile + password) | `login` (8/600s) | **YA** — set cookie `admin_session`, verifikasi Turnstile, tulis/reset `rate_limits` |
| `api/auth/logout.ts` | `/api/auth/logout` | `POST` | `session` (same-origin) | Tidak ada | **YA** — hapus cookie `admin_session` |
| `api/upload.ts` | `/api/upload` | `POST` | `admin` + same-origin | `upload` (30/600s) | **YA** — upload 2 objek R2 (`full` + `thumb`) & insert `media_objects` |
| `api/admin/storage.ts` | `/api/admin/storage` | `GET` | `admin` | Tidak ada | Tidak |
| `api/admin/diagnostics/image.ts` | `/api/admin/diagnostics/image` | `POST` | `admin` + same-origin | Tidak ada | Tidak (uji kompresi WebP di memori) |
| `api/admin/revalidate/test.ts` | `/api/admin/revalidate/test` | `POST` | `admin` + same-origin | Tidak ada | Eksternal (`POST` ke `${FRONTEND_URL}/api/revalidate`) |
| `api/admin/products/index.ts` | `/api/admin/products` | `GET`, `POST` | `admin` (+ same-origin pada `POST`) | Tidak ada | `POST`: **YA** — insert `products` + panggil `revalidateFrontend` |
| `api/admin/products/$id.ts` | `/api/admin/products/:id` | `GET`, `PATCH`, `DELETE` | `admin` (+ same-origin pada mutasi) | Tidak ada | `PATCH`/`DELETE`: **YA** — mutasi `products`, hapus R2/DB media lama, revalidate |
| `api/admin/portfolio/index.ts` | `/api/admin/portfolio` | `GET`, `POST` | `admin` | Tidak ada | `POST`: **YA** — insert `gallery_items` (`portfolio`) + revalidate |
| `api/admin/portfolio/$id.ts` | `/api/admin/portfolio/:id` | `GET`, `PATCH`, `DELETE` | `admin` | Tidak ada | `PATCH`/`DELETE`: **YA** — mutasi `gallery_items`, hapus media, revalidate |
| `api/admin/patterns/index.ts` | `/api/admin/patterns` | `GET`, `POST` | `admin` | Tidak ada | `POST`: **YA** — insert `gallery_items` (`pattern`) + revalidate |
| `api/admin/patterns/$id.ts` | `/api/admin/patterns/:id` | `GET`, `PATCH`, `DELETE` | `admin` | Tidak ada | `PATCH`/`DELETE`: **YA** — mutasi `gallery_items`, hapus media, revalidate |
| `api/cron/cleanup-media.ts` | `/api/cron/cleanup-media` | `GET` | `public` di middleware, cek Bearer `CRON_SECRET` di service | Tidak ada | **YA** — hapus `rate_limits` kedaluwarsa, hapus orphan R2 & `media_objects` (>24 jam) |
| `api/products/v1/index.ts` | `/api/products/v1` | `GET`, `OPTIONS` | `public` + CORS | `publicRead` (120/60s) | Read-only (rate limiter menulis `rate_limits`) |
| `api/products/v1/$id.ts` | `/api/products/v1/:id` | `GET`, `OPTIONS` | `public` + CORS | `publicRead` | Read-only |
| `api/gallery/v1/index.ts` | `/api/gallery/v1` | `GET`, `OPTIONS` | `public` + CORS | `publicRead` | Read-only (`kind = 'pattern'`) |
| `api/gallery/v1/$id.ts` | `/api/gallery/v1/:id` | `GET`, `OPTIONS` | `public` + CORS | `publicRead` | Read-only |
| `api/gallery/v1/portfolio/index.ts` | `/api/gallery/v1/portfolio` | `GET`, `OPTIONS` | `public` + CORS | `publicRead` | Read-only (`kind = 'portfolio'`) |
| `api/gallery/v1/portfolio/$id.ts` | `/api/gallery/v1/portfolio/:id` | `GET`, `OPTIONS` | `public` + CORS | `publicRead` | Read-only |
| `api/article/v1/index.ts` | `/api/article/v1` | `GET`, `OPTIONS` | `public` + CORS | `publicRead` | Stub daftar kosong (`items: []`) |

---

## 2. Sumber Data & Cara Akses

- **Database**: Neon Serverless PostgreSQL via `@neondatabase/serverless` (`neon(env.DATABASE_URI)` pada `src/lib/db/client.ts`).
- **Tabel (`scripts/schema.sql`)**: `admin_users`, `products`, `gallery_items`, `rate_limits`, `media_objects`.
- **Akses data**: SQL terparameterisasi di `src/features/*/repository.ts` -> logika bisnis di `src/features/*/service.ts` -> handler API & server functions.
- **Script pendukung**: `scripts/db-push.mjs`, `scripts/create-admin.mjs`, `scripts/check-boundaries.mjs`.

---

## 3. Server Function, Middleware, Auth, dan Form

- **Server Functions (`createServerFn`)**:
  - `getAdminServerFn` (`src/features/auth/server-fns.ts`)
  - `getDashboardServerFn` (`src/features/dashboard/server-fns.ts`)
  - `getProductByIdServerFn` (`src/features/products/server-fns.ts`, tidak terpakai oleh rute saat ini)
  - `getGalleryItemByIdServerFn` (`src/features/gallery/server-fns.ts`, tidak terpakai oleh rute saat ini)
- **Middleware API (`src/lib/api/with-api.ts`)**:
  - Request ID (`x-vercel-id` / UUID), preflight `OPTIONS` + CORS (`ALLOWED_ORIGINS`), CSRF same-origin (`assertSameOrigin` pada non-GET/HEAD/OPTIONS), rate limiter berbasis PostgreSQL (`rate_limits`, fail-open bila DB error), autentikasi admin via cookie `admin_session`, pemetaan `AppError`/`ZodError`/`ConfigError`.
- **Auth & Login (`src/lib/auth/*`, `src/server/turnstile.ts`)**:
  - Password hashing: `node:crypto` `scryptSync` (64 byte, format `${salt}:${hex}`) + `timingSafeEqual`.
  - Sesi: cookie `admin_session` (HttpOnly, SameSite=Lax, Secure di production, TTL 7 hari) bertanda tangan HMAC-SHA256 menggunakan `SESSION_SECRET`.
  - Login dilindungi Cloudflare Turnstile (`verifyTurnstile` fail-closed untuk action `"login"` & hostname allowlist).
- **Form (`react-hook-form` + `zod` v4)**:
  - `LoginForm` (`POST /api/auth/login`)
  - `ProductForm` (`POST /api/admin/products`, `PATCH /api/admin/products/:id`)
  - `GalleryForm` (`POST/PATCH /api/admin/portfolio` & `/api/admin/patterns`)
  - `ImageUploader` / `ImageField` (`POST /api/upload` via XHR progress + pre-shrink gambar client-side di `src/lib/image/prepare.ts`).

---

## 4. Detail Modul Cloudflare R2 & Pipeline Gambar (Migrasi Fase 5)

- **Klien R2 (`src/lib/storage/r2.ts`, `provider.ts`)**:
  - Menggunakan `aws4fetch` (`AwsClient`, service `"s3"`, region `"auto"`, path-style `${R2_ENDPOINT}/${R2_BUCKET_NAME}/${key}`).
  - Operasi: `putObject` (`Cache-Control: public, max-age=31536000, immutable`), `deleteObjects` (per-key `DELETE`), `headObject`, `listObjects`.
- **Prefix Key & Custom Domain (`src/lib/storage/media-key.ts`, `media-url.ts`)**:
  - Production (`VERCEL_ENV === "production"` atau `NODE_ENV === "production"` saat `VERCEL_ENV` tidak diset): `<uuid>.webp` dan `<uuid>-thumb.webp`.
  - Non-production: `dev/<uuid>.webp` dan `dev/<uuid>-thumb.webp`.
  - Folder (`products` / `portfolio` / `patterns`) **tidak** masuk dalam key R2, hanya disimpan di kolom `media_objects.folder`.
  - Custom domain publik: `R2_PUBLIC_DOMAIN` (`https://media-sb.raflisahrul.my.id`). `normalizeMediaInputForStorage()` memangkas origin domain menjadi key kanonik sebelum disimpan ke DB.
- **Kompresi WebP (`src/features/uploads/image-pipeline.ts`)**:
  - **Saat ini memakai `Bun.Image`** (bukan `sharp`!), dengan batas input 4 MiB (env `MAX_UPLOAD_MB`), batas pixel 50.000.000, deteksi magic bytes JPEG/PNG/WebP, penolakan WebP animasi (`ANIM`/`ANMF`/`VP8X`), auto-orient EXIF, serta output dual WebP:
    - `full`: max `1920x1920` (`fit: "inside"`, `withoutEnlargement: true`), tangga kualitas `[80, 72, 64, 56, 48]` hingga `<= 1 MiB` (jika tetap > 1 MiB -> error `413`).
    - `thumb`: max `480x480` (`fit: "inside"`, `withoutEnlargement: true`), kualitas `78`.
  - **Catatan migrasi Fase 5**: Karena target SvelteKit 3 di Vercel menggunakan **Node.js runtime (`>= 22.17`)** lewat `@sveltejs/adapter-vercel` 7, `Bun.Image` tidak tersedia di runtime Node.js dan **harus diganti dengan `sharp`** sambil mempertahankan seluruh batas validasi, dimensi, tangga kualitas, dan perilaku error yang sama.
- **Quota Guard & Cleanup (`src/features/uploads/service.ts`, `storage-service.ts`, `cleanup-service.ts`)**:
  - Quota guard menghitung pemakaian dari tabel Neon `media_objects` (`SUM(size_bytes + thumb_size_bytes)`), **tanpa** memanggil `ListObjectsV2` ke R2 saat runtime.
  - Batas default `R2_APP_QUOTA_MB = 2560` MiB (2.5 GiB). Menolak upload (`413 PAYLOAD_TOO_LARGE`) bila `currentUsed + processed.totalCompressedSize > quotaBytes`.
  - Rollback otomatis menghapus objek R2 bila upload thumbnail atau insert DB gagal.
  - Cron `/api/cron/cleanup-media` membersihkan `rate_limits` kedaluwarsa dan menghapus objek R2 + baris `media_objects` yang tidak direferensikan selama > 24 jam.

---

## 5. Dependency React-Spesifik & Padanan SvelteKit 3

| Paket Saat Ini (`sinarberkah-backend`) | Padanan SvelteKit 3 / Rilis Target |
|---|---|
| `@tanstack/react-start` (`1.169.4`), `@tanstack/react-router` (`1.170.46`), `nitro` | `@sveltejs/kit` (3.x stable), `@sveltejs/adapter-vercel` (7.x stable) |
| `react` (`19.3.1`), `react-dom` (`19.3.1`), `@vitejs/plugin-react` | `svelte` (5.x stable, runes), `@sveltejs/vite-plugin-svelte` (7.x stable) |
| `@tanstack/react-query` (`5.105.1`) | SvelteKit `load` + form actions / `fetch` + `$state` |
| `react-hook-form` (`7.91.0`), `@hookform/resolvers` (`7.0.1`) | Form actions / state runes Svelte 5 + validasi `zod` (4.6.7) |
| `radix-ui` (`1.8.1`), `shadcn` (23 komponen UI), `tw-animate-css`, `cn`, `class-variance-authority` | `bits-ui` (2.x) / `shadcn-svelte` (atau komponen UI Svelte 5 setara dengan class Tailwind v4 yang sama) |
| `lucide-react` (`1.66.0`), `react-icons` | `@lucide/svelte` (1.x) |
| `next-themes` (`0.4.6`), `sonner` (`2.0.8`) | Theme switcher Svelte 5 + toast Svelte (`svelte-sonner` atau komponen toast ringan sesuai tampilan `sonner`) |
| `@marsidev/react-turnstile` (`^1.6.3`) | Wrapper `<script>` Cloudflare Turnstile native di Svelte 5 |
| `Bun.Image` (runtime Bun) | `sharp` (0.35.x) di Node.js runtime |
| `@neondatabase/serverless`, `aws4fetch`, `zod`, `@fontsource-variable/*`, `tailwindcss` v4 | Tetap dipertahankan |
| `typescript` (`5.9.3`), `@biomejs/biome` (`2.6.6`), `vitest` (`5.1.0`) | `typescript` 6.x (`6.0.3`), `eslint`/`prettier` + `svelte-check`, `vitest` (5.x), `@playwright/test` |

---

## 6. Daftar Environment Variable

| Variabel | Scope | Keterangan |
|---|---|---|
| `DATABASE_URI` / `DATABASE_URL` / `POSTGRES_URL` | Private | Koneksi Neon PostgreSQL |
| `SESSION_SECRET` | Private | Kunci HMAC-SHA256 cookie `admin_session` (min 32 char) |
| `R2_ACCESS_KEY_ID` | Private | Kredensial S3/R2 |
| `R2_SECRET_ACCESS_KEY` | Private | Kredensial S3/R2 |
| `R2_ENDPOINT` | Private | Endpoint R2 (`https://...`) |
| `R2_BUCKET_NAME` | Private | Nama bucket R2 (`sinar-berkah`) |
| `R2_PUBLIC_DOMAIN` | Private / Server (+ dikirim ke UI jika perlu) | Custom domain media publik R2 (`https://...`) |
| `R2_APP_QUOTA_MB` | Private | Batas kuota aplikasi dalam MiB (default `2560`) |
| `MAX_UPLOAD_MB` | Private | Batas ukuran upload awal dalam MiB (default `4`, maks `4`) |
| `ALLOWED_ORIGINS` | Private | Daftar origin CORS publik (dipisah koma) |
| `FRONTEND_URL` | Private | URL frontend `sinarberkah-plato` untuk webhook `/api/revalidate` |
| `REVALIDATE_SECRET` | Private | Bearer secret webhook revalidasi |
| `CRON_SECRET` | Private | Bearer secret `/api/cron/cleanup-media` |
| `TURNSTILE_SECRET_KEY` | Private | Secret Cloudflare Turnstile |
| `TURNSTILE_ALLOWED_HOSTNAMES` | Private | Daftar hostname Turnstile |
| `VITE_TURNSTILE_SITE_KEY` | Public | Site key Turnstile -> di SvelteKit ganti ke `PUBLIC_TURNSTILE_SITE_KEY` (`$env/static/public`) |
| `VERCEL_ENV` / `NODE_ENV` | Runtime | Menentukan prefix key `dev/` & cookie `Secure` |

---

## 7. Risiko & Hal Ambigu

1. **Penggantian `Bun.Image` -> `sharp` & penghapusan `bun1.x` di Vercel**:
   - `@sveltejs/adapter-vercel` 7 hanya mendukung runtime **Node.js** (>= 22.17). `Bun.Image` harus diganti dengan `sharp` pada Fase 5, `vercel.json` harus menghapus `"bunVersion": "1.x"`, dan endpoint `/api/admin/diagnostics/image` beserta unit test-nya (`diagnostics-service.ts`, `image-pipeline.test.ts`, `image.test.ts`) perlu disesuaikan dari pemeriksaan `Bun.Image` menjadi pemeriksaan `sharp`.
2. **`queueMicrotask` pada `revalidateFrontend` (`src/lib/revalidate.ts`)**:
   - Pada runtime serverless Node.js di Vercel, `queueMicrotask` dapat terhenti sebelum HTTP `fetch` selesai setelah respons dikirim. Di SvelteKit pada Vercel Node.js, sebaiknya gunakan `waitUntil` dari `@vercel/functions` atau `await` dengan timeout singkat.
3. **Akses screenshot baseline `/admin/*`**:
   - Seluruh rute `/admin/*` dilindungi autentikasi `/login` (password scrypt + Cloudflare Turnstile + cookie HMAC `admin_session`). Baseline screenshot Fase 0 pada `sinarberkah-backend` hanya dapat mengambil rute publik (`/login` dan halaman 404) tanpa kredensial admin, kecuali pemilik repo memberikan kredensial uji lokal atau mengizinkan pengambilan manual.
4. **Sesi & Cookie (`@tanstack/react-start/server`)**:
   - `src/lib/auth/session.ts` saat ini memanggil `getCookie`/`setCookie`/`deleteCookie` dari `@tanstack/react-start/server`. Di SvelteKit, ini harus dipetakan ke `event.cookies` di `hooks.server.ts` / `+server.ts` / `+page.server.ts`.
5. **`SESSION_SECRET` fallback default di `src/lib/env.ts`**:
   - Saat ini `serverEnvSchema` memiliki nilai default hardcoded untuk `SESSION_SECRET`. Sebaiknya di produksi dipastikan wajib diset via env Vercel (akan dicatat, tanpa mengubah perilaku validasi yang tidak diminta).
6. **Node.js lokal**:
   - Di mesin lokal saat ini hanya `bun` (`1.4.4`) yang tersedia di PATH (belum ada binary `node`). Perlu dipastikan `vite`, `svelte-check`, `vitest`, dan `@playwright/test` berjalan mulus lewat `bun`, sementara Vercel tetap dikonfigurasi ke Node >= 22.17.
7. **Versi TypeScript**:
   - Versi latest di npm adalah `7.0.2`, namun prompt mewajibkan `typescript` **6.x terbaru** (`6.0.3`). Kita akan memakai `typescript@6.0.3`.

---

## 8. Baseline Screenshot (`.baseline-screenshots/before/`)

Diambil menggunakan Playwright Chromium terhadap `sinarberkah-backend` (TanStack Start `vite dev` di `http://127.0.0.1:4000`):

| File | URL / State | Viewport | HTTP Status |
|---|---|---|---|
| `.baseline-screenshots/before/login-desktop.png` | `/login` | `1440x900` | `200` |
| `.baseline-screenshots/before/login-mobile.png` | `/login` | `390x844` | `200` |
| `.baseline-screenshots/before/not-found-desktop.png` | `/halaman-tidak-ada-404` (404 state) | `1440x900` | `404` |
| `.baseline-screenshots/before/not-found-mobile.png` | `/halaman-tidak-ada-404` (404 state) | `390x844` | `404` |
| `.baseline-screenshots/before/admin-dashboard-desktop.png` | `/admin` | `1440x900` | `200` |
| `.baseline-screenshots/before/admin-dashboard-mobile.png` | `/admin` | `390x844` | `200` |
| `.baseline-screenshots/before/admin-storage-desktop.png` | `/admin/storage` | `1440x900` | `200` |
| `.baseline-screenshots/before/admin-storage-mobile.png` | `/admin/storage` | `390x844` | `200` |
| `.baseline-screenshots/before/admin-products-desktop.png` | `/admin/products` | `1440x900` | `200` |
| `.baseline-screenshots/before/admin-products-mobile.png` | `/admin/products` | `390x844` | `200` |
| `.baseline-screenshots/before/admin-products-new-desktop.png` | `/admin/products/new` | `1440x900` | `200` |
| `.baseline-screenshots/before/admin-products-new-mobile.png` | `/admin/products/new` | `390x844` | `200` |
| `.baseline-screenshots/before/admin-products-edit-desktop.png` | `/admin/products/:id/edit` | `1440x900` | `200` |
| `.baseline-screenshots/before/admin-products-edit-mobile.png` | `/admin/products/:id/edit` | `390x844` | `200` |
| `.baseline-screenshots/before/admin-portfolio-desktop.png` | `/admin/portfolio` | `1440x900` | `200` |
| `.baseline-screenshots/before/admin-portfolio-mobile.png` | `/admin/portfolio` | `390x844` | `200` |
| `.baseline-screenshots/before/admin-portfolio-new-desktop.png` | `/admin/portfolio/new` | `1440x900` | `200` |
| `.baseline-screenshots/before/admin-portfolio-new-mobile.png` | `/admin/portfolio/new` | `390x844` | `200` |
| `.baseline-screenshots/before/admin-patterns-desktop.png` | `/admin/patterns` | `1440x900` | `200` |
| `.baseline-screenshots/before/admin-patterns-mobile.png` | `/admin/patterns` | `390x844` | `200` |
| `.baseline-screenshots/before/admin-patterns-new-desktop.png` | `/admin/patterns/new` | `1440x900` | `200` |
| `.baseline-screenshots/before/admin-patterns-new-mobile.png` | `/admin/patterns/new` | `390x844` | `200` |

---

## 9. Hasil Migrasi & Verifikasi Akhir (Fase 1–7)

### Keputusan & Implementasi SvelteKit 3
- **Konfigurasi & Alias**: Seluruh konfigurasi SvelteKit 3 diletakkan di `vite.config.ts` (`sveltekit({...})`, **tanpa `svelte.config.js`**), dengan `@sveltejs/adapter-vercel` (`runtime: 'nodejs24.x'`, `regions: ['sin1']`) dan `imports` `#lib` / `#lib/*` di `package.json`.
- **Variabel Lingkungan**:
  - Publik (`$env/static/public`): `PUBLIC_TURNSTILE_SITE_KEY`.
  - Privat (`$env/dynamic/private`): `DATABASE_*`, `SESSION_SECRET`, `R2_*`, `MAX_UPLOAD_MB`, `ALLOWED_ORIGINS`, `FRONTEND_URL`, `REVALIDATE_SECRET`, `CRON_SECRET`, `TURNSTILE_*` dengan `static: false` agar terbaca dinamis saat runtime/tes.
- **Auth, Hooks, dan Revalidasi**:
  - `src/hooks.server.ts` menyelesaikan sesi `admin_session` (HMAC-SHA256 + `scryptSync` + `timingSafeEqual`) ke `event.locals.admin`.
  - `DeleteDialog` dan mobile nav drawer menggunakan elemen `<dialog>` native (`showModal()`, `overscroll-behavior: contain`).
  - `LoginForm` mempertahankan Cloudflare Turnstile widget serta `autocomplete="email"`, `autocomplete="current-password"`, dan `required`.
  - `revalidateFrontend` menggunakan `waitUntil` dari `@vercel/functions` bila tersedia agar request webhook tetap selesai di Vercel Node.js serverless.
  - Seluruh 17 endpoint API di `src/routes/api/**/+server.ts` tetap dibungkus `withApi(...)` (termasuk endpoint mutasi sebagai acuan Prompt 2 Rate Limiter).

### Migrasi Cloudflare R2 & `sharp` (Fase 5)
- `src/lib/server/storage/{types,r2,provider,media-url}.ts` dan `src/lib/server/features/uploads/*` dipindahkan apa adanya ke `#lib/server/*` dengan tetap mempertahankan struktur bucket, prefix `dev/` pada non-prod, nama env `R2_*`, dan quota guard Neon `media_objects` (`R2_APP_QUOTA_MB` default `2560` MiB) tanpa memanggil `ListObjectsV2` saat runtime.
- `Bun.Image` diganti dengan **`sharp`** (`^0.35.5`) pada `image-pipeline.ts` dan `diagnostics-service.ts`, tetap menjaga batas `MAX_IMAGE_PIXELS = 50_000_000`, `FULL_MAX_DIMENSION = 1920`, `THUMB_MAX_DIMENSION = 480`, `FULL_MAX_BYTES = 1_048_576`, quality ladder `[80, 72, 64, 56, 48]`, `THUMB_QUALITY = 78`, penolakan WebP animasi, serta auto-orient EXIF `.rotate()`.

### Versi Paket Final (`package.json`)
- `@sveltejs/kit`: `^3.2.1` (tetap di `3.2.1`; `3.3.0` dirilis 2026-11-17 sehingga dihindari sesuai aturan < 14 hari)
- `svelte`: `^5.57.3`
- `vite`: `^8.3.8`
- `@sveltejs/vite-plugin-svelte`: `^7.3.1`
- `@sveltejs/adapter-vercel`: `^7.0.4`
- `typescript`: `~6.0.3` (tetap di major `6.x`, bukan `7.0.2`)
- `svelte-check`: `^4.7.8`
- `tailwindcss` & `@tailwindcss/vite`: `4.3.5`
- `sharp`: `^0.35.5`, `@neondatabase/serverless`: `^1.2.1`, `aws4fetch`: `^1.0.20`, `zod`: `4.6.7`, `@lucide/svelte`: `^1.74.0`
- `vitest`: `^5.1.0`, `@playwright/test`: `^1.65.1`, `eslint`: `^10.15.0`, `prettier`: `^3.10.1`

### Status Verifikasi Pasca-Pembersihan
- **Pembersihan**: `.legacy/`, `biome.json`, `components.json`, `vitest.config.mts`, dan seluruh dependency React/TanStack/Biome/Nitro/Radix telah dihapus (`bun.lock` diperbarui). `scripts/check-boundaries.mjs` sudah disesuaikan ke struktur `#lib/server` + `withApi()`.
- **Screenshot Before/After**: Tersimpan di `.baseline-screenshots/before/` dan `.baseline-screenshots/after/` (diabaikan di `.gitignore`), termasuk halaman `/login`, `/admin`, `/admin/storage`, `/admin/products*`, `/admin/portfolio*`, `/admin/patterns*` untuk desktop `1440x900` dan mobile `390x844`.
- **Setting Manual Vercel**: Pastikan Node.js Version di Project Settings Vercel diset ke **24.x** (minimum `>= 22.17`), dan perbarui env publik Turnstile menjadi `PUBLIC_TURNSTILE_SITE_KEY`.
