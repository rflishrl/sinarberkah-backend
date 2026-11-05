import { beforeEach, describe, expect, it, vi } from "vitest";

import { readBody, sameOriginRequest } from "../../../../../test/api";

const getCurrentAdmin = vi.fn();
const insertGalleryItem = vi.fn();
const listGalleryItems = vi.fn();

vi.mock("@/lib/auth/session", () => ({
  getCurrentAdmin: (...args: unknown[]) => getCurrentAdmin(...args),
}));
vi.mock("@/features/gallery/repository", () => ({
  insertGalleryItem: (...args: unknown[]) => insertGalleryItem(...args),
  listGalleryItems: (...args: unknown[]) => listGalleryItems(...args),
}));
vi.mock("@/lib/revalidate", () => ({ revalidateFrontend: () => {} }));

const { GET, POST } = await import("@/app/api/admin/patterns/route");

const ADMIN = {
  id: "a1",
  email: "admin@sinarberkah.com",
  role: "admin" as const,
};
const body = {
  title: "Pola Daun",
  type: "Floral",
  image_url: "https://a.public.blob.vercel-storage.com/p.jpg",
};

beforeEach(() => {
  getCurrentAdmin.mockReset().mockResolvedValue(ADMIN);
  insertGalleryItem.mockReset();
  listGalleryItems.mockReset();
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

describe("/api/admin/patterns", () => {
  it("GET: 401 tanpa sesi", async () => {
    getCurrentAdmin.mockResolvedValue(null);
    expect((await GET(sameOriginRequest("/api/admin/patterns"))).status).toBe(
      401,
    );
    expect(listGalleryItems).not.toHaveBeenCalled();
  });

  it("GET: daftar admin dengan pagination dan tanpa cache", async () => {
    listGalleryItems.mockResolvedValue({ items: [], total: 0 });
    const response = await GET(
      sameOriginRequest("/api/admin/patterns?page=2&q=daun"),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(await readBody(response)).toEqual({
      success: true,
      data: {
        items: [],
        pagination: { total: 0, page: 2, limit: 10, totalPages: 0 },
      },
    });
    expect(listGalleryItems).toHaveBeenCalledWith(
      "pattern",
      { q: "daun", limit: 10, offset: 10 },
    );
  });

  it("POST: 201 untuk data valid", async () => {
    insertGalleryItem.mockResolvedValue({ _id: "x", ...body });
    const response = await POST(
      sameOriginRequest("/api/admin/patterns", { method: "POST", json: body }),
    );
    expect(response.status).toBe(201);
  });

  it("POST: 422 dengan pesan Zod untuk data tidak valid", async () => {
    const response = await POST(
      sameOriginRequest("/api/admin/patterns", {
        method: "POST",
        json: { ...body, title: "A" },
      }),
    );
    expect(response.status).toBe(422);
    expect(await readBody(response)).toEqual({
      success: false,
      error: "Judul minimal 2 karakter.",
    });
    expect(insertGalleryItem).not.toHaveBeenCalled();
  });

  it("POST: 403 dari situs lain", async () => {
    const response = await POST(
      sameOriginRequest("/api/admin/patterns", {
        method: "POST",
        json: body,
        headers: { origin: "https://jahat.example" },
      }),
    );
    expect(response.status).toBe(403);
  });
});
