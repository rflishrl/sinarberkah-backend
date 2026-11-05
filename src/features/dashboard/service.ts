import "server-only";

import { countGalleryItems } from "@/features/gallery/repository";
import { countProducts } from "@/features/products/repository";
import type { Actor } from "@/lib/auth/actor";
import { assertAdmin } from "@/lib/auth/authorize";

export interface DashboardCounts {
  products: number;
  portfolio: number;
  patterns: number;
}

/** Aggregate counts per entity type for admin dashboard queried concurrently. */
export async function getDashboardCounts(
  actor: Actor | null,
): Promise<DashboardCounts> {
  assertAdmin(actor);
  const [products, portfolio, patterns] = await Promise.all([
    countProducts(),
    countGalleryItems("portfolio"),
    countGalleryItems("pattern"),
  ]);
  return { products, portfolio, patterns };
}
