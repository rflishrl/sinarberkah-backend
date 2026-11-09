import "@/lib/server-only";

import {
  deleteProduct,
  findProduct,
  insertProduct,
  listProducts,
  updateProduct,
} from "@/features/products/repository";
import {
  type ProductDto,
  productCreateSchema,
  productUpdateSchema,
} from "@/features/products/schemas";
import { notFound } from "@/lib/api/errors";
import { type Paginated, paginate } from "@/lib/api/types";
import type { Actor } from "@/lib/auth/actor";
import { assertAdmin } from "@/lib/auth/authorize";
import { isUuid } from "@/lib/ids";
import { revalidateFrontend } from "@/lib/revalidate";
import { listQuerySchema } from "@/lib/schemas/common";
import { deleteImage } from "@/lib/storage/blob";

const LABEL = "Produk";
const REVALIDATE_TAGS = ["products"];

type Viewer =
  | { audience: "public" }
  | { audience: "admin"; actor: Actor | null };

/** Public: active products only, 50/page. Admin: all products, 10/page. */
export async function listProductsFor(
  viewer: Viewer,
  rawQuery: unknown,
): Promise<Paginated<ProductDto>> {
  const isAdmin = viewer.audience === "admin";
  if (isAdmin) assertAdmin(viewer.actor);

  const { q, page, limit } = listQuerySchema(isAdmin ? 10 : 50).parse(rawQuery);
  const { items, total } = await listProducts({
    q,
    limit,
    offset: (page - 1) * limit,
    activeOnly: !isAdmin,
  });
  return paginate(items, total, page, limit);
}

export async function getProduct(
  viewer: Viewer,
  id: string,
): Promise<ProductDto> {
  const isAdmin = viewer.audience === "admin";
  if (isAdmin) assertAdmin(viewer.actor);

  const product = isUuid(id)
    ? await findProduct(id, { activeOnly: !isAdmin })
    : null;
  if (!product) throw notFound(LABEL);
  return product;
}

export async function createProduct(
  actor: Actor | null,
  rawInput: unknown,
): Promise<ProductDto> {
  assertAdmin(actor);
  const input = productCreateSchema.parse(rawInput);
  const created = await insertProduct(input);
  revalidateFrontend(REVALIDATE_TAGS);
  return created;
}

export async function updateProductById(
  actor: Actor | null,
  id: string,
  rawInput: unknown,
): Promise<ProductDto> {
  assertAdmin(actor);
  const input = productUpdateSchema.parse(rawInput);
  if (!isUuid(id)) throw notFound(LABEL);

  if (Object.keys(input).length === 0) {
    return getProduct({ audience: "admin", actor }, id);
  }

  const result = await updateProduct(id, input);
  if (!result) throw notFound(LABEL);

  if (result.previousImageUrl !== result.item.image.image_url) {
    await deleteImage(result.previousImageUrl);
  }
  revalidateFrontend(REVALIDATE_TAGS);
  return result.item;
}

export async function deleteProductById(
  actor: Actor | null,
  id: string,
): Promise<ProductDto> {
  assertAdmin(actor);
  if (!isUuid(id)) throw notFound(LABEL);

  const deleted = await deleteProduct(id);
  if (!deleted) throw notFound(LABEL);

  await deleteImage(deleted.image.image_url);
  revalidateFrontend(REVALIDATE_TAGS);
  return deleted;
}
