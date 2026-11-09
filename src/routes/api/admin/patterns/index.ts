import { createFileRoute } from "@tanstack/react-router";

import { createGallery, listGallery } from "@/features/gallery/service";
import { parseQuery, readJson } from "@/lib/api/request";
import { withApi } from "@/lib/api/with-api";
import { listQuerySchema } from "@/lib/schemas/common";

const handleGet = withApi({ access: "admin" }, async ({ request, actor }) => ({
  data: await listGallery(
    { audience: "admin", actor },
    "pattern",
    parseQuery(request, listQuerySchema(10)),
  ),
}));

const handlePost = withApi({ access: "admin" }, async ({ request, actor }) => ({
  data: await createGallery(actor, "pattern", await readJson(request)),
  status: 201,
}));

export const Route = createFileRoute("/api/admin/patterns/")({
  server: {
    handlers: {
      GET: handleGet,
      POST: handlePost,
    },
  },
});

export { handleGet as GET, handlePost as POST };
