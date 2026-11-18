import type { RequestHandler } from './$types';

import { listQuerySchema } from '#lib/schemas/common.js';
import { parseQuery, readJson } from '#lib/server/api/request.js';
import { withApi } from '#lib/server/api/with-api.js';
import { createGallery, listGallery } from '#lib/server/features/gallery/service.js';

export const GET: RequestHandler = withApi({ access: 'admin' }, async ({ request, actor }) => ({
	data: await listGallery(
		{ audience: 'admin', actor },
		'portfolio',
		parseQuery(request, listQuerySchema(10))
	)
}));

export const POST: RequestHandler = withApi({ access: 'admin' }, async ({ request, actor }) => ({
	data: await createGallery(actor, 'portfolio', await readJson(request)),
	status: 201
}));
