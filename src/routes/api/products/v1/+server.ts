import type { RequestHandler } from './$types';

import { listQuerySchema } from '#lib/schemas/common.js';
import { RATE_LIMITS } from '#lib/server/api/rate-limits.js';
import { parseQuery } from '#lib/server/api/request.js';
import { handlePreflight, withApi } from '#lib/server/api/with-api.js';
import { listProductsFor } from '#lib/server/features/products/service.js';

export const GET: RequestHandler = withApi(
	{ access: 'public', rateLimit: RATE_LIMITS.publicRead },
	async ({ request }) => ({
		data: await listProductsFor({ audience: 'public' }, parseQuery(request, listQuerySchema(50)))
	})
);

export const OPTIONS: RequestHandler = ({ request }) => handlePreflight(request);
