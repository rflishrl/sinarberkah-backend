import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

import { AppError } from '#lib/server/api/errors.js';
import { getGalleryItem } from '#lib/server/features/gallery/service.js';

export const load: PageServerLoad = async ({ locals, params }) => {
	try {
		const item = await getGalleryItem(
			{ audience: 'admin', actor: locals.admin },
			'portfolio',
			params.id
		);
		return { item };
	} catch (err) {
		if (err instanceof AppError) {
			error(err.status, err.message);
		}
		throw err;
	}
};
