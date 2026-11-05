import { listProductsFor } from "@/features/products/service";
import { RATE_LIMITS } from "@/lib/api/rate-limits";
import { parseQuery } from "@/lib/api/request";
import { withApi } from "@/lib/api/with-api";
import { listQuerySchema } from "@/lib/schemas/common";

export const maxDuration = 10;

/** Public: list of active products (?q=&page=&limit=). */
export const GET = withApi(
  { access: "public", rateLimit: RATE_LIMITS.publicRead },
  async ({ request }) => ({
    data: await listProductsFor(
      { audience: "public" },
      parseQuery(request, listQuerySchema(50)),
    ),
  }),
);
