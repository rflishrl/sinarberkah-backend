import type { RequestHandler } from './$types';

import { loginSchema } from '#lib/features/auth/schemas.js';
import { AppError } from '#lib/server/api/errors.js';
import { consumeRateLimit, resetRateLimit } from '#lib/server/api/rate-limit.js';
import { RATE_LIMITS } from '#lib/server/api/rate-limits.js';
import { readJson } from '#lib/server/api/request.js';
import { withApi } from '#lib/server/api/with-api.js';
import { login } from '#lib/server/features/auth/service.js';
import { verifyTurnstile } from '#lib/server/turnstile.js';

function readObjectField(raw: unknown, field: string): string {
	if (!raw || typeof raw !== 'object') return '';
	const value = (raw as Record<string, unknown>)[field];
	return typeof value === 'string' ? value : '';
}

export const POST: RequestHandler = withApi(
	{ access: 'session' },
	async ({ request, cookies, clientIp, requestId }) => {
		const raw = await readJson(request);
		const normalizedEmail = readObjectField(raw, 'email').trim().toLowerCase();

		if (readObjectField(raw, 'website').trim().length > 0) {
			return { data: { email: normalizedEmail } };
		}

		const loginKey = `${clientIp}:${normalizedEmail || 'anonymous'}`;
		await consumeRateLimit(RATE_LIMITS.login, loginKey, requestId);

		const body = loginSchema.parse(raw);

		const verification = await verifyTurnstile(body.turnstileToken, 'login', clientIp);
		if (!verification.success) {
			throw new AppError('VALIDATION', 'Verifikasi gagal. Muat ulang halaman dan coba lagi.');
		}

		const { result, setCookieHeader } = await login(body, cookies);
		await resetRateLimit(RATE_LIMITS.login, loginKey);
		return {
			data: result,
			...(cookies ? {} : { headers: { 'Set-Cookie': setCookieHeader } })
		};
	}
);
