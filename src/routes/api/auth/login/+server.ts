import type { RequestHandler } from './$types';

import { loginSchema } from '#lib/features/auth/schemas.js';
import { AppError } from '#lib/server/api/errors.js';
import { getClientIp, resetRateLimit } from '#lib/server/api/rate-limit.js';
import { RATE_LIMITS } from '#lib/server/api/rate-limits.js';
import { readJson } from '#lib/server/api/request.js';
import { withApi } from '#lib/server/api/with-api.js';
import { login } from '#lib/server/features/auth/service.js';
import { verifyTurnstile } from '#lib/server/turnstile.js';

export const POST: RequestHandler = withApi(
	{ access: 'session', rateLimit: RATE_LIMITS.login },
	async ({ request, cookies }) => {
		const raw = await readJson(request);
		const body = loginSchema.parse(raw);
		const clientIp = getClientIp(request);

		const verification = await verifyTurnstile(body.turnstileToken, 'login', clientIp);
		if (!verification.success) {
			throw new AppError('VALIDATION', 'Verifikasi gagal.');
		}

		const { result, setCookieHeader } = await login(body, cookies);
		await resetRateLimit(RATE_LIMITS.login, clientIp);
		return {
			data: result,
			...(cookies ? {} : { headers: { 'Set-Cookie': setCookieHeader } })
		};
	}
);
