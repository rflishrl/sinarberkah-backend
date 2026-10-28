import { after } from "next/server";

/**
 * Memberi tahu frontend bahwa data berubah, supaya cache-nya dibuang dan perubahan
 * tampil langsung. Dijalankan setelah respons dikirim, jadi admin tidak menunggu.
 *
 * Butuh `FRONTEND_URL` dan `REVALIDATE_SECRET`. Jika salah satunya kosong, fungsi ini
 * tidak melakukan apa-apa dan frontend memperbarui datanya saat cache 1 jam habis.
 * Kegagalan hanya dicatat di log dan tidak menggagalkan penyimpanan data.
 */
export function revalidateFrontend(tags: string[]) {
  const baseUrl = process.env.FRONTEND_URL?.replace(/\/$/, "");
  const secret = process.env.REVALIDATE_SECRET;
  if (!baseUrl || !secret) return;

  after(async () => {
    try {
      const response = await fetch(`${baseUrl}/api/revalidate`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${secret}`,
        },
        body: JSON.stringify({ tags }),
        signal: AbortSignal.timeout(5_000),
      });
      if (!response.ok) {
        console.error(
          `[revalidate] Frontend menjawab HTTP ${response.status}.`,
        );
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      console.error(`[revalidate] Gagal menghubungi frontend: ${reason}`);
    }
  });
}
