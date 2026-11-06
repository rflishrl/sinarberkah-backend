import { beforeEach, describe, expect, it, vi } from "vitest";

const repo = {
  listGalleryItems: vi.fn(),
  findGalleryItem: vi.fn(),
  insertGalleryItem: vi.fn(),
  updateGalleryItem: vi.fn(),
  deleteGalleryItem: vi.fn(),
};
const deleteImage = vi.fn();
const revalidateFrontend = vi.fn();

vi.mock("@/features/gallery/repository", () => repo);
vi.mock("@/lib/storage/blob", () => ({
  deleteImage: (url: string) => deleteImage(url),
}));
vi.mock("@/lib/revalidate", () => ({
  revalidateFrontend: (tags: string[]) => revalidateFrontend(tags),
}));

const service = await import("@/features/gallery/service");

const admin = {
  id: "a1",
  email: "admin@sinarberkah.com",
  role: "admin" as const,
};
const user = { id: "u1", email: "user@sinarberkah.com", role: "user" as const };
const ID = "0b6c1c0e-5c0a-4a53-9d6e-2f4f6f0a1b2c";
const OLD = "https://a.public.blob.vercel-storage.com/lama.jpg";
const NEW = "https://a.public.blob.vercel-storage.com/baru.jpg";
const item = (image_url: string) => ({
  _id: ID,
  kind: "pattern" as const,
  title: "Pola Daun",
  type: "Floral",
  description: "",
  image: { image_url },
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
});
const validInput = { title: "Pola Daun", type: "Floral", image_url: NEW };

beforeEach(() => {
  for (const fn of Object.values(repo)) fn.mockReset();
  deleteImage.mockReset();
  revalidateFrontend.mockReset();
});

describe("otorisasi", () => {
  it.each([
    ["tanpa login", null, "UNAUTHENTICATED"],
    ["bukan admin", user, "FORBIDDEN"],
  ])("tulis data %s ditolak (%s)", async (_label, actor, code) => {
    await expect(
      service.createGallery(actor, "pattern", validInput),
    ).rejects.toMatchObject({ code });
    await expect(
      service.updateGallery(actor, "pattern", ID, { title: "Baru" }),
    ).rejects.toMatchObject({ code });
    await expect(
      service.deleteGallery(actor, "pattern", ID),
    ).rejects.toMatchObject({ code });
    expect(repo.insertGalleryItem).not.toHaveBeenCalled();
    expect(repo.updateGalleryItem).not.toHaveBeenCalled();
    expect(repo.deleteGalleryItem).not.toHaveBeenCalled();
  });

  it("daftar admin butuh admin, daftar publik tidak", async () => {
    repo.listGalleryItems.mockResolvedValue({ items: [], total: 0 });
    await expect(
      service.listGallery({ audience: "admin", actor: user }, "pattern", {}),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(
      service.listGallery({ audience: "public" }, "pattern", {}),
    ).resolves.toMatchObject({
      items: [],
    });
  });
});

describe("validasi", () => {
  it("judul terlalu pendek ditolak sebelum menyentuh database", async () => {
    await expect(
      service.createGallery(admin, "pattern", {
        ...validInput,
        title: "A",
      }),
    ).rejects.toMatchObject({
      name: "ZodError",
    });
    expect(repo.insertGalleryItem).not.toHaveBeenCalled();
  });

  it("foto dari host selain Vercel Blob ditolak", async () => {
    await expect(
      service.createGallery(admin, "pattern", {
        ...validInput,
        image_url: "https://contoh.com/a.jpg",
      }),
    ).rejects.toMatchObject({ name: "ZodError" });
  });

  it("id bukan UUID = 404 tanpa query", async () => {
    await expect(
      service.getGalleryItem({ audience: "public" }, "pattern", "abc"),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    expect(repo.findGalleryItem).not.toHaveBeenCalled();
  });

  it("parameter daftar dirapikan: halaman tidak masuk akal jadi 1, limit admin 10", async () => {
    repo.listGalleryItems.mockResolvedValue({ items: [], total: 25 });
    const result = await service.listGallery(
      { audience: "admin", actor: admin },
      "pattern",
      {
        page: "-3",
        q: "  daun  ",
      },
    );
    expect(repo.listGalleryItems).toHaveBeenCalledWith("pattern", {
      q: "daun",
      limit: 10,
      offset: 0,
    });
    expect(result.pagination).toEqual({
      total: 25,
      page: 1,
      limit: 10,
      totalPages: 3,
    });
  });
});

describe("aturan bisnis", () => {
  it("tambah: deskripsi bawaan kosong, frontend diberi tahu", async () => {
    repo.insertGalleryItem.mockResolvedValue(item(NEW));
    await service.createGallery(admin, "pattern", validInput);
    expect(repo.insertGalleryItem).toHaveBeenCalledWith("pattern", {
      ...validInput,
      description: "",
    });
    expect(revalidateFrontend).toHaveBeenCalledWith(["gallery"]);
  });

  it("ubah foto: foto lama dihapus dari Blob", async () => {
    repo.updateGalleryItem.mockResolvedValue({
      item: item(NEW),
      previousImageUrl: OLD,
    });
    await service.updateGallery(admin, "pattern", ID, {
      image_url: NEW,
    });
    expect(deleteImage).toHaveBeenCalledWith(OLD);
  });

  it("ubah tanpa ganti foto: foto tidak dihapus", async () => {
    repo.updateGalleryItem.mockResolvedValue({
      item: item(OLD),
      previousImageUrl: OLD,
    });
    await service.updateGallery(admin, "pattern", ID, {
      title: "Baru",
    });
    expect(deleteImage).not.toHaveBeenCalled();
  });

  it("ubah id yang tidak ada = 404", async () => {
    repo.updateGalleryItem.mockResolvedValue(null);
    await expect(
      service.updateGallery(admin, "pattern", ID, { title: "Baru" }),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Pola tidak ditemukan.",
    });
  });

  it("hapus: foto ikut dihapus, portofolio memakai tag portfolio", async () => {
    repo.deleteGalleryItem.mockResolvedValue(item(OLD));
    await expect(
      service.deleteGallery(admin, "portfolio", ID),
    ).resolves.toMatchObject({ _id: ID });
    expect(deleteImage).toHaveBeenCalledWith(OLD);
    expect(revalidateFrontend).toHaveBeenCalledWith(["portfolio"]);
  });
});
