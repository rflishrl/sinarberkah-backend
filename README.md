# Sinar Berkah backend

Backend and admin panel for the Sinar Berkah website. You use it to manage products, portfolio projects, and the pattern gallery. Text data lives in Supabase (PostgreSQL) and photos live in Vercel Blob.

- Stack: Next.js 16 (App Router), TypeScript, Tailwind CSS 4, shadcn/ui, Supabase, TanStack Query 5, Zod, React Hook Form, Vercel Blob
- Admin panel: `/admin` (sign in at `/login`)
- API: `/api/...` (anyone can read, only the admin can write)

## How the code is organized

A request goes down through these layers. Each layer only calls the one below it.

```
Browser (client component, hooks)
  -> fetch("/api/...")                     relative path only, never Supabase
Route handler   src/app/api/**/route.ts    thin, wrapped in withApi()
  -> service.ts                            business rules and authorization
  -> repository.ts                         the only place that queries Supabase
  -> Supabase                              RLS decides what each caller can see
```

- `withApi()` (`src/lib/api/with-api.ts`) handles the session, the same-origin check, rate limiting, errors, and the response shape.
- Services check that the caller is an admin. RLS in the database checks it again.
- The server client uses the publishable key and the user's cookie, so RLS applies. The secret key is only used in `src/lib/supabase/admin.ts`, for rate limiting, the photo cleanup cron, and the `create-admin` script.
- Pages load their first data on the server (the service is called directly) and pass it to TanStack Query through `HydrationBoundary`. The client then reuses the same cache after every save or delete.
- Forms use shadcn `Field` with React Hook Form. The Zod schema in `features/<name>/schemas.ts` is shared by the form and the route.
- `npm run check:boundaries` fails if a client file imports Supabase or server code, if anything uses `NEXT_PUBLIC_`, or if a route skips `withApi()`.

## Getting started

### 1. Install packages

```bash
npm install
```

### 2. Create the Supabase project

1. Create a project at [supabase.com](https://supabase.com). Pick the Singapore region, the same as Vercel (`sin1`).
2. Turn off public sign-ups: Authentication, Sign In / Providers, switch off "Allow new users to sign up". Without this, anyone can create an account.
3. Copy the project URL and the publishable key from the Connect button. Copy the secret key from Settings, API Keys.
4. For local commands, copy the session pooler address from Connect, Direct.

### 3. Set up Vercel Blob (photo storage)

1. In the [Vercel dashboard](https://vercel.com/dashboard), open Storage, then Create, then Blob.
2. Copy `BLOB_READ_WRITE_TOKEN` from the `.env.local` tab.

Without the token, photo upload does not work. The API only accepts photo URLs hosted on Vercel Blob, so use a Blob store for local development too. A separate development store keeps test photos out of production.

### 4. Fill in `.env.local`

```bash
copy .env.example .env.local      # Windows
# cp .env.example .env.local      # macOS / Linux
```

| Variable                   | Value                                                                                                |
| -------------------------- | ---------------------------------------------------------------------------------------------------- |
| `SUPABASE_URL`             | Project URL                                                                                          |
| `SUPABASE_PUBLISHABLE_KEY` | Publishable key (`sb_publishable_...`)                                                               |
| `SUPABASE_SECRET_KEY`      | Secret key (`sb_secret_...`). It bypasses RLS. Keep it on the server                                 |
| `SUPABASE_DB_URL`          | Session pooler address, only for `npm run db:push` and `db:types`. Not needed on Vercel              |
| `BLOB_READ_WRITE_TOKEN`    | Vercel Blob token                                                                                    |
| `ALLOWED_ORIGINS`          | Frontend addresses allowed to read the API from a browser, separated by commas                       |
| `FRONTEND_URL`             | Frontend address. The backend calls its `/api/revalidate` after every save or delete                 |
| `REVALIDATE_SECRET`        | Shared secret for that call. Use the same value in the frontend. Leave empty to turn the feature off |
| `CRON_SECRET`              | Secret for the daily photo cleanup cron. Vercel sends it automatically. Leave empty to turn it off   |

Generate a secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Set these variables by hand. The Vercel and Supabase integration uses other names and the older anon and service role keys, and this project does not read those.

### 5. Create the tables

```bash
npm run db:push
npm run db:types
```

`db:push` applies the files in `supabase/migrations`. `db:types` rewrites `src/types/database.ts` from the live schema. Run it again after every migration.

### 6. Create the admin account

```bash
npm run create-admin -- admin@sinarberkah.com
```

The script asks for the password. It is not shown on screen and not saved in your shell history. Run it again with the same email to reset the password.

An admin is a user with `app_metadata.role = "admin"`. Only the secret key can set it, so a user cannot make themselves an admin.

### 7. Run it

```bash
npm run dev -- -p 4000
```

Open [http://localhost:4000/login](http://localhost:4000/login). The frontend (`sinarberkah-plato`) uses port 3000, so run the backend on another port.

## Commands

| Command                           | What it does                                                     |
| --------------------------------- | ---------------------------------------------------------------- |
| `npm run dev`                     | Starts the development server                                    |
| `npm run build` / `npm run start` | Builds and runs the production server                            |
| `npm run lint`                    | Checks the code                                                  |
| `npm run typecheck`               | Checks TypeScript types                                          |
| `npm test`                        | Runs the tests (Vitest, needs Node 22.12+)                       |
| `npm run check:boundaries`        | Checks the layer rules described above                           |
| `npm run db:push`                 | Applies new files from `supabase/migrations` to the database     |
| `npm run db:types`                | Regenerates `src/types/database.ts`                              |
| `npm run create-admin -- <email>` | Creates or updates the admin account                             |
| `npm run db:copy-from-neon`       | One-time copy of products and gallery from the old Neon database |

To change the schema, add a new SQL file in `supabase/migrations` (never edit one that was already applied), then run `db:push` and `db:types`.

## API

Every response has one of these shapes:

```json
{ "success": true, "data": {} }
{ "success": false, "error": "Message you can show to a user" }
```

Lists return `data: { items: [...], pagination: { total, page, limit, totalPages } }`. Status codes are 400, 401, 403, 404, 409, 422, 429, and 500. Raw database errors are never sent to the caller. They are logged with a request id, and the same id is returned in the `x-request-id` header.

| Method             | Path                                  | Purpose                                                         | Access |
| ------------------ | ------------------------------------- | --------------------------------------------------------------- | ------ |
| GET                | `/api/products/v1[/{id}]`             | List active products, or get one                                | Public |
| GET                | `/api/gallery/v1/portfolio[/{id}]`    | List portfolio projects, or get one                             | Public |
| GET                | `/api/gallery/v1[/{id}]`              | List patterns, or get one                                       | Public |
| GET                | `/api/article/v1`                     | Articles (empty for now)                                        | Public |
| GET, POST          | `/api/admin/products`                 | List all products (also hidden ones), add a product             | Admin  |
| GET, PATCH, DELETE | `/api/admin/products/{id}`            | Get, update (only the fields you send), or delete a product     | Admin  |
| GET, POST          | `/api/admin/portfolio`                | List and add portfolio projects                                 | Admin  |
| GET, PATCH, DELETE | `/api/admin/portfolio/{id}`           | Manage one portfolio project                                    | Admin  |
| GET, POST          | `/api/admin/patterns`                 | List and add patterns                                           | Admin  |
| GET, PATCH, DELETE | `/api/admin/patterns/{id}`            | Manage one pattern                                              | Admin  |
| POST               | `/api/upload`                         | Upload a photo (`multipart/form-data` with `file` and `folder`) | Admin  |
| POST               | `/api/auth/login`, `/api/auth/logout` | Sign in and out (same-origin requests only)                     | None   |
| GET                | `/api/health`                         | Check that the server and the database are up (503 if not)      | Public |
| GET                | `/api/cron/cleanup-blobs`             | Delete unused photos older than 24 hours (Vercel Cron, daily)   | Cron   |

List parameters: `?page=1&limit=50&q=keyword`. The maximum `limit` is 100. Invalid values fall back to the defaults.

No API response is cached by the CDN (`Cache-Control: private, no-store`). The frontend keeps its own cache and clears it by tag after every save or delete. A CDN cache in the backend would hand the frontend the old list right after a delete, and the deleted item would come back for up to an hour.

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

When you send data with POST or PATCH, pass the photo as `image_url`. It must be a Vercel Blob URL (`https://<store>.public.blob.vercel-storage.com/...`), normally the one `/api/upload` returns:

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

- **Database access.** RLS is on for every table. Anyone can read active products and the gallery. Only an admin can write. The rate limit table lives in the `private` schema, which the API does not expose.
- **Sessions.** Supabase Auth keeps the session in cookies set by `@supabase/ssr`. The cookies are `httpOnly`, `secure` (in production), `SameSite=Lax`, and last 7 days. The proxy renews them while the admin stays active. The access token lasts 1 hour and `src/proxy.ts` refreshes it. Settings live in `src/lib/supabase/cookie-options.ts`. Routes and the admin layout verify the user with `getUser()`, which asks the Auth server, not with the cookie alone.
- **Same origin.** Requests that change data, plus login and logout, must come from the same host (`Origin` is checked). This blocks CSRF.
- **Rate limits.** Login allows 8 attempts per 10 minutes per IP. Public reads allow 120 per minute per IP. The counters live in Postgres, so they apply across all Vercel instances.
- **Uploads.** Type, size (4 MB maximum), and file content are checked (JPG, PNG, WebP). Photo URLs must point to Vercel Blob.
- **Orphan photos.** Photos that were uploaded but never saved are deleted by a daily cron after 24 hours.
- **Headers.** Every response carries security headers (CSP, HSTS, `X-Frame-Options`, `nosniff`), set in `next.config.ts`.
- **Secrets.** Nothing uses a `NEXT_PUBLIC_` variable. Never commit `.env.local`.

## Deploying to Vercel

The backend and the frontend are two separate Vercel projects. Deploy the backend first, because the frontend needs its address.
Both projects run in Singapore (`sin1`) through `vercel.json`.

### 1. Prepare the database

Vercel does not run migrations. Run them from your computer before you deploy:

```bash
npm run db:push
```

### 2. Backend

1. Import the backend repository at [vercel.com/new](https://vercel.com/new). Vercel detects Next.js on its own.
2. Add these variables:

   | Variable                   | Value                                                                                                       |
   | -------------------------- | ----------------------------------------------------------------------------------------------------------- |
   | `SUPABASE_URL`             | Project URL                                                                                                 |
   | `SUPABASE_PUBLISHABLE_KEY` | Publishable key                                                                                             |
   | `SUPABASE_SECRET_KEY`      | Secret key. Mark it as Sensitive                                                                            |
   | `ALLOWED_ORIGINS`          | Production frontend address, for example `https://sinarberkah.vercel.app` (add it once the frontend exists) |
   | `CRON_SECRET`              | Random text, at least 16 characters. Vercel uses it to call the daily photo cleanup                         |

3. Open the Storage tab, create a Blob store with Public access, and tick the option that adds a read-write token. This fills in `BLOB_READ_WRITE_TOKEN`.
4. Deploy.

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
2. Open `https://<backend-address>/login` and sign in with the account from `create-admin`.
3. Set `FRONTEND_URL` (the frontend address) and `REVALIDATE_SECRET` in the backend, and the same `REVALIDATE_SECRET` in the frontend. Then a change in the admin panel shows up right away.

### Troubleshooting

- The page shows "Terjadi kesalahan" (something went wrong): an environment variable is missing or invalid. Open the Logs tab in Vercel and look for a line with `Incomplete environment`. It names the variable.
- Login always fails with "Email atau password salah": run `npm run create-admin -- <email>` again. Check that the user exists under Authentication, Users in Supabase.
- Login says "Akun ini tidak punya akses admin": the user exists but has no admin role. Run `create-admin` with that email to add it.
- Every admin request returns 401 on Vercel: `SUPABASE_URL` and the keys must belong to the same project.
- `db:push` cannot connect: use the session pooler address (IPv4). The direct address needs IPv6.

## Project layout

```
supabase/migrations/   SQL schema, RLS policies, and database functions
src/
  proxy.ts             Refreshes the Supabase session (Next.js 16 proxy)
  app/
    admin/             Admin pages (thin; they use features/*/components)
    login/             Sign-in page
    api/               Route handlers (thin, wrapped in withApi)
  features/<name>/     schemas.ts, repository.ts, service.ts, queries.ts, hooks.ts, components/
                       (auth, gallery, products, uploads, dashboard, health, articles)
  components/
    ui/                shadcn/ui components (generated, do not edit)
    admin-kit/         Shared admin parts built on top of ui/
    providers/         TanStack Query provider
  lib/
    api/               withApi, errors, response types, client, rate limit
    auth/              Actor, admin check, session helper
    supabase/          Server, admin, and proxy clients, error mapping
    schemas/           Zod parts shared by features
    storage/           Vercel Blob helpers
  types/database.ts    Generated by `npm run db:types`
```
