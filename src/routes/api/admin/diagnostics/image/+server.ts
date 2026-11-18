import type { RequestHandler } from './$types';

import { withApi } from '#lib/server/api/with-api.js';
import { runImageDiagnostics } from '#lib/server/features/uploads/diagnostics-service.js';

export const POST: RequestHandler = withApi({ access: 'admin' }, async ({ actor }) => ({
	data: await runImageDiagnostics(actor)
}));
