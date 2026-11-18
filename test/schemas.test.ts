import { describe, expect, it } from 'vitest';

import { galleryCreateSchema, galleryUpdateSchema } from '#lib/features/gallery/schemas.js';
import { productCreateSchema, productUpdateSchema } from '#lib/features/products/schemas.js';
import { listQuerySchema } from '#lib/schemas/common.js';

const R2_KEY = '550e8400-e29b-41d4-a716-446655440000.webp';
const R2_URL = `https://media-sb.raflisahrul.my.id/${R2_KEY}`;

describe('productCreateSchema', () => {
	it('mengisi nilai bawaan untuk kolom opsional', () => {
		expect(productCreateSchema.parse({ name: 'Pagar', price: '150000' })).toEqual({
			name: 'Pagar',
			price: 150000,
			category: '',
			description: '',
			image_url: '',
			isActive: true
		});
	});

	it('menerima key atau URL WebP dari R2', () => {
		const result = productCreateSchema.parse({
			name: 'Pagar',
			price: 1,
			image_url: R2_URL
		});
		expect(result.image_url).toBe(R2_URL);
		expect(
			productCreateSchema.parse({ name: 'Pagar', price: 1, image_url: R2_KEY }).image_url
		).toBe(R2_KEY);
	});

	it.each([
		'https://example.com/foto.jpg',
		'http://media-sb.raflisahrul.my.id/foto.webp',
		'https://media-sb.raflisahrul.my.id/foto.png',
		'javascript:alert(1)'
	])('menolak foto di luar key/URL R2 yang valid: %s', (image_url) => {
		expect(productCreateSchema.safeParse({ name: 'Pagar', price: 1, image_url }).success).toBe(
			false
		);
	});

	it('menolak harga kosong, negatif, dan pecahan', () => {
		for (const price of ['', -1, 1.5]) {
			expect(productCreateSchema.safeParse({ name: 'Pagar', price }).success).toBe(false);
		}
	});
});

describe('productUpdateSchema', () => {
	it('tanpa nilai bawaan, jadi kolom yang tidak dikirim tidak tertimpa', () => {
		expect(productUpdateSchema.parse({ name: 'Baru' })).toEqual({
			name: 'Baru'
		});
	});
});

describe('galleryCreateSchema', () => {
	it('mewajibkan foto', () => {
		expect(galleryCreateSchema.safeParse({ title: 'Pola', type: 'LC 071' }).success).toBe(false);
	});

	it('menerima data lengkap dan memangkas spasi', () => {
		const result = galleryCreateSchema.parse({
			title: '  Pola LC 071 ',
			type: 'LC 071',
			image_url: R2_URL
		});
		expect(result.title).toBe('Pola LC 071');
		expect(result.description).toBe('');
	});

	it('versi ubah boleh tanpa foto', () => {
		expect(galleryUpdateSchema.parse({ title: 'Judul baru' })).toEqual({
			title: 'Judul baru'
		});
	});
});

describe('listQuerySchema', () => {
	const schema = listQuerySchema(50);

	it('nilai bawaan jika tidak ada parameter', () => {
		expect(schema.parse({})).toEqual({ q: undefined, page: 1, limit: 50 });
	});

	it('halaman negatif atau huruf dikembalikan ke 1', () => {
		expect(schema.parse({ page: '-3' }).page).toBe(1);
		expect(schema.parse({ page: 'abc' }).page).toBe(1);
	});

	it('kata kunci lebih dari 100 huruf dipotong', () => {
		expect(schema.parse({ q: 'a'.repeat(150) }).q).toHaveLength(100);
	});
});
