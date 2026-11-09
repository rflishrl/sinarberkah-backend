import { createFileRoute } from "@tanstack/react-router";

import { listGallery } from "@/features/gallery/service";
import { RATE_LIMITS } from "@/lib/api/rate-limits";
import { parseQuery } from "@/lib/api/request";
import { handlePreflight, withApi } from "@/lib/api/with-api";
import { listQuerySchema } from "@/lib/schemas/common";

const handleGet = withApi(
  { access: "public", rateLimit: RATE_LIMITS.publicRead },
  async ({ request }) => ({
    data: await listGallery(
      { audience: "public" },
      "pattern",
      parseQuery(request, listQuerySchema(50)),
    ),
  }),
);

export const Route = createFileRoute("/api/gallery/v1/")({
  server: {
    handlers: {
      GET: handleGet,
      OPTIONS: ({ request }) => handlePreflight(request),
    },
  },
});

export { handleGet as GET, handlePreflight as OPTIONS };
