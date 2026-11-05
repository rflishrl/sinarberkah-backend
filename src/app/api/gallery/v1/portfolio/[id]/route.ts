import { getGalleryItem } from "@/features/gallery/service";
import { RATE_LIMITS } from "@/lib/api/rate-limits";
import { withApi } from "@/lib/api/with-api";

export const maxDuration = 10;

/** Publik: satu proyek portofolio. */
export const GET = withApi<"public", { id: string }>(
  { access: "public", rateLimit: RATE_LIMITS.publicRead },
  async ({ params }) => ({
    data: await getGalleryItem(
      { audience: "public" },
      "portfolio",
      params.id,
    ),
  }),
);
