import { safeEqual } from "@/lib/auth";
import { deleteOrphanImages } from "@/lib/blob";
import { getEnv } from "@/lib/env";
import { HttpError, ok, route } from "@/lib/http";
import { getReferencedImageUrls } from "@/lib/repositories";

/** Foto yang lebih muda dari ini tidak disentuh (mungkin form-nya masih diisi). */
const MIN_ORPHAN_AGE_MS = 24 * 60 * 60 * 1000;

export const maxDuration = 60;

/**
 * Dipanggil Vercel Cron setiap hari (lihat vercel.json) untuk menghapus foto yatim di Blob.
 * Vercel mengirim `Authorization: Bearer <CRON_SECRET>`.
 */
export const GET = route(async (request: Request) => {
  const secret = getEnv().CRON_SECRET;
  if (!secret) throw new HttpError(503, "CRON_SECRET belum diisi.");

  const header = request.headers.get("authorization") ?? "";
  if (!safeEqual(header, `Bearer ${secret}`)) {
    throw new HttpError(401, "Tidak diizinkan.");
  }

  const result = await deleteOrphanImages(
    await getReferencedImageUrls(),
    new Date(Date.now() - MIN_ORPHAN_AGE_MS),
  );
  console.info(
    `[cron] Pembersihan foto: ${result.deleted} dari ${result.scanned} file dihapus.`,
  );
  return ok(result);
});
