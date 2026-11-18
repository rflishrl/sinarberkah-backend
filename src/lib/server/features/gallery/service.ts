import { type Paginated, paginate } from '#lib/api/types.js';
import {
	ADMIN_PAGE_SIZE,
	GALLERY_CONFIG,
	type GalleryKind,
	PUBLIC_PAGE_SIZE
} from '#lib/features/gallery/config.js';
import {
	type GalleryItemDto,
	galleryCreateSchema,
	galleryUpdateSchema
} from '#lib/features/gallery/schemas.js';
import { listQuerySchema } from '#lib/schemas/common.js';
import { comparableMediaRef } from '#lib/storage/media-key.js';
import { notFound } from '#lib/server/api/errors.js';
import type { Actor } from '#lib/server/auth/actor.js';
import { assertAdmin } from '#lib/server/auth/authorize.js';
import {
	deleteGalleryItem,
	findGalleryItem,
	insertGalleryItem,
	listGalleryItems,
	updateGalleryItem
} from '#lib/server/features/gallery/repository.js';
import { deleteStoredMedia } from '#lib/server/features/uploads/media-storage.js';
import { isUuid } from '#lib/server/ids.js';
import { revalidateFrontend } from '#lib/server/revalidate.js';
import { normalizeMediaInputForStorage } from '#lib/server/storage/media-url.js';

type Viewer = { audience: 'public' } | { audience: 'admin'; actor: Actor | null };

async function list(
	kind: GalleryKind,
	rawQuery: unknown,
	defaultLimit: number
): Promise<Paginated<GalleryItemDto>> {
	const { q, page, limit } = listQuerySchema(defaultLimit).parse(rawQuery);
	const { items, total } = await listGalleryItems(kind, {
		q,
		limit,
		offset: (page - 1) * limit
	});
	return paginate(items, total, page, limit);
}

/** Gallery listing. Public: 50 items/page. Admin: 10 items/page with auth check. */
export async function listGallery(
	viewer: Viewer,
	kind: GalleryKind,
	rawQuery: unknown
): Promise<Paginated<GalleryItemDto>> {
	if (viewer.audience === 'admin') {
		assertAdmin(viewer.actor);
		return list(kind, rawQuery, ADMIN_PAGE_SIZE);
	}
	return list(kind, rawQuery, PUBLIC_PAGE_SIZE);
}

export async function getGalleryItem(
	viewer: Viewer,
	kind: GalleryKind,
	id: string
): Promise<GalleryItemDto> {
	if (viewer.audience === 'admin') assertAdmin(viewer.actor);
	const item = isUuid(id) ? await findGalleryItem(kind, id) : null;
	if (!item) throw notFound(GALLERY_CONFIG[kind].label);
	return item;
}

export async function createGallery(
	actor: Actor | null,
	kind: GalleryKind,
	rawInput: unknown
): Promise<GalleryItemDto> {
	assertAdmin(actor);
	const parsed = galleryCreateSchema.parse(rawInput);
	const input = {
		...parsed,
		image_url: normalizeMediaInputForStorage(parsed.image_url)
	};
	const created = await insertGalleryItem(kind, input);
	revalidateFrontend([...GALLERY_CONFIG[kind].revalidateTags]);
	return created;
}

export async function updateGallery(
	actor: Actor | null,
	kind: GalleryKind,
	id: string,
	rawInput: unknown
): Promise<GalleryItemDto> {
	assertAdmin(actor);
	const parsed = galleryUpdateSchema.parse(rawInput);
	if (!isUuid(id)) throw notFound(GALLERY_CONFIG[kind].label);

	if (Object.keys(parsed).length === 0) {
		return getGalleryItem({ audience: 'admin', actor }, kind, id);
	}

	const input =
		parsed.image_url !== undefined
			? {
					...parsed,
					image_url: normalizeMediaInputForStorage(parsed.image_url)
				}
			: parsed;

	const result = await updateGalleryItem(kind, id, input);
	if (!result) throw notFound(GALLERY_CONFIG[kind].label);

	if (
		comparableMediaRef(result.previousImageUrl) !== comparableMediaRef(result.item.image.image_url)
	) {
		await deleteStoredMedia(result.previousImageUrl);
	}
	revalidateFrontend([...GALLERY_CONFIG[kind].revalidateTags]);
	return result.item;
}

export async function deleteGallery(
	actor: Actor | null,
	kind: GalleryKind,
	id: string
): Promise<GalleryItemDto> {
	assertAdmin(actor);
	if (!isUuid(id)) throw notFound(GALLERY_CONFIG[kind].label);

	const deleted = await deleteGalleryItem(kind, id);
	if (!deleted) throw notFound(GALLERY_CONFIG[kind].label);

	await deleteStoredMedia(deleted.image.image_url);
	revalidateFrontend([...GALLERY_CONFIG[kind].revalidateTags]);
	return deleted;
}
