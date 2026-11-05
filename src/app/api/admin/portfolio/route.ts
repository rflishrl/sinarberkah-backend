import { createGallery, listGallery } from "@/features/gallery/service";
import { parseQuery, readJson } from "@/lib/api/request";
import { withApi } from "@/lib/api/with-api";
import { listQuerySchema } from "@/lib/schemas/common";

export const maxDuration = 10;

/** Admin: list portfolio projects (10 per page). */
export const GET = withApi(
  { access: "admin" },
  async ({ request, actor }) => ({
    data: await listGallery(
      { audience: "admin", actor },
      "portfolio",
      parseQuery(request, listQuerySchema(10)),
    ),
  }),
);

/** Admin: create portfolio project. */
export const POST = withApi(
  { access: "admin" },
  async ({ request, actor }) => ({
    data: await createGallery(
      actor,
      "portfolio",
      await readJson(request),
    ),
    status: 201,
  }),
);
