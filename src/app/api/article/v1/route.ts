import { listArticles } from "@/features/articles/service";
import { RATE_LIMITS } from "@/lib/api/rate-limits";
import { withApi } from "@/lib/api/with-api";

export const maxDuration = 10;

// Frontend sudah memanggil alamat ini. Fitur artikel belum dibuat, jadi daftarnya kosong.
export const GET = withApi(
  { access: "public", publicCache: true, rateLimit: RATE_LIMITS.publicRead },
  async () => ({ data: await listArticles() }),
);
