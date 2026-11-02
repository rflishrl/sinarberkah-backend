import "server-only";

import { toAppError } from "@/lib/supabase/errors";
import type { AppSupabaseClient } from "@/lib/supabase/server";

/**
 * Semua alamat foto yang masih dipakai produk atau galeri. Harus dipanggil dengan
 * client admin (secret key): pembersihan juga harus melihat produk yang disembunyikan,
 * yang tidak terlihat oleh peran anon karena RLS.
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
