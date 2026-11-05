import type { CollectionConfig } from "payload";

export const Leads: CollectionConfig = {
  slug: "leads",
  labels: {
    singular: "Pesan Kontak (Lead)",
    plural: "Pesan Masuk (Leads)",
  },
  admin: {
    useAsTitle: "nama",
    defaultColumns: ["nama", "whatsapp", "status", "tanggalMasuk"],
  },
  access: {
    // Public submission permitted for contact forms
    create: () => true,
    // Access restricted to authenticated users
    read: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: "nama",
      type: "text",
      label: "Nama Pengirim",
      required: true,
    },
    {
      name: "email",
      type: "email",
      label: "Alamat Email",
      required: true,
    },
    {
      name: "whatsapp",
      type: "text",
      label: "Nomor WhatsApp",
      required: true,
    },
    {
      name: "pesan",
      type: "textarea",
      label: "Isi Pesan / Kebutuhan Pesanan",
      required: true,
    },
    {
      name: "status",
      type: "select",
      label: "Status Tindak Lanjut",
      required: true,
      defaultValue: "new",
      options: [
        { label: "Pesan Baru", value: "new" },
        { label: "Sudah Dihubungi", value: "contacted" },
      ],
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "tanggalMasuk",
      type: "date",
      label: "Waktu Pengiriman",
      required: true,
      defaultValue: () => new Date().toISOString(),
      admin: {
        position: "sidebar",
        readOnly: true,
      },
    },
  ],
};
