import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

import { AppError } from '#lib/server/api/errors.js';
import { getProduct } from '#lib/server/features/products/service.js';

export const load: PageServerLoad = async ({ locals, params }) => {
	try {
		const product = await getProduct({ audience: 'admin', actor: locals.admin }, params.id);
		return { product };
	} catch (err) {
		if (err instanceof AppError) {
			error(err.status, err.message);
		}
		throw err;
	}
};
