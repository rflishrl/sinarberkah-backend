import { ok, publicGet, route } from "@/lib/http";

// Frontend sudah memanggil alamat ini. Fitur artikel belum dibuat, jadi daftarnya kosong.
export const GET = route(async (request: Request) =>
  publicGet(
    request,
    ok([], { meta: { total: 0, page: 1, limit: 50, totalPages: 0 } }),
  ),
);
