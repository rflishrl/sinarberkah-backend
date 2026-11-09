import { createFileRoute } from "@tanstack/react-router";

import {
  deleteProductById,
  getProduct,
  updateProductById,
} from "@/features/products/service";
import { readJson } from "@/lib/api/request";
import { withApi } from "@/lib/api/with-api";

type Params = { id: string };

const handleGet = withApi<"admin", Params>(
  { access: "admin" },
  async ({ params, actor }) => ({
    data: await getProduct({ audience: "admin", actor }, params.id),
  }),
);

const handlePatch = withApi<"admin", Params>(
  { access: "admin" },
  async ({ request, params, actor }) => ({
    data: await updateProductById(actor, params.id, await readJson(request)),
  }),
);

const handleDelete = withApi<"admin", Params>(
  { access: "admin" },
  async ({ params, actor }) => ({
    data: await deleteProductById(actor, params.id),
  }),
);

export const Route = createFileRoute("/api/admin/products/$id")({
  server: {
    handlers: {
      GET: handleGet,
      PATCH: handlePatch,
      DELETE: handleDelete,
    },
  },
});

export { handleDelete as DELETE, handleGet as GET, handlePatch as PATCH };
