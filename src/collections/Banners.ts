import type { CollectionConfig } from "payload";

export const Banners: CollectionConfig = {
  slug: "banners",
  labels: {
    singular: "Banner Promosi",
    plural: "Banner Promosi",
  },
  admin: {
    useAsTitle: "judul",
    defaultColumns: ["judul", "urutan", "aktif"],
  },
  access: {
    read: ({ req: { user } }) => {
      if (user) return true;
      return {
        aktif: {
          equals: true,
        },
      };
    },
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: "judul",
      type: "text",
      label: "Judul Utama Banner",
      required: true,
    },
    {
      name: "subjudul",
      type: "text",
      label: "Subjudul / Tagline",
    },
    {
      name: "gambarHero",
      type: "upload",
      relationTo: "media",
      label: "Gambar Hero Banner",
      required: true,
    },
    {
      name: "teksCta",
      type: "text",
      label: "Teks Tombol CTA (contoh: Belanja Sekarang)",
    },
    {
      name: "linkCta",
      type: "text",
      label: "Tautan URL Tombol CTA",
    },
    {
      name: "urutan",
      type: "number",
      label: "Urutan Tampil",
      defaultValue: 0,
      admin: {
        position: "sidebar",
        step: 1,
      },
    },
    {
      name: "aktif",
      type: "checkbox",
      label: "Status Aktif (Tampilkan di Beranda)",
      defaultValue: true,
      admin: {
        position: "sidebar",
      },
    },
  ],
};
