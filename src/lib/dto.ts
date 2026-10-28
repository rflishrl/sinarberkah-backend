import type { GalleryItemRow, ProductRow } from "@/db/schema";
import type { GalleryItemDto, ProductDto } from "@/types";

/**
 * Mengubah baris database menjadi bentuk JSON yang dipakai API dan frontend.
 * Nama kolom `_id` dan `image.image_url` dipertahankan agar frontend lama tetap cocok.
 */
export function toProductDto(row: ProductRow): ProductDto {
  return {
    _id: row.id,
    name: row.name,
    category: row.category,
    description: row.description,
    price: row.price,
    image: { image_url: row.imageUrl },
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toGalleryItemDto(row: GalleryItemRow): GalleryItemDto {
  return {
    _id: row.id,
    kind: row.kind,
    title: row.title,
    type: row.type,
    description: row.description,
    image: { image_url: row.imageUrl },
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
