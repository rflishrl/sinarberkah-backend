import "server-only";

import {
  ADMIN_PAGE_SIZE,
  GALLERY_CONFIG,
  type GalleryKind,
  PUBLIC_PAGE_SIZE,
} from "@/features/gallery/config";
import {
  deleteGalleryItem,
  findGalleryItem,
  insertGalleryItem,
  listGalleryItems,
  updateGalleryItem,
} from "@/features/gallery/repository";
import {
  type GalleryItemDto,
  galleryCreateSchema,
  galleryUpdateSchema,
} from "@/features/gallery/schemas";
import { notFound } from "@/lib/api/errors";
import { type Paginated, paginate } from "@/lib/api/types";
import type { Actor } from "@/lib/auth/actor";
import { assertAdmin } from "@/lib/auth/authorize";
import { isUuid } from "@/lib/ids";
import { revalidateFrontend } from "@/lib/revalidate";
import { listQuerySchema } from "@/lib/schemas/common";
import { deleteImage } from "@/lib/storage/blob";

type Viewer =
  | { audience: "public" }
  | { audience: "admin"; actor: Actor | null };

async function list(
  kind: GalleryKind,
  rawQuery: unknown,
  defaultLimit: number,
): Promise<Paginated<GalleryItemDto>> {
  const { q, page, limit } = listQuerySchema(defaultLimit).parse(rawQuery);
  const { items, total } = await listGalleryItems(kind, {
    q,
    limit,
    offset: (page - 1) * limit,
  });
  return paginate(items, total, page, limit);
}

/** Gallery listing. Public: 50 items/page. Admin: 10 items/page with auth check. */
export async function listGallery(
  viewer: Viewer,
  kind: GalleryKind,
  rawQuery: unknown,
): Promise<Paginated<GalleryItemDto>> {
  if (viewer.audience === "admin") {
    assertAdmin(viewer.actor);
    return list(kind, rawQuery, ADMIN_PAGE_SIZE);
  }
  return list(kind, rawQuery, PUBLIC_PAGE_SIZE);
}

export async function getGalleryItem(
  viewer: Viewer,
  kind: GalleryKind,
  id: string,
): Promise<GalleryItemDto> {
  if (viewer.audience === "admin") assertAdmin(viewer.actor);
  const item = isUuid(id) ? await findGalleryItem(kind, id) : null;
  if (!item) throw notFound(GALLERY_CONFIG[kind].label);
  return item;
}

export async function createGallery(
  actor: Actor | null,
  kind: GalleryKind,
  rawInput: unknown,
): Promise<GalleryItemDto> {
  assertAdmin(actor);
  const input = galleryCreateSchema.parse(rawInput);
  const created = await insertGalleryItem(kind, input);
  revalidateFrontend(GALLERY_CONFIG[kind].revalidateTags);
  return created;
}

export async function updateGallery(
  actor: Actor | null,
  kind: GalleryKind,
  id: string,
  rawInput: unknown,
): Promise<GalleryItemDto> {
  assertAdmin(actor);
  const input = galleryUpdateSchema.parse(rawInput);
  if (!isUuid(id)) throw notFound(GALLERY_CONFIG[kind].label);

  if (Object.keys(input).length === 0) {
    return getGalleryItem({ audience: "admin", actor }, kind, id);
  }

  const result = await updateGalleryItem(kind, id, input);
  if (!result) throw notFound(GALLERY_CONFIG[kind].label);

  if (result.previousImageUrl !== result.item.image.image_url) {
    await deleteImage(result.previousImageUrl);
  }
  revalidateFrontend(GALLERY_CONFIG[kind].revalidateTags);
  return result.item;
}

export async function deleteGallery(
  actor: Actor | null,
  kind: GalleryKind,
  id: string,
): Promise<GalleryItemDto> {
  assertAdmin(actor);
  if (!isUuid(id)) throw notFound(GALLERY_CONFIG[kind].label);

  const deleted = await deleteGalleryItem(kind, id);
  if (!deleted) throw notFound(GALLERY_CONFIG[kind].label);

  await deleteImage(deleted.image.image_url);
  revalidateFrontend(GALLERY_CONFIG[kind].revalidateTags);
  return deleted;
}
