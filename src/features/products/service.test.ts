import { beforeEach, describe, expect, it, vi } from "vitest";

const repo = {
  listProducts: vi.fn(),
  findProduct: vi.fn(),
  insertProduct: vi.fn(),
  updateProduct: vi.fn(),
  deleteProduct: vi.fn(),
};
const deleteStoredMedia = vi.fn();
const revalidateFrontend = vi.fn();

vi.mock("@/features/products/repository", () => repo);
vi.mock("@/features/uploads/media-storage", () => ({
  deleteStoredMedia: (url: string) => deleteStoredMedia(url),
}));
vi.mock("@/lib/revalidate", () => ({
  revalidateFrontend: (tags: string[]) => revalidateFrontend(tags),
}));

const service = await import("@/features/products/service");

const admin = {
  id: "a1",
  email: "admin@sinarberkah.com",
  role: "admin" as const,
};
const user = { id: "u1", email: "user@sinarberkah.com", role: "user" as const };
const ID = "0b6c1c0e-5c0a-4a53-9d6e-2f4f6f0a1b2c";
const OLD = "550e8400-e29b-41d4-a716-446655440001.webp";
const product = (image_url: string) => ({
  _id: ID,
  name: "Pagar",
  category: "",
  description: "",
  price: 100,
  image: { image_url },
  isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
});

beforeEach(() => {
  for (const fn of Object.values(repo)) fn.mockReset();
  deleteStoredMedia.mockReset();
  revalidateFrontend.mockReset();
});

describe("otorisasi", () => {
  it("bukan admin tidak bisa menulis", async () => {
    await expect(
      service.createProduct(user, { name: "Pagar", price: 1 }),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(
      service.updateProductById(null, ID, { price: 1 }),
    ).rejects.toMatchObject({
      code: "UNAUTHENTICATED",
    });
    await expect(service.deleteProductById(user, ID)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    expect(repo.insertProduct).not.toHaveBeenCalled();
  });

  it("publik hanya melihat produk aktif, admin melihat semua", async () => {
    repo.listProducts.mockResolvedValue({ items: [], total: 0 });
    await service.listProductsFor({ audience: "public" }, {});
    expect(repo.listProducts).toHaveBeenLastCalledWith(
      expect.objectContaining({ activeOnly: true, limit: 50 }),
    );
    await service.listProductsFor({ audience: "admin", actor: admin }, {});
    expect(repo.listProducts).toHaveBeenLastCalledWith(
      expect.objectContaining({ activeOnly: false, limit: 10 }),
    );
  });

  it("produk tersembunyi = 404 untuk publik", async () => {
    repo.findProduct.mockResolvedValue(null);
    await expect(
      service.getProduct({ audience: "public" }, ID),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(repo.findProduct).toHaveBeenCalledWith(ID, {
      activeOnly: true,
    });
  });
});

describe("validasi", () => {
  it("harga kosong ditolak (bukan dianggap 0)", async () => {
    await expect(
      service.createProduct(admin, { name: "Pagar", price: "" }),
    ).rejects.toMatchObject({
      name: "ZodError",
    });
  });

  it("harga negatif dan pecahan ditolak", async () => {
    await expect(
      service.createProduct(admin, { name: "Pagar", price: -1 }),
    ).rejects.toMatchObject({ name: "ZodError" });
    await expect(
      service.createProduct(admin, { name: "Pagar", price: 1.5 }),
    ).rejects.toMatchObject({ name: "ZodError" });
  });

  it("harga berupa teks angka diterima dan nilai bawaan terisi", async () => {
    repo.insertProduct.mockResolvedValue(product(""));
    await service.createProduct(admin, {
      name: "Pagar",
      price: "150000",
    });
    expect(repo.insertProduct).toHaveBeenCalledWith({
      name: "Pagar",
      price: 150000,
      category: "",
      description: "",
      image_url: "",
      isActive: true,
    });
    expect(revalidateFrontend).toHaveBeenCalledWith(["products"]);
  });
});

describe("foto", () => {
  it("foto dihapus saat produk dihapus", async () => {
    repo.deleteProduct.mockResolvedValue(product(OLD));
    await service.deleteProductById(admin, ID);
    expect(deleteStoredMedia).toHaveBeenCalledWith(OLD);
  });

  it("foto lama dihapus saat dikosongkan", async () => {
    repo.updateProduct.mockResolvedValue({
      item: product(""),
      previousImageUrl: OLD,
    });
    await service.updateProductById(admin, ID, { image_url: "" });
    expect(deleteStoredMedia).toHaveBeenCalledWith(OLD);
  });
});
