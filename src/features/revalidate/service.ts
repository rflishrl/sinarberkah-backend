import "server-only";

import type {
  RevalidateCheck,
  RevalidateStatus,
} from "@/features/revalidate/types";
import type { Actor } from "@/lib/auth/actor";
import { assertAdmin } from "@/lib/auth/authorize";
import { readRevalidateConfig, sendRevalidate } from "@/lib/revalidate";

/** Test tag for connectivity checks. Revalidating product list is safe and idempotent. */
const TEST_TAGS = ["products"];

/** Current revalidation configuration without exposing secret tokens. */
export function getRevalidateStatus(actor: Actor | null): RevalidateStatus {
  assertAdmin(actor);
  const { baseUrl, secret } = readRevalidateConfig();
  return { frontendUrl: baseUrl ?? null, hasSecret: Boolean(secret) };
}

/**
 * Dispatches revalidation request to frontend and translates response into human-readable diagnostics.
 */
export async function checkRevalidate(
  actor: Actor | null,
): Promise<RevalidateCheck> {
  assertAdmin(actor);
  const { baseUrl } = readRevalidateConfig();
  const outcome = await sendRevalidate(TEST_TAGS);

  switch (outcome.state) {
    case "ok":
      if (outcome.revalidated.length === 0) {
        return {
          state: "error",
          message:
            "Plato menjawab 200 tapi tidak mengenali tag produk. Pastikan plato memakai versi terbaru.",
        };
      }
      return {
        state: "ok",
        message:
          "Berhasil. Plato menerima rahasia dan menyegarkan halaman produk. Penyegaran otomatis siap dipakai.",
      };

    case "not_configured":
      return {
        state: "not_configured",
        message: `Backend belum membaca: ${outcome.missing.join(" dan ")}. Isi di Vercel (project backend, lingkungan Production), lalu Redeploy dan Promote jika berlabel Staged.`,
      };

    case "rejected":
      if (outcome.status === 401) {
        return {
          state: "unauthorized",
          message:
            "Plato menolak rahasia ini. REVALIDATE_SECRET di backend berbeda dengan di plato. Samakan nilainya persis, lalu Redeploy keduanya.",
        };
      }
      if (outcome.status === 503) {
        return {
          state: "frontend_missing_secret",
          message:
            "Plato belum punya REVALIDATE_SECRET. Isi di project plato, lalu Redeploy plato.",
        };
      }
      if (outcome.status === 404 || outcome.status === 405) {
        return {
          state: "wrong_address",
          message: `Alamat ${baseUrl} menjawab HTTP ${outcome.status}. Itu bukan plato, atau alamat FRONTEND_URL salah.`,
        };
      }
      return {
        state: "error",
        message: `Plato menjawab HTTP ${outcome.status}. Cek Logs project plato.`,
      };

    case "unreachable":
      return {
        state: "unreachable",
        message: `Tidak bisa menghubungi ${baseUrl}. Periksa FRONTEND_URL. Detail: ${outcome.reason}`,
      };
  }
}
