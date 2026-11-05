import {
  deleteGallery,
  getGalleryItem,
  updateGallery,
} from "@/features/gallery/service";
import { readJson } from "@/lib/api/request";
import { withApi } from "@/lib/api/with-api";

export const maxDuration = 10;

type Params = { id: string };

export const GET = withApi<"admin", Params>(
  { access: "admin" },
  async ({ params, actor }) => ({
    data: await getGalleryItem(
      { audience: "admin", actor },
      "portfolio",
      params.id,
    ),
  }),
);

export const PATCH = withApi<"admin", Params>(
  { access: "admin" },
  async ({ request, params, actor }) => ({
    data: await updateGallery(
      actor,
      "portfolio",
      params.id,
      await readJson(request),
    ),
  }),
);

export const DELETE = withApi<"admin", Params>(
  { access: "admin" },
  async ({ params, actor }) => ({
    data: await deleteGallery(actor, "portfolio", params.id),
  }),
);
