import { z } from "zod";

/** Dilempar saat file `.env` belum lengkap. Pesannya hanya untuk log server. */
export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

const envSchema = z.object({
  DATABASE_URL: z
    .string()
    .regex(
      /^postgres(ql)?:\/\//,
      "harus berupa URL PostgreSQL (postgres://...)",
    ),
  AUTH_SECRET: z.string().min(32, "minimal 32 karakter"),
  // Email admin: wajib berformat email lengkap dengan domain (mis. admin@sinarberkah.com).
  ADMIN_EMAIL: z.email("harus berupa alamat email dengan domain"),
  ADMIN_PASSWORD_HASH: z
    .string()
    .startsWith("scrypt.", "belum dibuat (jalankan: npm run hash-password)"),
  // Ganti nilainya (mis. "1" -> "2") untuk mengeluarkan semua sesi admin yang sedang aktif.
  SESSION_VERSION: z.string().trim().min(1).max(64).default("1"),
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
  ALLOWED_ORIGINS: z.string().optional(),
  // Diisi Vercel Cron di header Authorization. Kosong = endpoint cron mati.
  CRON_SECRET: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | undefined;

/** Membaca dan memvalidasi variabel lingkungan saat pertama dipakai (bukan saat build). */
export function getEnv(): Env {
  if (cached) return cached;

  // Integrasi Vercel Postgres / Neon mengisi `POSTGRES_URL`, jadi dipakai sebagai cadangan.
  const result = envSchema.safeParse({
    ...process.env,
    DATABASE_URL: process.env.DATABASE_URL ?? process.env.POSTGRES_URL,
  });
  if (!result.success) {
    const problems = result.error.issues
      .map((issue) => `${issue.path.join(".")} ${issue.message}`)
      .join("; ");
    throw new ConfigError(`Konfigurasi .env belum lengkap: ${problems}`);
  }

  cached = result.data;
  return cached;
}

/** Daftar origin frontend yang boleh membaca API dari browser (CORS). */
export function getAllowedOrigins(): string[] {
  return (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}
