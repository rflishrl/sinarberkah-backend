import type { CollectionConfig } from "payload";
import { formatSlug } from "../utilities/formatSlug";

export const Categories: CollectionConfig = {
  slug: "categories",
  labels: {
    singular: "Kategori Produk",
    plural: "Kategori Produk",
  },
  admin: {
    useAsTitle: "nama",
    defaultColumns: ["nama", "slug"],
  },
  access: {
    read: () => true, // Publik dapat melihat kategori
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: "nama",
      type: "text",
      label: "Nama Kategori",
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
  ],
};
