import { z } from "zod";

import { blobImageUrl, optionalText, requiredText } from "@/lib/schemas/common";

const galleryFields = {
  title: requiredText("Judul", 120),
  type: requiredText("Jenis", 60),
  description: optionalText("Deskripsi", 1000),
  image_url: blobImageUrl,
};

/** Shared validation schema for admin form (client) and POST route (server). */
export const galleryCreateSchema = z.object({
  ...galleryFields,
  description: galleryFields.description.default(""),
});

/** PATCH schema: preserves omitted fields without applying defaults. */
export const galleryUpdateSchema = z.object(galleryFields).partial();

export type GalleryCreateInput = z.output<typeof galleryCreateSchema>;
export type GalleryUpdateInput = z.output<typeof galleryUpdateSchema>;
/** Nilai form (sebelum Zod mengisi nilai bawaan). */
export type GalleryFormValues = z.input<typeof galleryCreateSchema>;

export interface GalleryItemDto {
  _id: string;
  kind: "portfolio" | "pattern";
  title: string;
  type: string;
  description: string;
  image: { image_url: string };
  createdAt: string;
  updatedAt: string;
}
