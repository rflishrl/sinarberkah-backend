import type { RequestHandler } from './$types';

import { withApi } from '#lib/server/api/with-api.js';
import { checkRevalidate } from '#lib/server/features/revalidate/service.js';

export const POST: RequestHandler = withApi({ access: 'admin' }, async ({ actor }) => ({
	data: await checkRevalidate(actor)
}));
