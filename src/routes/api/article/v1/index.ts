import { createFileRoute } from "@tanstack/react-router";

import { RATE_LIMITS } from "@/lib/api/rate-limits";
import { handlePreflight, withApi } from "@/lib/api/with-api";

const handleGet = withApi(
  { access: "public", rateLimit: RATE_LIMITS.publicRead },
  async () => ({
    data: {
      items: [],
      pagination: { total: 0, page: 1, limit: 10, totalPages: 0 },
    },
  }),
);

export const Route = createFileRoute("/api/article/v1/")({
  server: {
    handlers: {
      GET: handleGet,
      OPTIONS: ({ request }) => handlePreflight(request),
    },
  },
});

export { handleGet as GET, handlePreflight as OPTIONS };
