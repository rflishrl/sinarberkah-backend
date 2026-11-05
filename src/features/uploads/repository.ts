import "server-only";

import { toAppError } from "@/lib/supabase/errors";
import type { AppSupabaseClient } from "@/lib/supabase/server";

/**
 * Collects active image URLs referenced in products and gallery.
 * Requires admin client to query inactive products hidden by public RLS.
 */
export async function listReferencedImageUrls(
  adminClient: AppSupabaseClient,
): Promise<Set<string>> {
  const [products, gallery] = await Promise.all([
    adminClient.from("products").select("image_url"),
    adminClient.from("gallery_items").select("image_url"),
  ]);
  if (products.error) throw toAppError(products.error, "memuat foto produk");
  if (gallery.error) throw toAppError(gallery.error, "memuat foto galeri");

  return new Set(
    [...products.data, ...gallery.data]
      .map((row) => row.image_url)
      .filter(Boolean),
  );
}
