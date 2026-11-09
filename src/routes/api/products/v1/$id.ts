import { createFileRoute } from "@tanstack/react-router";

import { getProduct } from "@/features/products/service";
import { RATE_LIMITS } from "@/lib/api/rate-limits";
import { handlePreflight, withApi } from "@/lib/api/with-api";

const handleGet = withApi<"public", { id: string }>(
  { access: "public", rateLimit: RATE_LIMITS.publicRead },
  async ({ params }) => ({
    data: await getProduct({ audience: "public" }, params.id),
  }),
);

export const Route = createFileRoute("/api/products/v1/$id")({
  server: {
    handlers: {
      GET: handleGet,
      OPTIONS: ({ request }) => handlePreflight(request),
    },
  },
});

export { handleGet as GET, handlePreflight as OPTIONS };
