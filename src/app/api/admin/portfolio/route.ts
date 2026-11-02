import { createGallery, listGallery } from "@/features/gallery/service";
import { parseQuery, readJson } from "@/lib/api/request";
import { withApi } from "@/lib/api/with-api";
import { listQuerySchema } from "@/lib/schemas/common";

export const maxDuration = 10;

/** Admin: daftar portofolio (10 per halaman). */
export const GET = withApi(
  { access: "admin" },
  async ({ request, supabase, actor }) => ({
    data: await listGallery(
      supabase,
      { audience: "admin", actor },
      "portfolio",
      parseQuery(request, listQuerySchema(10)),
    ),
  }),
);

/** Admin: tambah proyek portofolio. */
export const POST = withApi(
  { access: "admin" },
  async ({ request, supabase, actor }) => ({
    data: await createGallery(
      supabase,
      actor,
      "portfolio",
      await readJson(request),
    ),
    status: 201,
  }),
);
