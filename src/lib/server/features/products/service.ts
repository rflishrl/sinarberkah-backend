import { type Paginated, paginate } from '#lib/api/types.js';
import {
	type ProductDto,
	productCreateSchema,
	productUpdateSchema
} from '#lib/features/products/schemas.js';
import { listQuerySchema } from '#lib/schemas/common.js';
import { comparableMediaRef } from '#lib/storage/media-key.js';
import { notFound } from '#lib/server/api/errors.js';
import type { Actor } from '#lib/server/auth/actor.js';
import { assertAdmin } from '#lib/server/auth/authorize.js';
import {
	deleteProduct,
	findProduct,
	insertProduct,
	listProducts,
	updateProduct
} from '#lib/server/features/products/repository.js';
import { deleteStoredMedia } from '#lib/server/features/uploads/media-storage.js';
import { isUuid } from '#lib/server/ids.js';
import { revalidateFrontend } from '#lib/server/revalidate.js';
import { normalizeMediaInputForStorage } from '#lib/server/storage/media-url.js';

const LABEL = 'Produk';
const REVALIDATE_TAGS = ['products'];

type Viewer = { audience: 'public' } | { audience: 'admin'; actor: Actor | null };

/** Public: active products only, 50/page. Admin: all products, 10/page. */
export async function listProductsFor(
	viewer: Viewer,
	rawQuery: unknown
): Promise<Paginated<ProductDto>> {
	const isAdmin = viewer.audience === 'admin';
	if (isAdmin) assertAdmin(viewer.actor);

	const { q, page, limit } = listQuerySchema(isAdmin ? 10 : 50).parse(rawQuery);
	const { items, total } = await listProducts({
		q,
		limit,
		offset: (page - 1) * limit,
		activeOnly: !isAdmin
	});
	return paginate(items, total, page, limit);
}

export async function getProduct(viewer: Viewer, id: string): Promise<ProductDto> {
	const isAdmin = viewer.audience === 'admin';
	if (isAdmin) assertAdmin(viewer.actor);

	const product = isUuid(id) ? await findProduct(id, { activeOnly: !isAdmin }) : null;
	if (!product) throw notFound(LABEL);
	return product;
}

export async function createProduct(actor: Actor | null, rawInput: unknown): Promise<ProductDto> {
	assertAdmin(actor);
	const parsed = productCreateSchema.parse(rawInput);
	const input = {
		...parsed,
		image_url: normalizeMediaInputForStorage(parsed.image_url)
	};
	const created = await insertProduct(input);
	revalidateFrontend(REVALIDATE_TAGS);
	return created;
}

export async function updateProductById(
	actor: Actor | null,
	id: string,
	rawInput: unknown
): Promise<ProductDto> {
	assertAdmin(actor);
	const parsed = productUpdateSchema.parse(rawInput);
	if (!isUuid(id)) throw notFound(LABEL);

	if (Object.keys(parsed).length === 0) {
		return getProduct({ audience: 'admin', actor }, id);
	}

	const input =
		parsed.image_url !== undefined
			? {
					...parsed,
					image_url: normalizeMediaInputForStorage(parsed.image_url)
				}
			: parsed;

	const result = await updateProduct(id, input);
	if (!result) throw notFound(LABEL);

	if (
		comparableMediaRef(result.previousImageUrl) !== comparableMediaRef(result.item.image.image_url)
	) {
		await deleteStoredMedia(result.previousImageUrl);
	}
	revalidateFrontend(REVALIDATE_TAGS);
	return result.item;
}

export async function deleteProductById(actor: Actor | null, id: string): Promise<ProductDto> {
	assertAdmin(actor);
	if (!isUuid(id)) throw notFound(LABEL);

	const deleted = await deleteProduct(id);
	if (!deleted) throw notFound(LABEL);

	await deleteStoredMedia(deleted.image.image_url);
	revalidateFrontend(REVALIDATE_TAGS);
	return deleted;
}
