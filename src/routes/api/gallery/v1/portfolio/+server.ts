import type { RequestHandler } from './$types';

import { listQuerySchema } from '#lib/schemas/common.js';
import { RATE_LIMITS } from '#lib/server/api/rate-limits.js';
import { parseQuery } from '#lib/server/api/request.js';
import { handlePreflight, withApi } from '#lib/server/api/with-api.js';
import { listGallery } from '#lib/server/features/gallery/service.js';

export const GET: RequestHandler = withApi(
	{ access: 'public', rateLimit: RATE_LIMITS.publicRead },
	async ({ request }) => ({
		data: await listGallery(
			{ audience: 'public' },
			'portfolio',
			parseQuery(request, listQuerySchema(50))
		)
	})
);

export const OPTIONS: RequestHandler = ({ request }) => handlePreflight(request);
