import type { RequestHandler } from './$types';

import { withApi } from '#lib/server/api/with-api.js';
import { logout } from '#lib/server/features/auth/service.js';

export const POST: RequestHandler = withApi({ access: 'session' }, async ({ cookies }) => {
	const { result, setCookieHeader } = await logout(cookies);
	return {
		data: result,
		...(cookies ? {} : { headers: { 'Set-Cookie': setCookieHeader } })
	};
});
