import type { RequestHandler } from './$types';

import { readJson } from '#lib/server/api/request.js';
import { withApi } from '#lib/server/api/with-api.js';
import {
	deleteGallery,
	getGalleryItem,
	updateGallery
} from '#lib/server/features/gallery/service.js';

type Params = { id: string };

export const GET: RequestHandler = withApi<'admin', Params>(
	{ access: 'admin' },
	async ({ params, actor }) => ({
		data: await getGalleryItem({ audience: 'admin', actor }, 'portfolio', params.id)
	})
);

export const PATCH: RequestHandler = withApi<'admin', Params>(
	{ access: 'admin' },
	async ({ request, params, actor }) => ({
		data: await updateGallery(actor, 'portfolio', params.id, await readJson(request))
	})
);

export const DELETE: RequestHandler = withApi<'admin', Params>(
	{ access: 'admin' },
	async ({ params, actor }) => ({
		data: await deleteGallery(actor, 'portfolio', params.id)
	})
);
