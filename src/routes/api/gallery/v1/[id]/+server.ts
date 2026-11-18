import type { RequestHandler } from './$types';

import { RATE_LIMITS } from '#lib/server/api/rate-limits.js';
import { handlePreflight, withApi } from '#lib/server/api/with-api.js';
import { getGalleryItem } from '#lib/server/features/gallery/service.js';

type Params = { id: string };

export const GET: RequestHandler = withApi<'public', Params>(
	{ access: 'public', rateLimit: RATE_LIMITS.publicRead },
	async ({ params }) => ({
		data: await getGalleryItem({ audience: 'public' }, 'pattern', params.id)
	})
);

export const OPTIONS: RequestHandler = ({ request }) => handlePreflight(request);
