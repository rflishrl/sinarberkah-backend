import type { CollectionConfig } from "payload";
import { formatSlug } from "../utilities/formatSlug";

export const Products: CollectionConfig = {
  slug: "products",
  labels: {
    singular: "Produk",
    plural: "Produk",
  },
  admin: {
    useAsTitle: "nama",
    defaultColumns: ["nama", "harga", "stok", "featured"],
  },
  access: {
    read: () => true, // Publik dapat melihat katalog produk
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: "nama",
      type: "text",
      label: "Nama Produk",
      required: true,
    },
    {
      name: "slug",
      type: "text",
      label: "Tautan URL (Slug)",
      required: true,
      unique: true,
      index: true,
      admin: {
        position: "sidebar",
      },
      hooks: {
        beforeValidate: [formatSlug("nama")],
      },
    },
    {
      name: "kategori",
      type: "relationship",
      relationTo: "categories",
      label: "Kategori Produk",
      required: true,
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "harga",
      type: "number",
      label: "Harga Satuan (Rp / Rupiah)",
      required: true,
      min: 0,
      admin: {
        step: 500,
        description: "Masukkan nominal harga dalam Rupiah tanpa titik",
      },
    },
    {
      name: "stok",
      type: "number",
      label: "Jumlah Stok Tersedia",
      required: true,
      defaultValue: 0,
      min: 0,
      admin: {
        position: "sidebar",
        step: 1,
      },
    },
    {
      name: "featured",
      type: "checkbox",
      label: "Produk Unggulan (Featured)",
      defaultValue: false,
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "gambar",
      type: "array",
      label: "Galeri Foto Produk",
      minRows: 1,
      required: true,
      labels: {
        singular: "Foto",
        plural: "Foto-Foto",
      },
      fields: [
        {
          name: "foto",
          type: "upload",
          relationTo: "media",
          label: "Foto Produk",
          required: true,
        },
      ],
    },
    {
      name: "deskripsi",
      type: "richText",
      label: "Deskripsi Lengkap Produk",
      required: true,
    },
  ],
};
