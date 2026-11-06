import { RATE_LIMITS } from "@/lib/api/rate-limits";
import { withApi } from "@/lib/api/with-api";

export const maxDuration = 10;

// Retained for frontend compatibility; returns empty list until article feature is enabled.
export const GET = withApi(
  { access: "public", rateLimit: RATE_LIMITS.publicRead },
  async () => ({
    data: {
      items: [],
      pagination: { total: 0, page: 1, limit: 10, totalPages: 0 },
    },
  }),
);
