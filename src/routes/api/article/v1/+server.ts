import type { RequestHandler } from './$types';

import { RATE_LIMITS } from '#lib/server/api/rate-limits.js';
import { handlePreflight, withApi } from '#lib/server/api/with-api.js';

export const GET: RequestHandler = withApi(
	{ access: 'public', rateLimit: RATE_LIMITS.publicRead },
	async () => ({
		data: {
			items: [],
			pagination: { total: 0, page: 1, limit: 10, totalPages: 0 }
		}
	})
);

export const OPTIONS: RequestHandler = ({ request }) => handlePreflight(request);
