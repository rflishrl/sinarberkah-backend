import { z } from 'zod';

import { isAcceptedMediaInput } from '#lib/storage/media-key.js';

export const mediaImageUrl = z.string().trim().max(2048).refine(isAcceptedMediaInput, {
	error: 'Foto harus diunggah lewat tombol Pilih foto.'
});

export const optionalMediaImageUrl = z.union([z.literal(''), mediaImageUrl]);

export const requiredText = (label: string, max: number) =>
	z
		.string()
		.trim()
		.min(2, `${label} minimal 2 karakter.`)
		.max(max, `${label} maksimal ${max} karakter.`);

export const optionalText = (label: string, max: number) =>
	z.string().trim().max(max, `${label} maksimal ${max} karakter.`);

export function listQuerySchema(defaultLimit: number) {
	return z.object({
		q: z
			.string()
			.optional()
			.transform((value) => value?.trim().slice(0, 100) || undefined),
		page: z.coerce.number().int().min(1).max(10_000).catch(1),
		limit: z.coerce.number().int().min(1).max(100).catch(defaultLimit)
	});
}

export type ListQuery = z.output<ReturnType<typeof listQuerySchema>>;
