import { createServerFn } from "@tanstack/react-start";

import { findProduct } from "@/features/products/repository";
import type { ProductDto } from "@/features/products/schemas";
import { assertAdmin } from "@/lib/auth/authorize";
import { getCurrentAdmin } from "@/lib/auth/session";

export const getProductByIdServerFn = createServerFn({ method: "GET" })
  .validator((id: string) => id)
  .handler(async ({ data: id }): Promise<ProductDto | null> => {
    const actor = await getCurrentAdmin();
    assertAdmin(actor);
    return findProduct(id, { activeOnly: false });
  });
