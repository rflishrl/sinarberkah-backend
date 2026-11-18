import { beforeEach, describe, expect, it, vi } from 'vitest';

const repo = {
	listGalleryItems: vi.fn(),
	findGalleryItem: vi.fn(),
	insertGalleryItem: vi.fn(),
	updateGalleryItem: vi.fn(),
	deleteGalleryItem: vi.fn()
};
const deleteStoredMedia = vi.fn();
const revalidateFrontend = vi.fn();

vi.mock('#lib/server/features/gallery/repository.js', () => repo);
vi.mock('#lib/server/features/uploads/media-storage.js', () => ({
	deleteStoredMedia: (url: string) => deleteStoredMedia(url)
}));
vi.mock('#lib/server/revalidate.js', () => ({
	revalidateFrontend: (tags: string[]) => revalidateFrontend(tags)
}));

const service = await import('#lib/server/features/gallery/service.js');

const admin = { id: 'a1', email: 'admin@sinarberkah.com', role: 'admin' as const };
const user = { id: 'u1', email: 'user@sinarberkah.com', role: 'user' as const };
const ID = '0b6c1c0e-5c0a-4a53-9d6e-2f4f6f0a1b2c';
const OLD = '550e8400-e29b-41d4-a716-446655440001.webp';
const NEW = '550e8400-e29b-41d4-a716-446655440002.webp';
const item = (image_url: string) => ({
	_id: ID,
	kind: 'pattern' as const,
	title: 'Pola Daun',
	type: 'Floral',
	description: '',
	image: { image_url },
	createdAt: '2026-01-01T00:00:00.000Z',
	updatedAt: '2026-01-01T00:00:00.000Z'
});
const validInput = { title: 'Pola Daun', type: 'Floral', image_url: NEW };

beforeEach(() => {
	for (const fn of Object.values(repo)) fn.mockReset();
	deleteStoredMedia.mockReset();
	revalidateFrontend.mockReset();
});

describe('gallery service', () => {
	it.each([
		['tanpa login', null, 'UNAUTHENTICATED'],
		['bukan admin', user, 'FORBIDDEN']
	] as const)('tulis data %s ditolak (%s)', async (_label, actor, code) => {
		await expect(service.createGallery(actor, 'pattern', validInput)).rejects.toMatchObject({
			code
		});
		await expect(
			service.updateGallery(actor, 'pattern', ID, { title: 'Baru' })
		).rejects.toMatchObject({ code });
		await expect(service.deleteGallery(actor, 'pattern', ID)).rejects.toMatchObject({ code });
		expect(repo.insertGalleryItem).not.toHaveBeenCalled();
	});

	it('menghapus media lama saat update/delete dan memicu revalidate tag yang benar', async () => {
		repo.updateGalleryItem.mockResolvedValue({ item: item(NEW), previousImageUrl: OLD });
		await service.updateGallery(admin, 'pattern', ID, { image_url: NEW });
		expect(deleteStoredMedia).toHaveBeenCalledWith(OLD);
		expect(revalidateFrontend).toHaveBeenCalledWith(['gallery']);

		repo.deleteGalleryItem.mockResolvedValue(item(NEW));
		await service.deleteGallery(admin, 'portfolio', ID);
		expect(deleteStoredMedia).toHaveBeenCalledWith(NEW);
		expect(revalidateFrontend).toHaveBeenCalledWith(['portfolio']);
	});
});
