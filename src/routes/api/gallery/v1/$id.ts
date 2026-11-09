import { createFileRoute } from "@tanstack/react-router";

import { getGalleryItem } from "@/features/gallery/service";
import { RATE_LIMITS } from "@/lib/api/rate-limits";
import { handlePreflight, withApi } from "@/lib/api/with-api";

const handleGet = withApi<"public", { id: string }>(
  { access: "public", rateLimit: RATE_LIMITS.publicRead },
  async ({ params }) => ({
    data: await getGalleryItem({ audience: "public" }, "pattern", params.id),
  }),
);

export const Route = createFileRoute("/api/gallery/v1/$id")({
  server: {
    handlers: {
      GET: handleGet,
      OPTIONS: ({ request }) => handlePreflight(request),
    },
  },
});

export { handleGet as GET, handlePreflight as OPTIONS };
