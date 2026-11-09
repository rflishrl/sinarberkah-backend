import { createFileRoute } from "@tanstack/react-router";

import {
  deleteGallery,
  getGalleryItem,
  updateGallery,
} from "@/features/gallery/service";
import { readJson } from "@/lib/api/request";
import { withApi } from "@/lib/api/with-api";

type Params = { id: string };

const handleGet = withApi<"admin", Params>(
  { access: "admin" },
  async ({ params, actor }) => ({
    data: await getGalleryItem(
      { audience: "admin", actor },
      "pattern",
      params.id,
    ),
  }),
);

const handlePatch = withApi<"admin", Params>(
  { access: "admin" },
  async ({ request, params, actor }) => ({
    data: await updateGallery(
      actor,
      "pattern",
      params.id,
      await readJson(request),
    ),
  }),
);

const handleDelete = withApi<"admin", Params>(
  { access: "admin" },
  async ({ params, actor }) => ({
    data: await deleteGallery(actor, "pattern", params.id),
  }),
);

export const Route = createFileRoute("/api/admin/patterns/$id")({
  server: {
    handlers: {
      GET: handleGet,
      PATCH: handlePatch,
      DELETE: handleDelete,
    },
  },
});

export { handleDelete as DELETE, handleGet as GET, handlePatch as PATCH };
