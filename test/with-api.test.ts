import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { readBody, sameOriginRequest } from './api-helpers.js';

const getCurrentAdmin = vi.fn();
const consumeRateLimit = vi.fn();

vi.mock('#lib/server/auth/session.js', () => ({
	getCurrentAdmin: (...args: unknown[]) => getCurrentAdmin(...args)
}));
vi.mock('#lib/server/api/rate-limit.js', async (importOriginal) => ({
	...(await importOriginal<typeof import('#lib/server/api/rate-limit.js')>()),
	consumeRateLimit: (...args: unknown[]) => consumeRateLimit(...args)
}));

const { withApi } = await import('#lib/server/api/with-api.js');
const { AppError } = await import('#lib/server/api/errors.js');

const ADMIN = { id: 'a1', email: 'admin@sinarberkah.com', role: 'admin' as const };

beforeEach(() => {
	getCurrentAdmin.mockReset();
	consumeRateLimit.mockReset().mockResolvedValue(undefined);
	vi.spyOn(console, 'error').mockImplementation(() => {});
	vi.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('withApi', () => {
	it('wraps success in { success: true, data } with request id and no-store cache header', async () => {
		const GET = withApi({ access: 'public' }, async () => ({ data: { status: 'ok' } }));
		const response = await GET(sameOriginRequest('/api/x'));

		expect(response.status).toBe(200);
		expect(response.headers.get('cache-control')).toBe('private, no-store');
		expect(response.headers.get('x-request-id')).toBeTruthy();
		expect(await readBody(response)).toEqual({ success: true, data: { status: 'ok' } });
	});

	it('maps AppError, ZodError, CSRF, and rate limit status codes', async () => {
		const notFoundHandler = withApi({ access: 'public' }, async () => {
			throw new AppError('NOT_FOUND', 'Item tidak ditemukan.');
		});
		expect((await notFoundHandler(sameOriginRequest('/api/x'))).status).toBe(404);

		const zodHandler = withApi({ access: 'public' }, async () => {
			z.object({ name: z.string().min(3, 'Nama minimal 3 karakter.') }).parse({ name: 'a' });
			return { data: null };
		});
		expect((await zodHandler(sameOriginRequest('/api/x'))).status).toBe(422);

		const postHandler = withApi({ access: 'public' }, async () => ({ data: null }));
		expect(
			(
				await postHandler(
					new Request('http://localhost:3000/api/x', {
						method: 'POST',
						headers: { host: 'localhost:3000', origin: 'https://evil.example' }
					})
				)
			).status
		).toBe(403);

		consumeRateLimit.mockRejectedValueOnce(
			new AppError('RATE_LIMITED', 'Too many requests.', { retryAfterSeconds: 45 })
		);
		const limitedHandler = withApi(
			{ access: 'public', rateLimit: { name: 'test', limit: 1, windowSeconds: 60 } },
			async () => ({ data: null })
		);
		const limitedRes = await limitedHandler(sameOriginRequest('/api/x'));
		expect(limitedRes.status).toBe(429);
		expect(limitedRes.headers.get('retry-after')).toBe('45');
	});

	it('requires valid admin session for admin routes', async () => {
		getCurrentAdmin.mockResolvedValueOnce(null);
		const adminOnly = withApi({ access: 'admin' }, async ({ actor }) => ({ data: actor }));
		expect((await adminOnly(sameOriginRequest('/api/admin/x'))).status).toBe(401);

		getCurrentAdmin.mockResolvedValueOnce(ADMIN);
		const okRes = await adminOnly(sameOriginRequest('/api/admin/x'));
		expect(okRes.status).toBe(200);
		expect(await readBody(okRes)).toEqual({ success: true, data: ADMIN });
	});
});
