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

const { GET, POST } = await import("@/routes/api/admin/patterns");

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
    expect(listGalleryItems).toHaveBeenCalledWith("pattern", {
      q: "daun",
      offset: 10,
      limit: 10,
    });
  });

  it("POST: 401 tanpa sesi", async () => {
    getCurrentAdmin.mockResolvedValue(null);
    const response = await POST(
      sameOriginRequest("/api/admin/patterns", { method: "POST", json: body }),
    );
    expect(response.status).toBe(401);
    expect(insertGalleryItem).not.toHaveBeenCalled();
  });

  it("POST: 201 dan kembalikan item yang dibuat", async () => {
    insertGalleryItem.mockResolvedValue({
      _id: "p1",
      kind: "pattern",
      ...body,
      isActive: true,
      createdAt: "2026-04-18T00:00:00.000Z",
      updatedAt: "2026-04-18T00:00:00.000Z",
    });

    const response = await POST(
      sameOriginRequest("/api/admin/patterns", { method: "POST", json: body }),
    );
    expect(response.status).toBe(201);
    const payload = await readBody(response);
    expect(payload).toMatchObject({
      success: true,
      data: { _id: "p1", title: "Pola Daun" },
    });
  });

  it("POST: tolak jika bukan dari origin yang sama", async () => {
    const response = await POST(
      new Request("http://localhost/api/admin/patterns", {
        method: "POST",
        headers: {
          origin: "https://evil.example.com",
          host: "localhost",
          "content-type": "application/json",
        },
        body: JSON.stringify(body),
      }),
    );
    expect(response.status).toBe(403);
    expect(insertGalleryItem).not.toHaveBeenCalled();
  });
});
