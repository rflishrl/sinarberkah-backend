"use server";

import configPromise from "@payload-config";
import { getPayload } from "payload";
import { z } from "zod";

const leadSchema = z.object({
  nama: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Format alamat email tidak valid"),
  whatsapp: z
    .string()
    .regex(
      /^(?:\+62|62|0)8[1-9][0-9]{7,11}$/,
      "Nomor WhatsApp Indonesia tidak valid (contoh: 08123456789)",
    ),
  pesan: z.string().min(10, "Pesan pertanyaan minimal 10 karakter"),
  // Honeypot field: must remain empty; rejected if populated by bots
  website: z.string().max(0, "Bot terdeteksi"),
});

export type ActionState = {
  success?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

export async function submitContactLead(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const rawData = {
    nama: formData.get("nama"),
    email: formData.get("email"),
    whatsapp: formData.get("whatsapp"),
    pesan: formData.get("pesan"),
    website: formData.get("website") || "",
  };

  const parsed = leadSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      message: "Mohon lengkapi formulir dengan data yang valid.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const payload = await getPayload({ config: configPromise });

    // Relies on collection access rules (access.create allows public creation safely)
    await payload.create({
      collection: "leads",
      data: {
        nama: parsed.data.nama,
        email: parsed.data.email,
        whatsapp: parsed.data.whatsapp,
        pesan: parsed.data.pesan,
        status: "new",
        tanggalMasuk: new Date().toISOString(),
      },
    });

    return {
      success: true,
      message: "Terima kasih! Pesan dan permintaan Anda telah kami terima. Tim kami akan segera menghubungi via WhatsApp.",
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan server.";
    return {
      success: false,
      message: `Gagal mengirim pesan: ${message}`,
    };
  }
}
