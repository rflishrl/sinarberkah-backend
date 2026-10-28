import { eq, lt, or, sql } from "drizzle-orm";

import { rateLimits } from "@/db/schema";
import { getDb } from "@/lib/db";

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

/**
 * Pembatas laju: maksimal `limit` percobaan per `windowMs` untuk satu `key`.
 *
 * Penghitungnya ada di PostgreSQL dan diperbarui dengan satu perintah
 * `INSERT ... ON CONFLICT`, jadi aman dipanggil bersamaan dan berlaku di semua
 * instance serverless. Waktu memakai jam database (`now()`), bukan jam server.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const windowSeconds = Math.ceil(windowMs / 1000);
  const expired = sql`${rateLimits.resetAt} <= now()`;

  const [row] = await getDb()
    .insert(rateLimits)
    .values({
      key,
      count: 1,
      resetAt: sql`now() + ${windowSeconds}::int * interval '1 second'`,
    })
    .onConflictDoUpdate({
      target: rateLimits.key,
      set: {
        // Jendela waktu yang sudah lewat dimulai lagi dari 1.
        count: sql`case when ${expired} then 1 else ${rateLimits.count} + 1 end`,
        resetAt: sql`case when ${expired} then excluded.reset_at else ${rateLimits.resetAt} end`,
      },
    })
    .returning({
      count: rateLimits.count,
      retryAfterSeconds: sql<number>`greatest(0, ceil(extract(epoch from ${rateLimits.resetAt} - now())))::int`,
    });

  if (!row || row.count <= limit) {
    return { allowed: true, retryAfterSeconds: 0 };
  }
  return { allowed: false, retryAfterSeconds: row.retryAfterSeconds };
}

/**
 * Menghapus penghitung `key` (mis. setelah login berhasil), sekaligus membersihkan
 * penghitung lain yang sudah kedaluwarsa lebih dari sehari agar tabel tidak menumpuk.
 */
export async function resetRateLimit(key: string): Promise<void> {
  await getDb()
    .delete(rateLimits)
    .where(
      or(
        eq(rateLimits.key, key),
        lt(rateLimits.resetAt, sql`now() - interval '1 day'`),
      ),
    );
}
