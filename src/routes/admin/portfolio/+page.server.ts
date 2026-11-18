import type { PageServerLoad } from './$types';

import { ADMIN_PAGE_SIZE } from '#lib/features/gallery/config.js';
import { listQuerySchema } from '#lib/schemas/common.js';
import { listGallery } from '#lib/server/features/gallery/service.js';

export const load: PageServerLoad = async ({ locals, url }) => {
	const params = listQuerySchema(ADMIN_PAGE_SIZE).parse({
		q: url.searchParams.get('q') ?? undefined,
		page: url.searchParams.get('page') ?? undefined,
		limit: url.searchParams.get('limit') ?? undefined
	});

	try {
		const list = await listGallery({ audience: 'admin', actor: locals.admin }, 'portfolio', params);
		return { q: params.q ?? '', list, errorMessage: null as string | null };
	} catch (err) {
		return {
			q: params.q ?? '',
			list: null,
			errorMessage: err instanceof Error ? err.message : 'Gagal memuat daftar portofolio.'
		};
	}
};
