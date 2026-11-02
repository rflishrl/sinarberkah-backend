import { listGallery } from "@/features/gallery/service";
import { RATE_LIMITS } from "@/lib/api/rate-limits";
import { parseQuery } from "@/lib/api/request";
import { withApi } from "@/lib/api/with-api";
import { listQuerySchema } from "@/lib/schemas/common";

export const maxDuration = 10;

/** Publik: daftar galeri pola (?q=&page=&limit=). */
export const GET = withApi(
  { access: "public", publicCache: true, rateLimit: RATE_LIMITS.publicRead },
  async ({ request, supabase }) => ({
    data: await listGallery(
      supabase,
      { audience: "public" },
      "pattern",
      parseQuery(request, listQuerySchema(50)),
    ),
  }),
);
