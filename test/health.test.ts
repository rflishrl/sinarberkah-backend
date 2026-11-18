import { beforeEach, describe, expect, it, vi } from 'vitest';

import { readBody, sameOriginRequest } from './api-helpers.js';

const pingDatabase = vi.fn();

vi.mock('#lib/server/features/health/repository.js', () => ({
	pingDatabase: (...args: unknown[]) => pingDatabase(...args)
}));
vi.mock('#lib/server/api/rate-limit.js', async (importOriginal) => ({
	...(await importOriginal<typeof import('#lib/server/api/rate-limit.js')>()),
	consumeRateLimit: async () => undefined
}));

const { GET } = await import('../src/routes/api/health/+server.js');
const { checkHealth } = await import('#lib/server/features/health/service.js');

beforeEach(() => {
	pingDatabase.mockReset();
	vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('GET /api/health', () => {
	it('200 dan tidak di-cache jika database menjawab', async () => {
		pingDatabase.mockResolvedValue(undefined);
		await expect(checkHealth()).resolves.toEqual({ status: 'ok', database: 'ok' });

		const response = await GET({ request: sameOriginRequest('/api/health') } as never);
		expect(response.status).toBe(200);
		expect(response.headers.get('cache-control')).toBe('private, no-store');
		expect(await readBody(response)).toEqual({
			success: true,
			data: { status: 'ok', database: 'ok' }
		});
	});

	it('503 jika database gagal', async () => {
		pingDatabase.mockRejectedValue(new Error('down'));
		const response = await GET({ request: sameOriginRequest('/api/health') } as never);
		expect(response.status).toBe(503);
		expect(await readBody(response)).toEqual({
			success: false,
			error: 'Database tidak dapat dijangkau.'
		});
	});
});
