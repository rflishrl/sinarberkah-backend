import type { PageServerLoad } from './$types';

import {
	MEDIA_STORAGE_DEFAULT_LIMIT,
	mediaStorageQuerySchema
} from '#lib/features/uploads/schemas.js';
import { getMediaStorageSummary } from '#lib/server/features/uploads/storage-service.js';

export const load: PageServerLoad = async ({ locals, url }) => {
	const parsed = mediaStorageQuerySchema.parse({
		page: url.searchParams.get('page') ?? undefined,
		limit: MEDIA_STORAGE_DEFAULT_LIMIT
	});

	try {
		const summary = await getMediaStorageSummary(locals.admin, parsed);
		return { page: parsed.page, summary, errorMessage: null as string | null };
	} catch (err) {
		return {
			page: parsed.page,
			summary: null,
			errorMessage: err instanceof Error ? err.message : 'Gagal memuat data penyimpanan.'
		};
	}
};
