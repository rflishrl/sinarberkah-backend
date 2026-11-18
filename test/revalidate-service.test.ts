import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const fetchMock = vi.fn();
const admin = { id: 'a1', email: 'admin@sinarberkah.com', role: 'admin' as const };
const user = { id: 'u1', email: 'user@sinarberkah.com', role: 'user' as const };

const { checkRevalidate, getRevalidateStatus } =
	await import('#lib/server/features/revalidate/service.js');

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

beforeEach(() => {
	vi.stubGlobal('fetch', fetchMock);
	vi.stubEnv('FRONTEND_URL', 'https://plato.example.com/');
	vi.stubEnv('REVALIDATE_SECRET', 'rahasia-uji-123');
});

afterEach(() => {
	vi.unstubAllGlobals();
	vi.unstubAllEnvs();
	fetchMock.mockReset();
});

describe('revalidate service', () => {
	it('returns normalized frontendUrl without exposing secret', () => {
		const status = getRevalidateStatus(admin);
		expect(status).toEqual({ frontendUrl: 'https://plato.example.com', hasSecret: true });
		expect(JSON.stringify(status)).not.toContain('rahasia-uji-123');

		expect(() => getRevalidateStatus(user)).toThrowError(
			expect.objectContaining({ code: 'FORBIDDEN' })
		);
		expect(() => getRevalidateStatus(null)).toThrowError(
			expect.objectContaining({ code: 'UNAUTHENTICATED' })
		);
	});

	it('dispatches POST /api/revalidate with secret and translates statuses', async () => {
		fetchMock.mockResolvedValueOnce(json({ revalidated: ['products'] }));
		const ok = await checkRevalidate(admin);
		expect(ok.state).toBe('ok');

		fetchMock.mockResolvedValueOnce(json({ error: 'no' }, 401));
		const unauthorized = await checkRevalidate(admin);
		expect(unauthorized.state).toBe('unauthorized');
		expect(JSON.stringify(unauthorized)).not.toContain('rahasia-uji-123');

		fetchMock.mockResolvedValueOnce(json({ error: 'missing' }, 503));
		expect((await checkRevalidate(admin)).state).toBe('frontend_missing_secret');

		fetchMock.mockResolvedValueOnce(new Response('', { status: 404 }));
		expect((await checkRevalidate(admin)).state).toBe('wrong_address');
	});
});
