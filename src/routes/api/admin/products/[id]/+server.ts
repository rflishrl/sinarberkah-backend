import type { RequestHandler } from './$types';

import { readJson } from '#lib/server/api/request.js';
import { withApi } from '#lib/server/api/with-api.js';
import {
	deleteProductById,
	getProduct,
	updateProductById
} from '#lib/server/features/products/service.js';

type Params = { id: string };

export const GET: RequestHandler = withApi<'admin', Params>(
	{ access: 'admin' },
	async ({ params, actor }) => ({
		data: await getProduct({ audience: 'admin', actor }, params.id)
	})
);

export const PATCH: RequestHandler = withApi<'admin', Params>(
	{ access: 'admin' },
	async ({ request, params, actor }) => ({
		data: await updateProductById(actor, params.id, await readJson(request))
	})
);

export const DELETE: RequestHandler = withApi<'admin', Params>(
	{ access: 'admin' },
	async ({ params, actor }) => ({
		data: await deleteProductById(actor, params.id)
	})
);
