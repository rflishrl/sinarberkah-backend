import { createFileRoute } from "@tanstack/react-router";

import { checkRevalidate } from "@/features/revalidate/service";
import { withApi } from "@/lib/api/with-api";

const handlePost = withApi({ access: "admin" }, async ({ actor }) => ({
  data: await checkRevalidate(actor),
}));

export const Route = createFileRoute("/api/admin/revalidate/test")({
  server: {
    handlers: {
      POST: handlePost,
    },
  },
});

export { handlePost as POST };
