# Sinar Berkah backend

Backend and admin panel for the Sinar Berkah website. You use it to manage products, portfolio projects, and the pattern gallery. Text data lives in PostgreSQL and photos live in Vercel Blob.

- Stack: Next.js 16 (App Router), TypeScript, Tailwind CSS 4, PostgreSQL with Drizzle ORM, Zod, Vercel Blob
- Admin panel: `/admin` (sign in at `/login`)
- API: `/api/...` (anyone can read, only the admin can write)

## Getting started

### 1. Install packages

```bash
npm install
```

### 2. Set up PostgreSQL

Local development uses Docker Compose. Start Docker Desktop, then run:

```bash
npm run db:up        # starts PostgreSQL and waits until it is ready
```

The database listens on `localhost:5432` and accepts connections from your computer only. The defaults live in `docker-compose.yml`:

| Setting  | Default           |
| -------- | ----------------- |
| User     | `sinarberkah`     |
| Password | `sinarberkah_dev` |
| Database | `sinarberkah`     |
| Port     | `5432`            |

To change them, create a `.env` file in this folder (for example `POSTGRES_PASSWORD=secret` or `POSTGRES_PORT=5433`) and update `DATABASE_URL` in `.env.local` to match.
The data sits in the Docker volume `sinarberkah_pgdata`, so it survives `npm run db:down`.

For production, use a managed PostgreSQL service such as [Neon](https://neon.tech) through the Vercel Marketplace (Storage, then Create, then Postgres), Supabase, or Railway. Use the pooled connection string (on Neon, the host contains `-pooler`) and put it in `DATABASE_URL`.

### 3. Set up Vercel Blob (photo storage)

1. In the [Vercel dashboard](https://vercel.com/dashboard), open Storage, then Create, then Blob.
2. Copy `BLOB_READ_WRITE_TOKEN` from the `.env.local` tab.

Without the token, photo upload does not work. The API only accepts photo URLs hosted on Vercel Blob, so use a Blob store for local development too (a separate development store keeps test photos out of production).

### 4. Fill in `.env.local`

```bash
copy .env.example .env.local      # Windows
# cp .env.example .env.local      # macOS / Linux
```

| Variable                | Value                                                                                                |
| ----------------------- | ---------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`          | PostgreSQL connection string (the default matches Docker Compose)                                    |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token                                                                                    |
| `AUTH_SECRET`           | Random text, at least 32 characters                                                                  |
| `SESSION_VERSION`       | Session version (default `1`). Change it to sign out every admin session at once                    |
| `ADMIN_EMAIL`           | The admin email. It must include a domain, for example `admin@sinarberkah.com`                       |
| `ADMIN_PASSWORD_HASH`   | Hash of the admin password (see below)                                                               |
| `ALLOWED_ORIGINS`       | Frontend addresses allowed to read the API from a browser, separated by commas                       |
| `FRONTEND_URL`          | Frontend address. The backend calls its `/api/revalidate` after every save or delete                 |
| `REVALIDATE_SECRET`     | Shared secret for that call. Use the same value in the frontend. Leave empty to turn the feature off |
| `CRON_SECRET`           | Secret for the daily photo cleanup cron. Vercel sends it automatically. Leave empty to turn it off   |

Generate `AUTH_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Generate `ADMIN_PASSWORD_HASH` (the password needs at least 6 characters):

```bash
npm run hash-password -- "your-password"
```

Copy the printed `ADMIN_PASSWORD_HASH=...` line into `.env.local`. Write values without quotes.

### 5. Create the tables

```bash
npm run db:migrate
```

### 6. Run it

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with `ADMIN_EMAIL` and your password.

The frontend (`sinarberkah-plato`) also uses port 3000. Run one of them on another port, for example `npm run dev -- -p 4000`.

## Commands

| Command                             | What it does                                                |
| ----------------------------------- | ----------------------------------------------------------- |
| `npm run dev`                       | Starts the development server                               |
| `npm run build` / `npm run start`   | Builds and runs the production server                       |
| `npm run lint`                      | Checks the code                                             |
| `npm run typecheck`                 | Checks TypeScript types                                     |
| `npm test`                          | Runs the tests (Vitest, needs Node 22.12+)                  |
| `npm run hash-password -- "..."`    | Creates the admin password hash                             |
| `npm run db:up` / `npm run db:down` | Starts or stops the local PostgreSQL (Docker)               |
| `npm run db:migrate`                | Applies migrations to the database                          |
| `npm run db:generate`               | Creates a new migration after you change `src/db/schema.ts` |
| `npm run db:studio`                 | Opens Drizzle Studio to browse the tables                   |

## API

Every response has the shape `{ "data": ... }`. Lists also include `meta` (`total`, `page`, `limit`, `totalPages`). Errors look like `{ "error": { "message": "...", "details": { "fieldErrors": {...} } } }`.

| Method                   | Path                                  | Purpose                                                         | Access |
| ------------------------ | ------------------------------------- | --------------------------------------------------------------- | ------ |
| GET                      | `/api/products/v1`                    | List active products                                            | Public |
| GET                      | `/api/products/v1/{id}`               | Get one product                                                 | Public |
| POST                     | `/api/products/v1`                    | Add a product                                                   | Admin  |
| PUT / PATCH              | `/api/products/v1/{id}`               | Update a product (only the fields you send)                     | Admin  |
| DELETE                   | `/api/products/v1/{id}`               | Delete a product and its photo                                  | Admin  |
| GET                      | `/api/gallery/v1/portfolio`           | List portfolio projects                                         | Public |
| POST, PUT, PATCH, DELETE | `/api/gallery/v1/portfolio[/{id}]`    | Manage portfolio projects                                       | Admin  |
| GET                      | `/api/gallery/v1`                     | List patterns                                                   | Public |
| POST, PUT, PATCH, DELETE | `/api/gallery/v1[/{id}]`              | Manage patterns                                                 | Admin  |
| POST                     | `/api/upload`                         | Upload a photo (`multipart/form-data` with `file` and `folder`) | Admin  |
| POST                     | `/api/auth/login`, `/api/auth/logout` | Sign in and out                                                 | None   |
| GET                      | `/api/health`                         | Check that the server is up                                     | Public |
| GET                      | `/api/cron/cleanup-blobs`             | Delete unused photos older than 24 hours (Vercel Cron, daily)   | Cron   |

List parameters: `?page=1&limit=50&q=keyword`. The maximum `limit` is 100.

The frontend already calls `/api/gallery/v1` and `/api/gallery/v1/portfolio`, so it works with this backend without changes.

### Data shapes

Product:

```json
{
  "_id": "0b6c1c0e-5c0a-4a53-9d6e-2f4f6f0a1b2c",
  "name": "Leaf Pattern Gate",
  "category": "Gate",
  "description": "",
  "price": 1500000,
  "image": { "image_url": "https://....public.blob.vercel-storage.com/..." },
  "isActive": true,
  "createdAt": "2026-10-28T09:00:00.000Z",
  "updatedAt": "2026-10-28T09:00:00.000Z"
}
```

Portfolio project and pattern:

```json
{
  "_id": "0b6c1c0e-5c0a-4a53-9d6e-2f4f6f0a1b2c",
  "kind": "portfolio",
  "title": "Balcony fence with leaf pattern",
  "type": "Fence",
  "description": "",
  "image": { "image_url": "https://..." }
}
```

When you send data with POST or PUT, pass the photo as `image_url`. It must be a Vercel Blob URL (`https://<store>.public.blob.vercel-storage.com/...`), normally the one `/api/upload` returns:

```json
{
  "title": "Pattern LC 071",
  "type": "LC 071",
  "description": "",
  "image_url": "https://..."
}
```

### Connecting the frontend

In the frontend project, set `API_BASE_URL` to this backend's address without a trailing slash, for example `API_BASE_URL=https://sinarberkah-backend.vercel.app`.
The frontend reads data on the server and caches it for one hour. When `FRONTEND_URL` and `REVALIDATE_SECRET` are set, the backend tells the frontend to clear its cache after every save or delete, so changes show up right away. Without them, changes show up within about an hour.

## Security

- Only a signed-in admin can change data. The session is an `httpOnly` cookie with `sameSite=lax` that lasts 12 hours. Changing `SESSION_VERSION` revokes every session.
- Requests that change data must come from the same host (`Origin` is checked), which blocks CSRF.
- The admin password is stored as a `scrypt` hash, never as plain text.
- Login allows 8 attempts per 10 minutes per IP. The counter lives in PostgreSQL (`rate_limits` table), so it applies across all Vercel instances. A Vercel Firewall rate-limit rule on `/api/auth/login` adds a second layer.
- Uploads are checked for type, size (4 MB maximum), and file content (JPG, PNG, WebP). Photo URLs must point to Vercel Blob.
- Photos that were uploaded but never saved (an abandoned form) are deleted by a daily cron after 24 hours.
- Every response carries security headers (CSP, HSTS, `X-Frame-Options`, `nosniff`), set in `next.config.ts`.
- There is one admin account, defined by environment variables. Never commit `.env.local`.

## Deploying to Vercel

The backend and the frontend are two separate Vercel projects. Deploy the backend first, because the frontend needs its address.
Both projects run in Singapore (`sin1`) through `vercel.json`, the closest region to Indonesia.

### 1. Push to GitHub

Create two repositories (backend and frontend) and push each one. Check that `.env.local` stays out of the commit. `.gitignore` already excludes it.

### 2. Backend

1. Import the backend repository at [vercel.com/new](https://vercel.com/new). Vercel detects Next.js on its own.
2. Add these variables before the first deploy, or right after it:

   | Variable              | Value                                                                                                       |
   | --------------------- | ----------------------------------------------------------------------------------------------------------- |
   | `AUTH_SECRET`         | Random text, at least 32 characters                                                                         |
   | `ADMIN_EMAIL`         | Admin email with a domain, for example `admin@sinarberkah.com`                                              |
   | `ADMIN_PASSWORD_HASH` | Output of `npm run hash-password -- "your-password"`                                                        |
   | `ALLOWED_ORIGINS`     | Production frontend address, for example `https://sinarberkah.vercel.app` (add it once the frontend exists) |
   | `CRON_SECRET`         | Random text, at least 16 characters. Vercel uses it to call the daily photo cleanup                         |

3. Open the Storage tab of the project and create two stores:
   - Postgres (Neon through the Marketplace). Choose the Singapore region and leave Auth off. Connecting it fills in `DATABASE_URL` and `POSTGRES_URL`. Leave the custom prefix empty.
   - Blob, with Public access. Tick the option that adds a read-write token. This fills in `BLOB_READ_WRITE_TOKEN`.
4. Redeploy.

The first deploy fails at the migration step because the database does not exist yet. That is expected. Once the stores are connected, redeploy and the build succeeds.

On a Production build, `scripts/vercel-build.mjs` runs `drizzle-kit migrate` and creates the tables.
A Preview build skips migrations, so a test deploy never changes the production database.

If you change `src/db/schema.ts`, run `npm run db:generate`, commit the `drizzle/` folder, and push. The migration runs on the next Production deploy.

### 3. Frontend

1. Import the frontend repository in Vercel.
2. Add these variables:

   | Variable               | Value                                                                                     |
   | ---------------------- | ----------------------------------------------------------------------------------------- |
   | `API_BASE_URL`         | Backend address, for example `https://sinarberkah-backend.vercel.app` (no trailing slash) |
   | `NEXT_PUBLIC_SITE_URL` | Frontend address, for example `https://sinarberkah.vercel.app`                            |

3. Deploy.

### 4. After both projects are live

1. Set `ALLOWED_ORIGINS` in the backend to the frontend address, then redeploy the backend.
2. Open `https://<backend-address>/login`, sign in, and add products, portfolio projects, and patterns.
3. Set `FRONTEND_URL` (the frontend address) and `REVALIDATE_SECRET` in the backend, and the same `REVALIDATE_SECRET` in the frontend. Then a change in the admin panel shows up right away. Without them, the frontend caches data for one hour.

### Troubleshooting

- The login page shows "Terjadi kesalahan" (something went wrong): an environment variable is missing or invalid. Open the Logs tab in Vercel and look for a line starting with `ConfigError`. It names the variable.
- Vercel refuses to connect Neon because `DATABASE_URL` already exists: delete the old `DATABASE_URL` under Settings, Environment Variables, then connect again.
- Vercel refuses to create the Blob store because `BLOB_READ_WRITE_TOKEN` already exists: check the Storage tab. If a Blob store is already connected, you are done. If not, delete the variable and create the store again.
- Do not set a custom prefix to get around either error. It renames the variables, and the backend reads the default names.

### Using the terminal (optional)

```bash
npm i -g vercel
vercel login
vercel link          # link this folder to a Vercel project
vercel env pull .env.local   # copy the variables from Vercel to your computer
vercel --prod        # deploy to production
```

`vercel env pull` overwrites `.env.local`. After that, `DATABASE_URL` points to the Vercel database, so be careful when developing.

## Project layout

```
src/
  app/
    admin/        Admin panel (dashboard, products, portfolio, pattern gallery)
    login/        Sign-in page
    api/          API endpoints
  components/
    admin/        Forms, lists, admin shell
    ui/           Buttons, inputs, messages
  db/             Table schema (Drizzle)
  lib/            crud.ts (shared CRUD handlers), repositories.ts (database access), auth.ts, db.ts, blob.ts, validation.ts
```
