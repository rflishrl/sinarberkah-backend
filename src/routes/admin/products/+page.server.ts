import type { PageServerLoad } from './$types';

import { listQuerySchema } from '#lib/schemas/common.js';
import { listProductsFor } from '#lib/server/features/products/service.js';

export const load: PageServerLoad = async ({ locals, url }) => {
	const params = listQuerySchema(10).parse({
		q: url.searchParams.get('q') ?? undefined,
		page: url.searchParams.get('page') ?? undefined,
		limit: url.searchParams.get('limit') ?? undefined
	});

	try {
		const list = await listProductsFor({ audience: 'admin', actor: locals.admin }, params);
		return { q: params.q ?? '', list, errorMessage: null as string | null };
	} catch (err) {
		return {
			q: params.q ?? '',
			list: null,
			errorMessage: err instanceof Error ? err.message : 'Gagal memuat daftar produk.'
		};
	}
};
