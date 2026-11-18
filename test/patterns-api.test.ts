import { beforeEach, describe, expect, it, vi } from 'vitest';

import { readBody, sameOriginRequest } from './api-helpers.js';

const getCurrentAdmin = vi.fn();
const insertGalleryItem = vi.fn();
const listGalleryItems = vi.fn();

vi.mock('#lib/server/auth/session.js', () => ({
	getCurrentAdmin: (...args: unknown[]) => getCurrentAdmin(...args)
}));
vi.mock('#lib/server/features/gallery/repository.js', () => ({
	insertGalleryItem: (...args: unknown[]) => insertGalleryItem(...args),
	listGalleryItems: (...args: unknown[]) => listGalleryItems(...args)
}));
vi.mock('#lib/server/revalidate.js', () => ({ revalidateFrontend: () => {} }));

const { GET, POST } = await import('../src/routes/api/admin/patterns/+server.js');

const ADMIN = { id: 'a1', email: 'admin@sinarberkah.com', role: 'admin' as const };
const body = {
	title: 'Pola Daun',
	type: 'Floral',
	image_url: '550e8400-e29b-41d4-a716-446655440000.webp'
};

beforeEach(() => {
	getCurrentAdmin.mockReset().mockResolvedValue(ADMIN);
	insertGalleryItem.mockReset();
	listGalleryItems.mockReset();
	vi.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('/api/admin/patterns', () => {
	it('GET: 401 tanpa sesi', async () => {
		getCurrentAdmin.mockResolvedValue(null);
		expect((await GET({ request: sameOriginRequest('/api/admin/patterns') } as never)).status).toBe(
			401
		);
		expect(listGalleryItems).not.toHaveBeenCalled();
	});

	it('GET: daftar admin dengan pagination dan tanpa cache', async () => {
		listGalleryItems.mockResolvedValue({ items: [], total: 0 });
		const response = await GET({
			request: sameOriginRequest('/api/admin/patterns?page=2&q=daun')
		} as never);
		expect(response.status).toBe(200);
		expect(response.headers.get('cache-control')).toBe('private, no-store');
		expect(listGalleryItems).toHaveBeenCalledWith('pattern', {
			q: 'daun',
			offset: 10,
			limit: 10
		});
	});

	it('POST: 201 dan tolak lintas origin', async () => {
		insertGalleryItem.mockResolvedValue({
			_id: 'p1',
			kind: 'pattern',
			...body,
			createdAt: '2026-04-18T00:00:00.000Z',
			updatedAt: '2026-04-18T00:00:00.000Z'
		});

		const response = await POST({
			request: sameOriginRequest('/api/admin/patterns', { method: 'POST', json: body })
		} as never);
		expect(response.status).toBe(201);
		expect(await readBody(response)).toMatchObject({
			success: true,
			data: { _id: 'p1', title: 'Pola Daun' }
		});

		const crossOrigin = await POST({
			request: new Request('http://localhost/api/admin/patterns', {
				method: 'POST',
				headers: {
					origin: 'https://evil.example.com',
					host: 'localhost',
					'content-type': 'application/json'
				},
				body: JSON.stringify(body)
			})
		} as never);
		expect(crossOrigin.status).toBe(403);
	});
});
