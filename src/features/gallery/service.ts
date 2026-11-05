import "server-only";

import {
  ADMIN_PAGE_SIZE,
  GALLERY_CONFIG,
  PUBLIC_PAGE_SIZE,
  type GalleryKind,
} from "@/features/gallery/config";
import {
  deleteGalleryItem,
  findGalleryItem,
  insertGalleryItem,
  listGalleryItems,
  updateGalleryItem,
} from "@/features/gallery/repository";
import {
  galleryCreateSchema,
  galleryUpdateSchema,
  type GalleryItemDto,
} from "@/features/gallery/schemas";
import { notFound } from "@/lib/api/errors";
import { paginate, type Paginated } from "@/lib/api/types";
import type { Actor } from "@/lib/auth/actor";
import { assertAdmin } from "@/lib/auth/authorize";
import { isUuid } from "@/lib/ids";
import { revalidateFrontend } from "@/lib/revalidate";
import { listQuerySchema } from "@/lib/schemas/common";
import { deleteImage } from "@/lib/storage/blob";
import type { AppSupabaseClient } from "@/lib/supabase/server";

type Viewer =
  { audience: "public" } | { audience: "admin"; actor: Actor | null };

async function list(
  supabase: AppSupabaseClient,
  kind: GalleryKind,
  rawQuery: unknown,
  defaultLimit: number,
): Promise<Paginated<GalleryItemDto>> {
  const { q, page, limit } = listQuerySchema(defaultLimit).parse(rawQuery);
  const { items, total } = await listGalleryItems(supabase, kind, {
    q,
    limit,
    offset: (page - 1) * limit,
  });
  return paginate(items, total, page, limit);
}

/** Gallery listing. Public: 50 items/page. Admin: 10 items/page with auth check. */
export async function listGallery(
  supabase: AppSupabaseClient,
  viewer: Viewer,
  kind: GalleryKind,
  rawQuery: unknown,
): Promise<Paginated<GalleryItemDto>> {
  if (viewer.audience === "admin") {
    assertAdmin(viewer.actor);
    return list(supabase, kind, rawQuery, ADMIN_PAGE_SIZE);
  }
  return list(supabase, kind, rawQuery, PUBLIC_PAGE_SIZE);
}

export async function getGalleryItem(
  supabase: AppSupabaseClient,
  viewer: Viewer,
  kind: GalleryKind,
  id: string,
): Promise<GalleryItemDto> {
  if (viewer.audience === "admin") assertAdmin(viewer.actor);
  // Non-UUID IDs fail fast as 404 without querying the database.
  const item = isUuid(id) ? await findGalleryItem(supabase, kind, id) : null;
  if (!item) throw notFound(GALLERY_CONFIG[kind].label);
  return item;
}

export async function createGallery(
  supabase: AppSupabaseClient,
  actor: Actor | null,
  kind: GalleryKind,
  rawInput: unknown,
): Promise<GalleryItemDto> {
  assertAdmin(actor);
  const input = galleryCreateSchema.parse(rawInput);
  const created = await insertGalleryItem(supabase, kind, input);
  revalidateFrontend(GALLERY_CONFIG[kind].revalidateTags);
  return created;
}

export async function updateGallery(
  supabase: AppSupabaseClient,
  actor: Actor | null,
  kind: GalleryKind,
  id: string,
  rawInput: unknown,
): Promise<GalleryItemDto> {
  assertAdmin(actor);
  const input = galleryUpdateSchema.parse(rawInput);
  if (!isUuid(id)) throw notFound(GALLERY_CONFIG[kind].label);

  if (Object.keys(input).length === 0) {
    // No fields changed: return existing record.
    return getGalleryItem(supabase, { audience: "admin", actor }, kind, id);
  }

  const result = await updateGalleryItem(supabase, kind, id, input);
  if (!result) throw notFound(GALLERY_CONFIG[kind].label);

  // Delete replaced photo from storage.
  if (result.previousImageUrl !== result.item.image.image_url) {
    await deleteImage(result.previousImageUrl);
  }
  revalidateFrontend(GALLERY_CONFIG[kind].revalidateTags);
  return result.item;
}

export async function deleteGallery(
  supabase: AppSupabaseClient,
  actor: Actor | null,
  kind: GalleryKind,
  id: string,
): Promise<{ _id: string }> {
  assertAdmin(actor);
  const removed = isUuid(id)
    ? await deleteGalleryItem(supabase, kind, id)
    : null;
  if (!removed) throw notFound(GALLERY_CONFIG[kind].label);

  await deleteImage(removed.image.image_url);
  revalidateFrontend(GALLERY_CONFIG[kind].revalidateTags);
  return { _id: id };
}
