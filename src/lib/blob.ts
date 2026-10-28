import { del, put } from "@vercel/blob";

import { HttpError } from "@/lib/http";

const MAX_BYTES = 4 * 1024 * 1024; // Vercel membatasi body fungsi ±4,5 MB.

const SIGNATURES: Record<
  string,
  { extension: string; test: (b: Uint8Array) => boolean }
> = {
  "image/jpeg": {
    extension: "jpg",
    test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  "image/png": {
    extension: "png",
    test: (b) =>
      b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  },
  "image/webp": {
    extension: "webp",
    // "RIFF....WEBP"
    test: (b) =>
      b[0] === 0x52 &&
      b[1] === 0x49 &&
      b[2] === 0x46 &&
      b[3] === 0x46 &&
      b[8] === 0x57 &&
      b[9] === 0x45 &&
      b[10] === 0x42 &&
      b[11] === 0x50,
  },
};

export const ACCEPTED_IMAGE_TYPES = Object.keys(SIGNATURES);
export const MAX_UPLOAD_MB = MAX_BYTES / (1024 * 1024);

/** Memvalidasi file gambar (tipe, ukuran, dan isi file) lalu menyimpannya ke Vercel Blob. */
export async function uploadImage(file: File, folder: string): Promise<string> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new HttpError(
      503,
      "Penyimpanan foto belum dikonfigurasi (BLOB_READ_WRITE_TOKEN).",
    );
  }

  const rule = SIGNATURES[file.type];
  if (!rule) {
    throw new HttpError(415, "Format foto harus JPG, PNG, atau WebP.");
  }
  if (file.size === 0 || file.size > MAX_BYTES) {
    throw new HttpError(413, `Ukuran foto maksimal ${MAX_UPLOAD_MB} MB.`);
  }

  const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (!rule.test(header)) {
    throw new HttpError(415, "Isi file tidak cocok dengan format fotonya.");
  }

  const blob = await put(`${folder}/photo.${rule.extension}`, file, {
    access: "public",
    addRandomSuffix: true,
    contentType: file.type,
  });
  return blob.url;
}

function isBlobUrl(url: string): boolean {
  try {
    return new URL(url).hostname.endsWith(".blob.vercel-storage.com");
  } catch {
    return false;
  }
}

/** Menghapus foto lama dari Blob. Gagal menghapus tidak boleh membatalkan operasi utama. */
export async function deleteImage(url: string | undefined): Promise<void> {
  if (!url || !isBlobUrl(url) || !process.env.BLOB_READ_WRITE_TOKEN) return;
  try {
    await del(url);
  } catch (error) {
    console.error("[blob] Gagal menghapus foto lama:", error);
  }
}
