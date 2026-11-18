import * as privateEnv from '$app/env/private';
import type { PageServerLoad } from './$types';

import { getDashboardCounts } from '#lib/server/features/dashboard/service.js';

function isStorageReady(): boolean {
	const envSource = process.env.VITEST ? process.env : { ...process.env, ...privateEnv };
	return Boolean(
		envSource.R2_ACCESS_KEY_ID?.trim() &&
		envSource.R2_SECRET_ACCESS_KEY?.trim() &&
		envSource.R2_ENDPOINT?.trim() &&
		envSource.R2_BUCKET_NAME?.trim() &&
		envSource.R2_PUBLIC_DOMAIN?.trim()
	);
}

export const load: PageServerLoad = async ({ locals }) => {
	const counts = await getDashboardCounts(locals.admin);
	return {
		counts,
		storageReady: isStorageReady()
	};
};
