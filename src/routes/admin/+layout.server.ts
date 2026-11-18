import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

import { readRevalidateConfig } from '#lib/server/revalidate.js';

export const load: LayoutServerLoad = ({ locals }) => {
	if (!locals.admin) {
		redirect(302, '/login');
	}
	const { baseUrl } = readRevalidateConfig();
	return {
		admin: locals.admin,
		frontendUrl: baseUrl
	};
};
