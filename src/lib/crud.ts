import type { ZodType } from "zod";

import { deleteImage } from "@/lib/blob";
import {
  HttpError,
  ok,
  publicGet,
  readJson,
  requireAdmin,
  route,
} from "@/lib/http";
import { isUuid } from "@/lib/ids";
import type { Repository } from "@/lib/repositories";
import { revalidateFrontend } from "@/lib/revalidate";

interface IdContext {
  params: Promise<{ id: string }>;
}

/** Bentuk minimal data yang dikelola: punya `_id` dan satu foto. */
interface ResourceDto {
  _id: string;
  image: { image_url: string };
}

interface ResourceConfig<TDto extends ResourceDto, TInput> {
  /** Nama untuk pesan error, mis. "Produk". */
  label: string;
  repository: Repository<TDto, TInput>;
  createSchema: ZodType<TInput>;
  updateSchema: ZodType<Partial<TInput>>;
  /** Hanya produk/data yang boleh dilihat publik (mis. produk aktif). */
  hasPublicFilter?: boolean;
  /** Tag cache di frontend yang dibuang saat data ini berubah. */
  revalidateTags: string[];
}

function clampInt(
  value: string | null,
  min: number,
  max: number,
  fallback: number,
) {
  const parsed = Number.parseInt(value ?? "", 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}

/**
 * Membuat satu set handler CRUD (list, create, get, update, remove) di atas sebuah repositori.
 * - Membaca (GET) terbuka untuk publik.
 * - Mengubah data (POST, PATCH, DELETE) hanya untuk admin yang sudah login.
 */
export function createResource<TDto extends ResourceDto, TInput>(
  config: ResourceConfig<TDto, TInput>,
) {
  const { repository } = config;
  const publicOnly = config.hasPublicFilter ?? false;
  const notFound = () => new HttpError(404, `${config.label} tidak ditemukan.`);

  /** Cek format id sebelum menyentuh database, supaya id ngawur langsung dijawab 404. */
  function assertValidId(id: string) {
    if (!isUuid(id)) throw notFound();
  }

  const list = route(async (request: Request) => {
    const params = new URL(request.url).searchParams;
    const limit = clampInt(params.get("limit"), 1, 100, 50);
    const page = clampInt(params.get("page"), 1, 10_000, 1);
    const q = params.get("q")?.trim().slice(0, 100) || undefined;

    const { items, total } = await repository.list({
      q,
      limit,
      offset: (page - 1) * limit,
      publicOnly,
    });

    return publicGet(
      request,
      ok(items, {
        meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
      }),
    );
  });

  const create = route(async (request: Request) => {
    await requireAdmin(request);
    const input = config.createSchema.parse(await readJson(request));
    const created = await repository.create(input);
    revalidateFrontend(config.revalidateTags);
    return ok(created, { status: 201 });
  });

  const get = route(async (request: Request, { params }: IdContext) => {
    const { id } = await params;
    assertValidId(id);
    const item = await repository.find(id, { publicOnly });
    if (!item) throw notFound();
    return publicGet(request, ok(item));
  });

  const update = route(async (request: Request, { params }: IdContext) => {
    await requireAdmin(request);
    const { id } = await params;
    assertValidId(id);
    const input = config.updateSchema.parse(await readJson(request));

    const result = await repository.update(id, input);
    if (!result) throw notFound();

    // Foto lama dihapus dari penyimpanan jika diganti.
    if (result.previous.image.image_url !== result.current.image.image_url) {
      await deleteImage(result.previous.image.image_url);
    }
    revalidateFrontend(config.revalidateTags);
    return ok(result.current);
  });

  const remove = route(async (request: Request, { params }: IdContext) => {
    await requireAdmin(request);
    const { id } = await params;
    assertValidId(id);

    const removed = await repository.remove(id);
    if (!removed) throw notFound();

    await deleteImage(removed.image.image_url);
    revalidateFrontend(config.revalidateTags);
    return ok({ _id: id });
  });

  return { list, create, get, update, remove };
}
