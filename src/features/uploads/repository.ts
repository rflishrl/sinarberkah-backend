import "server-only";

import { getDb } from "@/lib/db/client";

/**
 * Collects active image URLs referenced in products and gallery.
 */
export async function listReferencedImageUrls(): Promise<Set<string>> {
  const sql = getDb();
  const [productRows, galleryRows] = await Promise.all([
    sql`SELECT image_url FROM products WHERE image_url IS NOT NULL AND image_url != ''`,
    sql`SELECT image_url FROM gallery_items WHERE image_url IS NOT NULL AND image_url != ''`,
  ]);

  const set = new Set<string>();
  for (const row of productRows) {
    if (row.image_url) set.add(row.image_url as string);
  }
  for (const row of galleryRows) {
    if (row.image_url) set.add(row.image_url as string);
  }

  return set;
}
