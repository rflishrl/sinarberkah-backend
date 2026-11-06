# Sinar Berkah backend

Backend and admin panel for the Sinar Berkah website. You use it to manage products, portfolio projects, and the pattern gallery. Text data lives in Neon PostgreSQL and photos live in Vercel Blob.

- Stack: Next.js 16 (App Router), TypeScript, Tailwind CSS 4, shadcn/ui, Neon PostgreSQL (`@neondatabase/serverless`), self-contained scrypt + HMAC session auth, TanStack Query 5, Zod, React Hook Form, Vercel Blob
- Admin panel: `/admin` (sign in at `/login`)
- API: `/api/...` (public read, authenticated admin write)

## How the code is organized

A request moves down through these layers. Each layer only calls the one below it.

```
Browser (client component, hooks)
  -> fetch("/api/...")                     relative path only
Route handler   src/app/api/**/route.ts    thin, wrapped in withApi()
  -> service.ts                            business rules and authorization
  -> repository.ts                         the only place that queries Neon PostgreSQL
  -> Neon PostgreSQL                       HTTPS serverless driver (@neondatabase/serverless)
```

- `withApi()` (`src/lib/api/with-api.ts`) handles session verification, origin validation, rate limiting, error responses, and standard JSON envelope.
- Services verify that the caller is an authenticated admin before executing any mutation.
- Passwords are encrypted with Node.js native `crypto.scrypt` with unique per-user salts.
- Admin sessions use tamper-proof HMAC-SHA256 tokens stored in `httpOnly`, `sameSite=lax`, `secure` cookies.
- Pages load initial data on the server and pass it to TanStack Query through `HydrationBoundary`. The client reuses this cache after saves and deletions.
- Forms use shadcn `Field` with React Hook Form. The Zod schema in `features/<name>/schemas.ts` is shared between forms and routes.
- `npm run check:boundaries` enforces layer boundaries and stops server code leaks into client components.

## Getting started

### 1. Install packages

```bash
npm install
# or
bun install
```

### 2. Set up Neon PostgreSQL

1. Create a project at [neon.tech](https://neon.tech).
2. Copy your PostgreSQL connection string (`DATABASE_URI`).

### 3. Set up Vercel Blob (photo storage)

1. In the [Vercel dashboard](https://vercel.com/dashboard), open Storage, then Create, then Blob.
2. Copy `BLOB_READ_WRITE_TOKEN`.

### 4. Fill in `.env.local`

```bash
copy .env.example .env.local      # Windows
# cp .env.example .env.local      # macOS / Linux
```

| Variable                | Value                                                                                  |
| ----------------------- | -------------------------------------------------------------------------------------- |
| `DATABASE_URI`          | Neon PostgreSQL connection string (`postgresql://...`). Can also use `DATABASE_URL`.   |
| `SESSION_SECRET`        | 64+ character random secret string used to sign HMAC-SHA256 session cookies.           |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token. Photo uploads stay disabled without it.                             |
| `ALLOWED_ORIGINS`       | Frontend addresses allowed to read the API from a browser (CORS), separated by commas. |
| `FRONTEND_URL`          | Frontend address. The backend calls its `/api/revalidate` after saves or deletes.      |
| `REVALIDATE_SECRET`     | Shared secret for cache revalidation. Use the same value in the frontend.              |
| `CRON_SECRET`           | Secret for the daily photo cleanup cron. Vercel sends it automatically.                |

Generate a random session secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 5. Create the tables

```bash
npm run db:push
```

`db:push` applies the SQL schema in `scripts/schema.sql` directly to your Neon database.

### 6. Create the admin account

```bash
npm run create-admin -- admin@sinarberkah.com
```

The script prompts for the password in the terminal. Password characters are hidden from the screen and shell history. Run it again with the same email to update the password.

### 7. Run locally

```bash
npm run dev -- -p 4000
```

Open http://localhost:4000/login to access the admin panel.

## Scripts

| Command                    | Purpose                        |
| -------------------------- | ------------------------------ |
| `npm run dev`              | Dev server                     |
| `npm run build`            | Production build               |
| `npm run typecheck`        | TypeScript check               |
| `npm run lint`             | ESLint                         |
| `npm run test`             | Run Vitest test suite          |
| `npm run check:boundaries` | Check architectural boundaries |
| `npm run db:push`          | Push schema to Neon database   |
| `npm run create-admin`     | Create or update admin user    |
