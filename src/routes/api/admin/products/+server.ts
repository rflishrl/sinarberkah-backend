import type { RequestHandler } from './$types';

import { listQuerySchema } from '#lib/schemas/common.js';
import { parseQuery, readJson } from '#lib/server/api/request.js';
import { withApi } from '#lib/server/api/with-api.js';
import { createProduct, listProductsFor } from '#lib/server/features/products/service.js';

export const GET: RequestHandler = withApi({ access: 'admin' }, async ({ request, actor }) => ({
	data: await listProductsFor(
		{ audience: 'admin', actor },
		parseQuery(request, listQuerySchema(10))
	)
}));

export const POST: RequestHandler = withApi({ access: 'admin' }, async ({ request, actor }) => ({
	data: await createProduct(actor, await readJson(request)),
	status: 201
}));
