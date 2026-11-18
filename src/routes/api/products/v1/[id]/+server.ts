import type { RequestHandler } from './$types';

import { RATE_LIMITS } from '#lib/server/api/rate-limits.js';
import { handlePreflight, withApi } from '#lib/server/api/with-api.js';
import { getProduct } from '#lib/server/features/products/service.js';

type Params = { id: string };

export const GET: RequestHandler = withApi<'public', Params>(
	{ access: 'public', rateLimit: RATE_LIMITS.publicRead },
	async ({ params }) => ({
		data: await getProduct({ audience: 'public' }, params.id)
	})
);

export const OPTIONS: RequestHandler = ({ request }) => handlePreflight(request);
