import "server-only";

import { countGalleryItems } from "@/features/gallery/repository";
import { countProducts } from "@/features/products/repository";
import type { Actor } from "@/lib/auth/actor";
import { assertAdmin } from "@/lib/auth/authorize";
import type { AppSupabaseClient } from "@/lib/supabase/server";

export interface DashboardCounts {
  products: number;
  portfolio: number;
  patterns: number;
}

/** Jumlah data per jenis untuk dashboard admin (tiga query kecil, berjalan bersamaan). */
export async function getDashboardCounts(
  supabase: AppSupabaseClient,
  actor: Actor | null,
): Promise<DashboardCounts> {
  assertAdmin(actor);
  const [products, portfolio, patterns] = await Promise.all([
    countProducts(supabase),
    countGalleryItems(supabase, "portfolio"),
    countGalleryItems(supabase, "pattern"),
  ]);
  return { products, portfolio, patterns };
}
