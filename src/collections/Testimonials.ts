import type { CollectionConfig } from "payload";

export const Testimonials: CollectionConfig = {
  slug: "testimonials",
  labels: {
    singular: "Testimoni",
    plural: "Testimoni",
  },
  admin: {
    useAsTitle: "namaKlien",
    defaultColumns: ["namaKlien", "perusahaanJabatan", "rating"],
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: "namaKlien",
      type: "text",
      label: "Nama Pelanggan / Klien",
      required: true,
    },
    {
      name: "perusahaanJabatan",
      type: "text",
      label: "Perusahaan atau Instansi / Jabatan",
    },
    {
      name: "ulasan",
      type: "textarea",
      label: "Isi Ulasan / Testimoni",
      required: true,
    },
    {
      name: "rating",
      type: "number",
      label: "Bintang Rating (1 - 5)",
      required: true,
      defaultValue: 5,
      min: 1,
      max: 5,
      admin: {
        step: 1,
      },
    },
    {
      name: "foto",
      type: "upload",
      relationTo: "media",
      label: "Foto Klien / Logo Perusahaan",
      required: false,
    },
  ],
};
