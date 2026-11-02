import "server-only";

import type { GalleryKind } from "@/features/gallery/config";
import type {
  GalleryCreateInput,
  GalleryItemDto,
  GalleryUpdateInput,
} from "@/features/gallery/schemas";
import { toAppError } from "@/lib/supabase/errors";
import type { AppSupabaseClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

type GalleryRow = Tables<"gallery_items">;

/**
 * Nama kolom `_id` dan `image.image_url` dipertahankan agar frontend lama tetap cocok.
 */
function toDto(row: GalleryRow): GalleryItemDto {
  return {
    _id: row.id,
    kind: row.kind,
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

/**
 * Daftar + jumlah total. Pencarian lewat RPC (parameter terikat, karakter LIKE diloloskan
 * di SQL), jadi kata kunci tidak pernah masuk ke string filter PostgREST.
 */
export async function listGalleryItems(
  supabase: AppSupabaseClient,
  kind: GalleryKind,
  { q, limit, offset }: ListParams,
): Promise<{ items: GalleryItemDto[]; total: number }> {
  const [rows, count] = await Promise.all([
    supabase.rpc("list_gallery_items", {
      p_kind: kind,
      p_q: q,
      p_limit: limit,
      p_offset: offset,
    }),
    supabase.rpc("count_gallery_items", { p_kind: kind, p_q: q }),
  ]);
  if (rows.error) throw toAppError(rows.error, "memuat galeri");
  if (count.error) throw toAppError(count.error, "menghitung galeri");
  return { items: rows.data.map(toDto), total: count.data };
}

export async function countGalleryItems(
  supabase: AppSupabaseClient,
  kind: GalleryKind,
): Promise<number> {
  const { data, error } = await supabase.rpc("count_gallery_items", {
    p_kind: kind,
  });
  if (error) throw toAppError(error, "menghitung galeri");
  return data;
}

export async function findGalleryItem(
  supabase: AppSupabaseClient,
  kind: GalleryKind,
  id: string,
): Promise<GalleryItemDto | null> {
  const { data, error } = await supabase
    .from("gallery_items")
    .select("*")
    .eq("id", id)
    .eq("kind", kind)
    .maybeSingle();
  if (error) throw toAppError(error, "memuat data");
  return data ? toDto(data) : null;
}

export async function insertGalleryItem(
  supabase: AppSupabaseClient,
  kind: GalleryKind,
  input: GalleryCreateInput,
): Promise<GalleryItemDto> {
  const { data, error } = await supabase
    .from("gallery_items")
    .insert({
      kind,
      title: input.title,
      type: input.type,
      description: input.description,
      image_url: input.image_url,
    })
    .select("*")
    .single();
  if (error) throw toAppError(error, "menyimpan data");
  return toDto(data);
}

/**
 * Mengubah satu item (baris dikunci di database). Mengembalikan data baru dan URL foto
 * sebelumnya, atau `null` jika id tidak ada.
 */
export async function updateGalleryItem(
  supabase: AppSupabaseClient,
  kind: GalleryKind,
  id: string,
  input: GalleryUpdateInput,
): Promise<{ item: GalleryItemDto; previousImageUrl: string } | null> {
  const { data, error } = await supabase
    .rpc("update_gallery_item", { p_id: id, p_kind: kind, p_patch: input })
    .maybeSingle();
  if (error) throw toAppError(error, "menyimpan perubahan");
  if (!data) return null;

  const { previous_image_url: previousImageUrl, ...row } = data;
  return { item: toDto(row), previousImageUrl };
}

/** Menghapus satu item. Mengembalikan data yang dihapus, atau `null` jika id tidak ada. */
export async function deleteGalleryItem(
  supabase: AppSupabaseClient,
  kind: GalleryKind,
  id: string,
): Promise<GalleryItemDto | null> {
  const { data, error } = await supabase
    .from("gallery_items")
    .delete()
    .eq("id", id)
    .eq("kind", kind)
    .select("*")
    .maybeSingle();
  if (error) throw toAppError(error, "menghapus data");
  return data ? toDto(data) : null;
}
