import "@/lib/server-only";

import type { GalleryKind } from "@/features/gallery/config";
import type {
  GalleryCreateInput,
  GalleryItemDto,
  GalleryUpdateInput,
} from "@/features/gallery/schemas";
import { getDb } from "@/lib/db/client";

interface RawGalleryRow {
  id: string;
  kind: string;
  title: string;
  type: string;
  description: string;
  image_url: string;
  created_at: string | Date;
  updated_at: string | Date;
}

/**
 * Preserves `_id` and `image.image_url` shapes for backwards compatibility.
 */
function toDto(row: RawGalleryRow): GalleryItemDto {
  return {
    _id: row.id,
    kind: row.kind as GalleryKind,
    title: row.title,
    type: row.type,
    description: row.description,
    image: { image_url: row.image_url },
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export interface ListParams {
  q?: string;
  limit: number;
  offset: number;
}

export async function listGalleryItems(
  kind: GalleryKind,
  { q, limit, offset }: ListParams,
): Promise<{ items: GalleryItemDto[]; total: number }> {
  const sql = getDb();
  const searchPattern = q ? `%${q.trim()}%` : null;

  const countRows = await sql`
    SELECT COUNT(*)::int AS count
    FROM gallery_items
    WHERE kind = ${kind}
      AND (${!searchPattern} OR title ILIKE ${searchPattern} OR type ILIKE ${searchPattern})
  `;
  const total = Number(countRows[0]?.count || 0);

  const rows = await sql`
    SELECT id, kind, title, type, description, image_url, created_at, updated_at
    FROM gallery_items
    WHERE kind = ${kind}
      AND (${!searchPattern} OR title ILIKE ${searchPattern} OR type ILIKE ${searchPattern})
    ORDER BY created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

  return {
    items: (rows as unknown as RawGalleryRow[]).map(toDto),
    total,
  };
}

export async function countGalleryItems(kind: GalleryKind): Promise<number> {
  const sql = getDb();
  const rows =
    await sql`SELECT COUNT(*)::int AS count FROM gallery_items WHERE kind = ${kind}`;
  return Number(rows[0]?.count || 0);
}

export async function findGalleryItem(
  kind: GalleryKind,
  id: string,
): Promise<GalleryItemDto | null> {
  const sql = getDb();
  const rows = await sql`
    SELECT id, kind, title, type, description, image_url, created_at, updated_at
    FROM gallery_items
    WHERE id = ${id}::uuid AND kind = ${kind}
    LIMIT 1
  `;
  if (rows.length === 0) return null;
  return toDto(rows[0] as unknown as RawGalleryRow);
}

export async function insertGalleryItem(
  kind: GalleryKind,
  input: GalleryCreateInput,
): Promise<GalleryItemDto> {
  const sql = getDb();
  const rows = await sql`
    INSERT INTO gallery_items (
      kind, title, type, description, image_url
    ) VALUES (
      ${kind},
      ${input.title},
      ${input.type},
      ${input.description ?? ""},
      ${input.image_url}
    )
    RETURNING id, kind, title, type, description, image_url, created_at, updated_at
  `;
  return toDto(rows[0] as unknown as RawGalleryRow);
}

export async function updateGalleryItem(
  kind: GalleryKind,
  id: string,
  input: GalleryUpdateInput,
): Promise<{ item: GalleryItemDto; previousImageUrl: string } | null> {
  const sql = getDb();

  const existing =
    await sql`SELECT image_url FROM gallery_items WHERE id = ${id}::uuid AND kind = ${kind} LIMIT 1`;
  if (existing.length === 0) return null;
  const previousImageUrl = (existing[0] as { image_url: string }).image_url;

  const rows = await sql`
    UPDATE gallery_items
    SET
      title = COALESCE(${input.title ?? null}, title),
      type = COALESCE(${input.type ?? null}, type),
      description = COALESCE(${input.description ?? null}, description),
      image_url = COALESCE(${input.image_url ?? null}, image_url),
      updated_at = NOW()
    WHERE id = ${id}::uuid AND kind = ${kind}
    RETURNING id, kind, title, type, description, image_url, created_at, updated_at
  `;

  if (rows.length === 0) return null;
  return { item: toDto(rows[0] as unknown as RawGalleryRow), previousImageUrl };
}

export async function deleteGalleryItem(
  kind: GalleryKind,
  id: string,
): Promise<GalleryItemDto | null> {
  const sql = getDb();
  const rows = await sql`
    DELETE FROM gallery_items
    WHERE id = ${id}::uuid AND kind = ${kind}
    RETURNING id, kind, title, type, description, image_url, created_at, updated_at
  `;
  if (rows.length === 0) return null;
  return toDto(rows[0] as unknown as RawGalleryRow);
}
