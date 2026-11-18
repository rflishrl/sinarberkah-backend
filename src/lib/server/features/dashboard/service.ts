import type { Actor } from '#lib/server/auth/actor.js';
import { assertAdmin } from '#lib/server/auth/authorize.js';
import { countGalleryItems } from '#lib/server/features/gallery/repository.js';
import { countProducts } from '#lib/server/features/products/repository.js';

export interface DashboardCounts {
	products: number;
	portfolio: number;
	patterns: number;
}

/** Aggregate counts per entity type for admin dashboard queried concurrently. */
export async function getDashboardCounts(actor: Actor | null): Promise<DashboardCounts> {
	assertAdmin(actor);
	const [products, portfolio, patterns] = await Promise.all([
		countProducts(),
		countGalleryItems('portfolio'),
		countGalleryItems('pattern')
	]);
	return { products, portfolio, patterns };
}
