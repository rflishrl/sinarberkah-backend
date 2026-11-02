import "server-only";

import type {
  ProductCreateInput,
  ProductDto,
  ProductUpdateInput,
} from "@/features/products/schemas";
import { toAppError } from "@/lib/supabase/errors";
import type { AppSupabaseClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

type ProductRow = Tables<"products">;

/** Nama kolom `_id`, `image.image_url`, dan `isActive` dipertahankan untuk frontend lama. */
function toDto(row: ProductRow): ProductDto {
  return {
    _id: row.id,
    name: row.name,
    category: row.category,
    description: row.description,
    price: row.price,
    image: { image_url: row.image_url },
    isActive: row.is_active,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

/** Input camelCase -> kolom snake_case. Kolom yang tidak dikirim tidak ikut. */
function toColumns(input: ProductUpdateInput) {
  return {
    ...(input.name !== undefined && { name: input.name }),
    ...(input.category !== undefined && { category: input.category }),
    ...(input.description !== undefined && { description: input.description }),
    ...(input.price !== undefined && { price: input.price }),
    ...(input.image_url !== undefined && { image_url: input.image_url }),
    ...(input.isActive !== undefined && { is_active: input.isActive }),
  };
}

export interface ListParams {
  q?: string;
  limit: number;
  offset: number;
  /** `true`: hanya produk aktif. RLS juga menyaring untuk pembaca publik. */
  activeOnly: boolean;
}

export async function listProducts(
  supabase: AppSupabaseClient,
  { q, limit, offset, activeOnly }: ListParams,
): Promise<{ items: ProductDto[]; total: number }> {
  const [rows, count] = await Promise.all([
    supabase.rpc("list_products", {
      p_q: q,
      p_limit: limit,
      p_offset: offset,
      p_active_only: activeOnly,
    }),
    supabase.rpc("count_products", { p_q: q, p_active_only: activeOnly }),
  ]);
  if (rows.error) throw toAppError(rows.error, "memuat produk");
  if (count.error) throw toAppError(count.error, "menghitung produk");
  return { items: rows.data.map(toDto), total: count.data };
}

export async function countProducts(
  supabase: AppSupabaseClient,
): Promise<number> {
  const { data, error } = await supabase.rpc("count_products", {
    p_active_only: false,
  });
  if (error) throw toAppError(error, "menghitung produk");
  return data;
}

export async function findProduct(
  supabase: AppSupabaseClient,
  id: string,
  { activeOnly }: { activeOnly: boolean },
): Promise<ProductDto | null> {
  let query = supabase.from("products").select("*").eq("id", id);
  if (activeOnly) query = query.eq("is_active", true);
  const { data, error } = await query.maybeSingle();
  if (error) throw toAppError(error, "memuat produk");
  return data ? toDto(data) : null;
}

export async function insertProduct(
  supabase: AppSupabaseClient,
  input: ProductCreateInput,
): Promise<ProductDto> {
  const { data, error } = await supabase
    .from("products")
    .insert({ ...toColumns(input), name: input.name, price: input.price })
    .select("*")
    .single();
  if (error) throw toAppError(error, "menyimpan produk");
  return toDto(data);
}

/** Baris dikunci di database (RPC update_product). `null` jika id tidak ada. */
export async function updateProduct(
  supabase: AppSupabaseClient,
  id: string,
  input: ProductUpdateInput,
): Promise<{ item: ProductDto; previousImageUrl: string } | null> {
  const { data, error } = await supabase
    .rpc("update_product", { p_id: id, p_patch: toColumns(input) })
    .maybeSingle();
  if (error) throw toAppError(error, "menyimpan perubahan");
  if (!data) return null;

  const { previous_image_url: previousImageUrl, ...row } = data;
  return { item: toDto(row), previousImageUrl };
}

export async function deleteProduct(
  supabase: AppSupabaseClient,
  id: string,
): Promise<ProductDto | null> {
  const { data, error } = await supabase
    .from("products")
    .delete()
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) throw toAppError(error, "menghapus produk");
  return data ? toDto(data) : null;
}
