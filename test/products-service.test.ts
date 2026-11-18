import { beforeEach, describe, expect, it, vi } from 'vitest';

const repo = {
	listProducts: vi.fn(),
	findProduct: vi.fn(),
	insertProduct: vi.fn(),
	updateProduct: vi.fn(),
	deleteProduct: vi.fn()
};
const deleteStoredMedia = vi.fn();
const revalidateFrontend = vi.fn();

vi.mock('#lib/server/features/products/repository.js', () => repo);
vi.mock('#lib/server/features/uploads/media-storage.js', () => ({
	deleteStoredMedia: (url: string) => deleteStoredMedia(url)
}));
vi.mock('#lib/server/revalidate.js', () => ({
	revalidateFrontend: (tags: string[]) => revalidateFrontend(tags)
}));

const service = await import('#lib/server/features/products/service.js');

const admin = { id: 'a1', email: 'admin@sinarberkah.com', role: 'admin' as const };
const user = { id: 'u1', email: 'user@sinarberkah.com', role: 'user' as const };
const ID = '0b6c1c0e-5c0a-4a53-9d6e-2f4f6f0a1b2c';
const OLD = '550e8400-e29b-41d4-a716-446655440001.webp';
const NEW = '550e8400-e29b-41d4-a716-446655440002.webp';
const product = (image_url: string) => ({
	_id: ID,
	name: 'Pagar',
	category: '',
	description: '',
	price: 100,
	image: { image_url },
	isActive: true,
	createdAt: '2026-01-01T00:00:00.000Z',
	updatedAt: '2026-01-01T00:00:00.000Z'
});

beforeEach(() => {
	for (const fn of Object.values(repo)) fn.mockReset();
	deleteStoredMedia.mockReset();
	revalidateFrontend.mockReset();
});

describe('products service', () => {
	it('bukan admin tidak bisa menulis', async () => {
		await expect(service.createProduct(user, { name: 'Pagar', price: 1 })).rejects.toMatchObject({
			code: 'FORBIDDEN'
		});
		await expect(service.updateProductById(null, ID, { price: 1 })).rejects.toMatchObject({
			code: 'UNAUTHENTICATED'
		});
		await expect(service.deleteProductById(user, ID)).rejects.toMatchObject({
			code: 'FORBIDDEN'
		});
		expect(repo.insertProduct).not.toHaveBeenCalled();
	});

	it('publik hanya melihat produk aktif, admin melihat semua', async () => {
		repo.listProducts.mockResolvedValue({ items: [], total: 0 });
		await service.listProductsFor({ audience: 'public' }, {});
		expect(repo.listProducts).toHaveBeenLastCalledWith(
			expect.objectContaining({ activeOnly: true, limit: 50 })
		);
		await service.listProductsFor({ audience: 'admin', actor: admin }, {});
		expect(repo.listProducts).toHaveBeenLastCalledWith(
			expect.objectContaining({ activeOnly: false, limit: 10 })
		);
	});

	it('produk tersembunyi = 404 untuk publik', async () => {
		repo.findProduct.mockResolvedValue(null);
		await expect(service.getProduct({ audience: 'public' }, ID)).rejects.toMatchObject({
			code: 'NOT_FOUND'
		});
		expect(repo.findProduct).toHaveBeenCalledWith(ID, { activeOnly: true });
	});

	it('menghapus media lama saat foto berubah dan memicu revalidate', async () => {
		repo.updateProduct.mockResolvedValue({
			item: product(NEW),
			previousImageUrl: OLD,
			currentImageUrl: NEW
		});
		await service.updateProductById(admin, ID, { image_url: NEW });
		expect(deleteStoredMedia).toHaveBeenCalledWith(OLD);
		expect(revalidateFrontend).toHaveBeenCalledWith(['products']);
	});
});
