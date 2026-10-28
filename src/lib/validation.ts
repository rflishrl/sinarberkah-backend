import { z } from "zod";

/** URL gambar: harus https. Untuk produk boleh kosong (tanpa gambar). */
const httpsUrl = z
  .url({ protocol: /^https$/, error: "Harus berupa URL https yang valid." })
  .max(2048);

const optionalHttpsUrl = z.union([z.literal(""), httpsUrl]);

const text = (label: string, max: number) =>
  z
    .string()
    .trim()
    .min(2, `${label} minimal 2 karakter.`)
    .max(max, `${label} maksimal ${max} karakter.`);

const productFields = {
  name: text("Nama produk", 120),
  category: z.string().trim().max(60, "Kategori maksimal 60 karakter."),
  description: z.string().trim().max(2000, "Deskripsi maksimal 2000 karakter."),
  price: z.coerce
    .number({ error: "Harga harus berupa angka." })
    .int("Harga harus bilangan bulat.")
    .min(0, "Harga tidak boleh negatif.")
    .max(1_000_000_000, "Harga terlalu besar."),
  image_url: optionalHttpsUrl,
  isActive: z.boolean(),
};

const galleryFields = {
  title: text("Judul", 120),
  type: text("Jenis", 60),
  description: z.string().trim().max(1000, "Deskripsi maksimal 1000 karakter."),
  image_url: httpsUrl,
};

/**
 * Skema "buat": kolom opsional punya nilai bawaan.
 * Skema "ubah" sengaja tanpa nilai bawaan, supaya kolom yang tidak dikirim tidak ikut tertimpa.
 */
export const productInput = z.object({
  ...productFields,
  category: productFields.category.default(""),
  description: productFields.description.default(""),
  image_url: productFields.image_url.default(""),
  isActive: productFields.isActive.default(true),
});
export const productUpdateInput = z.object(productFields).partial();

export const galleryInput = z.object({
  ...galleryFields,
  description: galleryFields.description.default(""),
});
export const galleryUpdateInput = z.object(galleryFields).partial();

export const loginInput = z.object({
  email: z.email("Email tidak valid."),
  password: z.string().min(1, "Password wajib diisi.").max(200),
});

export type ProductInput = z.output<typeof productInput>;
export type GalleryInput = z.output<typeof galleryInput>;
