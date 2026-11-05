import { z } from "zod";

import {
  optionalBlobImageUrl,
  optionalText,
  requiredText,
} from "@/lib/schemas/common";

const productFields = {
  name: requiredText("Nama produk", 120),
  category: optionalText("Kategori", 60),
  description: optionalText("Deskripsi", 2000),
  // Empty form inputs evaluate to undefined rather than 0.
  price: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce
      .number({ error: "Harga harus berupa angka." })
      .int("Harga harus bilangan bulat.")
      .min(0, "Harga tidak boleh negatif.")
      .max(1_000_000_000, "Harga terlalu besar."),
  ),
  image_url: optionalBlobImageUrl,
  isActive: z.boolean(),
};

/** Shared validation schema for admin form (client) and POST route (server). */
export const productCreateSchema = z.object({
  ...productFields,
  category: productFields.category.default(""),
  description: productFields.description.default(""),
  image_url: productFields.image_url.default(""),
  isActive: productFields.isActive.default(true),
});

/** PATCH schema: preserves omitted fields without overriding existing values. */
export const productUpdateSchema = z.object(productFields).partial();

export type ProductCreateInput = z.output<typeof productCreateSchema>;
export type ProductUpdateInput = z.output<typeof productUpdateSchema>;
export type ProductFormValues = z.input<typeof productCreateSchema>;

export interface ProductDto {
  _id: string;
  name: string;
  category: string;
  description: string;
  /** Rupiah, bilangan bulat. */
  price: number;
  image: { image_url: string };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
