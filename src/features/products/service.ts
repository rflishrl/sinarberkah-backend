import "server-only";

import {
  deleteProduct,
  findProduct,
  insertProduct,
  listProducts,
  updateProduct,
} from "@/features/products/repository";
import {
  productCreateSchema,
  productUpdateSchema,
  type ProductDto,
} from "@/features/products/schemas";
import { notFound } from "@/lib/api/errors";
import { paginate, type Paginated } from "@/lib/api/types";
import type { Actor } from "@/lib/auth/actor";
import { assertAdmin } from "@/lib/auth/authorize";
import { isUuid } from "@/lib/ids";
import { revalidateFrontend } from "@/lib/revalidate";
import { listQuerySchema } from "@/lib/schemas/common";
import { deleteImage } from "@/lib/storage/blob";
import type { AppSupabaseClient } from "@/lib/supabase/server";

const LABEL = "Produk";
const REVALIDATE_TAGS = ["products"];

type Viewer =
  { audience: "public" } | { audience: "admin"; actor: Actor | null };

/** Public: active products only, 50/page. Admin: all products, 10/page. */
export async function listProductsFor(
  supabase: AppSupabaseClient,
  viewer: Viewer,
  rawQuery: unknown,
): Promise<Paginated<ProductDto>> {
  const isAdmin = viewer.audience === "admin";
  if (isAdmin) assertAdmin(viewer.actor);

  const { q, page, limit } = listQuerySchema(isAdmin ? 10 : 50).parse(rawQuery);
  const { items, total } = await listProducts(supabase, {
    q,
    limit,
    offset: (page - 1) * limit,
    activeOnly: !isAdmin,
  });
  return paginate(items, total, page, limit);
}

export async function getProduct(
  supabase: AppSupabaseClient,
  viewer: Viewer,
  id: string,
): Promise<ProductDto> {
  const isAdmin = viewer.audience === "admin";
  if (isAdmin) assertAdmin(viewer.actor);

  const product = isUuid(id)
    ? await findProduct(supabase, id, { activeOnly: !isAdmin })
    : null;
  if (!product) throw notFound(LABEL);
  return product;
}

export async function createProduct(
  supabase: AppSupabaseClient,
  actor: Actor | null,
  rawInput: unknown,
): Promise<ProductDto> {
  assertAdmin(actor);
  const input = productCreateSchema.parse(rawInput);
  const created = await insertProduct(supabase, input);
  revalidateFrontend(REVALIDATE_TAGS);
  return created;
}

export async function updateProductById(
  supabase: AppSupabaseClient,
  actor: Actor | null,
  id: string,
  rawInput: unknown,
): Promise<ProductDto> {
  assertAdmin(actor);
  const input = productUpdateSchema.parse(rawInput);
  if (!isUuid(id)) throw notFound(LABEL);

  if (Object.keys(input).length === 0) {
    return getProduct(supabase, { audience: "admin", actor }, id);
  }

  const result = await updateProduct(supabase, id, input);
  if (!result) throw notFound(LABEL);

  if (result.previousImageUrl !== result.item.image.image_url) {
    await deleteImage(result.previousImageUrl);
  }
  revalidateFrontend(REVALIDATE_TAGS);
  return result.item;
}

export async function deleteProductById(
  supabase: AppSupabaseClient,
  actor: Actor | null,
  id: string,
): Promise<{ _id: string }> {
  assertAdmin(actor);
  const removed = isUuid(id) ? await deleteProduct(supabase, id) : null;
  if (!removed) throw notFound(LABEL);

  await deleteImage(removed.image.image_url);
  revalidateFrontend(REVALIDATE_TAGS);
  return { _id: id };
}
