import { getProduct } from "@/features/products/service";
import { RATE_LIMITS } from "@/lib/api/rate-limits";
import { withApi } from "@/lib/api/with-api";

export const maxDuration = 10;

/** Public: single active product; hidden products return 404. */
export const GET = withApi<"public", { id: string }>(
  { access: "public", rateLimit: RATE_LIMITS.publicRead },
  async ({ params, supabase }) => ({
    data: await getProduct(supabase, { audience: "public" }, params.id),
  }),
);
