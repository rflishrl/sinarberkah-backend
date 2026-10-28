import { beforeEach, describe, expect, it, vi } from "vitest";

const deleteOrphanImages = vi.fn();
vi.mock("@/lib/blob", () => ({
  deleteOrphanImages: (...args: unknown[]) => deleteOrphanImages(...args),
}));
vi.mock("@/lib/repositories", () => ({
  getReferencedImageUrls: async () => new Set(["https://dipakai"]),
}));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
}));

const { GET } = await import("@/app/api/cron/cleanup-blobs/route");

const call = (authorization?: string) =>
  GET(
    new Request("http://localhost/api/cron/cleanup-blobs", {
      headers: authorization ? { authorization } : {},
    }),
  );

beforeEach(() => {
  vi.clearAllMocks();
  deleteOrphanImages.mockResolvedValue({ scanned: 3, deleted: 1 });
});

describe("GET /api/cron/cleanup-blobs", () => {
  it("401 tanpa atau dengan rahasia yang salah", async () => {
    expect((await call()).status).toBe(401);
    expect((await call("Bearer salah")).status).toBe(401);
    expect(deleteOrphanImages).not.toHaveBeenCalled();
  });

  it("menjalankan pembersihan dengan rahasia yang benar", async () => {
    const response = await call("Bearer cron-secret-untuk-pengujian");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: { scanned: 3, deleted: 1 },
    });
    expect(deleteOrphanImages).toHaveBeenCalledWith(
      new Set(["https://dipakai"]),
      expect.any(Date),
    );
  });
});
