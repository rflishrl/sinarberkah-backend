import { createProduct, listProductsFor } from "@/features/products/service";
import { parseQuery, readJson } from "@/lib/api/request";
import { withApi } from "@/lib/api/with-api";
import { listQuerySchema } from "@/lib/schemas/common";

export const maxDuration = 10;

/** Admin: all products, including hidden items (10 per page). */
export const GET = withApi({ access: "admin" }, async ({ request, actor }) => ({
  data: await listProductsFor(
    { audience: "admin", actor },
    parseQuery(request, listQuerySchema(10)),
  ),
}));

export const POST = withApi(
  { access: "admin" },
  async ({ request, actor }) => ({
    data: await createProduct(actor, await readJson(request)),
    status: 201,
  }),
);
