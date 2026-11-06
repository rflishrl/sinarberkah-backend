# Sinar Berkah Backend

API service and administrative panel for the Sinar Berkah website. Administrators manage products, portfolio projects, and the pattern gallery here, while the public frontend consumes them via the REST API.

Built with Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, shadcn/ui, TanStack Query 5, react-hook-form with Zod, Neon PostgreSQL (`@neondatabase/serverless`), self-contained scrypt password hashing and HMAC-SHA256 session auth, Vercel Blob for media storage, and Vitest.

## System Architecture

```
Browser -> Frontend (sinarberkah-plato) -> Backend API -> Neon PostgreSQL
                                                 Photos: Vercel Blob
```

The codebase follows a strict layered pattern:

- **Route handlers** (`src/app/api/**/route.ts`): Thin entry points wrapped with `withApi()`.
- **Services** (`src/features/**/service.ts`): Business logic, validation rules, and authorization verification.
- **Repositories** (`src/features/**/repository.ts`): The only layer permitted to query Neon PostgreSQL.

Layer boundaries are enforced by `npm run check:boundaries`. Client-side components cannot import server-only modules or make external fetch calls.

## Getting Started

### 1. Prerequisites

- Node.js >= 24 (or Bun >= 1.4)
- A Neon PostgreSQL database project ([neon.tech](https://neon.tech))
- A Vercel Blob storage store (optional for local dev, required for photo uploads)

### 2. Environment Setup

Copy `.env.example` to `.env.local`:

```bash
# Windows
copy .env.example .env.local

# macOS / Linux
cp .env.example .env.local
```

Fill in `.env.local` with your configuration:

| Variable                | Description                                                                                                     |
| ----------------------- | --------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URI`          | Neon PostgreSQL connection string (`postgresql://...`). Supports `DATABASE_URL` or `POSTGRES_URL` as fallbacks. |
| `SESSION_SECRET`        | 64+ character random secret string used to sign HMAC-SHA256 session cookies.                                    |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token for photo uploads. Automatically provided in Vercel deployments.                              |
| `ALLOWED_ORIGINS`       | Comma-separated list of allowed frontend origins for CORS.                                                      |
| `FRONTEND_URL`          | Public frontend URL. The backend triggers on-demand revalidation here on content updates.                       |
| `REVALIDATE_SECRET`     | Shared secret token for frontend cache revalidation.                                                            |
| `CRON_SECRET`           | Secret token used by Vercel Cron to trigger daily orphaned blob cleanup.                                        |

Generate a secure random session secret with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Install Dependencies

```bash
npm install
# or
bun install
```

### 4. Push Database Schema

Apply `scripts/schema.sql` to your Neon PostgreSQL database:

```bash
npm run db:push
```

### 5. Create Admin Account

Register your admin credentials in Neon PostgreSQL:

```bash
npm run create-admin -- admin@sinarberkah.com
```

You will be prompted to enter and confirm your password (minimum 8 characters).

### 6. Start Development Server

```bash
npm run dev
```

Access the admin panel at `http://localhost:3000/login` (or on port 4000 if running with `-p 4000`).

## API Endpoints

All API responses follow a uniform JSON envelope: `{ "success": true, "data": ... }` or `{ "success": false, "error": "..." }`. Paginated listing endpoints return `data: { items, pagination }`.

| Method             | Path                             | Access | Description                                         |
| ------------------ | -------------------------------- | ------ | --------------------------------------------------- |
| GET                | `/api/products/v1`               | Public | List active products (`?q=&page=&limit=`)           |
| GET                | `/api/products/v1/{id}`          | Public | Retrieve a single product by ID                     |
| GET                | `/api/gallery/v1`                | Public | List all gallery items (`?kind=portfolio\|pattern`) |
| GET                | `/api/gallery/v1/portfolio`      | Public | List portfolio project items                        |
| GET                | `/api/gallery/v1/portfolio/{id}` | Public | Retrieve a single portfolio item                    |
| GET, POST          | `/api/admin/products`            | Admin  | List all products or create a new product           |
| GET, PATCH, DELETE | `/api/admin/products/{id}`       | Admin  | Retrieve, update, or delete a product               |
| GET, POST          | `/api/admin/portfolio`           | Admin  | List all portfolio items or create a new item       |
| GET, PATCH, DELETE | `/api/admin/portfolio/{id}`      | Admin  | Retrieve, update, or delete a portfolio item        |
| GET, POST          | `/api/admin/patterns`            | Admin  | List all pattern items or create a new item         |
| GET, PATCH, DELETE | `/api/admin/patterns/{id}`       | Admin  | Retrieve, update, or delete a pattern item          |
| POST               | `/api/upload`                    | Admin  | Upload an image (JPG, PNG, or WebP, up to 4 MB)     |
| GET                | `/api/health`                    | Public | Service health and database connectivity check      |

## Security

- Database access uses `@neondatabase/serverless` over HTTPS with prepared SQL queries.
- Passwords are encrypted using native Node.js `crypto.scrypt` with unique 16-byte random salts.
- Admin sessions use HMAC-SHA256 tokens stored in `httpOnly`, `sameSite=lax`, `secure` cookies valid for 7 days.
- Uploads are validated against binary magic bytes to prevent MIME-type spoofing.
- Login endpoints enforce database-backed IP rate limiting (8 attempts per 10-minute window).
- State-changing write requests enforce strict same-origin checks to defend against CSRF attacks.

## Deployment to Vercel

1. Import the repository into Vercel. Next.js will be detected automatically.
2. In Project Settings > Environment Variables, set `DATABASE_URI` (or connect Neon via Vercel Marketplace) and `SESSION_SECRET`.
3. In Project Settings > Storage, create or connect a Vercel Blob store (automatically sets `BLOB_READ_WRITE_TOKEN`).
4. Run `npm run db:push` once locally or in CI to ensure all tables exist in Neon.
5. Deploy the application, then verify `https://<your-deployment>.vercel.app/api/health`.

## Available Scripts

| Command                    | Description                                       |
| -------------------------- | ------------------------------------------------- |
| `npm run dev`              | Start development server                          |
| `npm run build`            | Build optimized production bundle                 |
| `npm run start`            | Start production server                           |
| `npm run typecheck`        | Run TypeScript type checks without emitting files |
| `npm run lint`             | Run ESLint checks                                 |
| `npm run test`             | Run Vitest unit and integration test suite        |
| `npm run format`           | Format code using Prettier                        |
| `npm run format:check`     | Check code formatting with Prettier               |
| `npm run check:boundaries` | Enforce clean architectural boundary rules        |
| `npm run db:push`          | Apply database schema to Neon PostgreSQL          |
| `npm run create-admin`     | Create or update an admin user account in Neon    |
