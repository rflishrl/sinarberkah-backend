import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import type { Repository } from "@/lib/repositories";

const getSession = vi.fn();
const deleteImage = vi.fn();
const revalidateFrontend = vi.fn();

vi.mock("@/lib/auth", () => ({ getSession: () => getSession() }));
vi.mock("@/lib/blob", () => ({
  deleteImage: (url: string) => deleteImage(url),
}));
vi.mock("@/lib/revalidate", () => ({
  revalidateFrontend: (tags: string[]) => revalidateFrontend(tags),
}));

const { createResource } = await import("@/lib/crud");

interface Item {
  _id: string;
  title: string;
  image: { image_url: string };
}
type Input = { title: string; image_url: string };

const ID = "0b6c1c0e-5c0a-4a53-9d6e-2f4f6f0a1b2c";
const OLD_PHOTO = "https://a.public.blob.vercel-storage.com/lama.jpg";
const NEW_PHOTO = "https://a.public.blob.vercel-storage.com/baru.jpg";
const stored: Item = {
  _id: ID,
  title: "Lama",
  image: { image_url: OLD_PHOTO },
};

const repository = {
  list: vi.fn(),
  find: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
} satisfies Repository<Item, Input>;

const inputSchema = z.object({
  title: z.string().min(2),
  image_url: z.string(),
});

const resource = createResource<Item, Input>({
  label: "Item",
  repository,
  createSchema: inputSchema,
  updateSchema: inputSchema.partial(),
  revalidateTags: ["gallery"],
});

const BASE = "http://localhost:4000/api/items";
const params = (id: string) => ({ params: Promise.resolve({ id }) });

function request(
  method: string,
  { url = BASE, body, origin = "http://localhost:4000" } = {} as {
    url?: string;
    body?: unknown;
    origin?: string | null;
  },
) {
  const headers = new Headers({ host: "localhost:4000" });
  if (origin) headers.set("origin", origin);
  if (body !== undefined) headers.set("content-type", "application/json");
  return new Request(url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  getSession.mockResolvedValue({ email: "admin@sinarberkah.com" });
});

describe("list (publik)", () => {
  it("membatasi limit dan mengembalikan meta halaman", async () => {
    repository.list.mockResolvedValue({ items: [stored], total: 250 });
    getSession.mockResolvedValue(null);

    const response = await resource.list(
      request("GET", { url: `${BASE}?limit=999&page=2&q=%20pola%20` }),
    );

    expect(response.status).toBe(200);
    expect(repository.list).toHaveBeenCalledWith({
      q: "pola",
      limit: 100,
      offset: 100,
      publicOnly: false,
    });
    await expect(response.json()).resolves.toMatchObject({
      meta: { total: 250, page: 2, limit: 100, totalPages: 3 },
    });
  });
});

describe("create (admin)", () => {
  it("401 jika belum login", async () => {
    getSession.mockResolvedValue(null);
    const response = await resource.create(
      request("POST", { body: { title: "Baru", image_url: NEW_PHOTO } }),
    );
    expect(response.status).toBe(401);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it("403 jika permintaan datang dari situs lain (CSRF)", async () => {
    const response = await resource.create(
      request("POST", {
        body: { title: "Baru", image_url: NEW_PHOTO },
        origin: "https://jahat.example",
      }),
    );
    expect(response.status).toBe(403);
  });

  it("422 dengan pesan per kolom jika data tidak valid", async () => {
    const response = await resource.create(
      request("POST", { body: { title: "x", image_url: NEW_PHOTO } }),
    );
    expect(response.status).toBe(422);
    const body = await response.json();
    expect(body.error.details.fieldErrors.title).toBeDefined();
  });

  it("400 jika body bukan JSON", async () => {
    const response = await resource.create(
      new Request(BASE, {
        method: "POST",
        headers: { host: "localhost:4000", origin: "http://localhost:4000" },
        body: "{rusak",
      }),
    );
    expect(response.status).toBe(400);
  });

  it("201 dan membuang cache frontend jika berhasil", async () => {
    repository.create.mockResolvedValue(stored);
    const response = await resource.create(
      request("POST", { body: { title: "Baru", image_url: NEW_PHOTO } }),
    );
    expect(response.status).toBe(201);
    expect(revalidateFrontend).toHaveBeenCalledWith(["gallery"]);
  });
});

describe("get / update / remove", () => {
  it("id bukan UUID langsung 404 tanpa menyentuh database", async () => {
    const response = await resource.get(request("GET"), params("abc"));
    expect(response.status).toBe(404);
    expect(repository.find).not.toHaveBeenCalled();
  });

  it("foto lama dihapus jika foto diganti", async () => {
    repository.update.mockResolvedValue({
      previous: stored,
      current: { ...stored, image: { image_url: NEW_PHOTO } },
    });
    const response = await resource.update(
      request("PUT", { body: { image_url: NEW_PHOTO } }),
      params(ID),
    );
    expect(response.status).toBe(200);
    expect(deleteImage).toHaveBeenCalledWith(OLD_PHOTO);
  });

  it("foto tidak dihapus jika tidak diganti", async () => {
    repository.update.mockResolvedValue({ previous: stored, current: stored });
    await resource.update(
      request("PATCH", { body: { title: "Judul baru" } }),
      params(ID),
    );
    expect(deleteImage).not.toHaveBeenCalled();
  });

  it("hapus: 404 jika tidak ada, foto ikut dihapus jika ada", async () => {
    repository.remove.mockResolvedValueOnce(null);
    expect((await resource.remove(request("DELETE"), params(ID))).status).toBe(
      404,
    );

    repository.remove.mockResolvedValueOnce(stored);
    expect((await resource.remove(request("DELETE"), params(ID))).status).toBe(
      200,
    );
    expect(deleteImage).toHaveBeenCalledWith(OLD_PHOTO);
  });
});
