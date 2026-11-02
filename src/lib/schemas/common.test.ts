import { describe, expect, it } from "vitest";

import {
  galleryCreateSchema,
  galleryUpdateSchema,
} from "@/features/gallery/schemas";
import {
  productCreateSchema,
  productUpdateSchema,
} from "@/features/products/schemas";
import { listQuerySchema } from "@/lib/schemas/common";

const BLOB_URL =
  "https://abc123.public.blob.vercel-storage.com/sinarberkah/products/photo-x.jpg";

describe("productCreateSchema", () => {
  it("mengisi nilai bawaan untuk kolom opsional", () => {
    expect(
      productCreateSchema.parse({ name: "Pagar", price: "150000" }),
    ).toEqual({
      name: "Pagar",
      price: 150000,
      category: "",
      description: "",
      image_url: "",
      isActive: true,
    });
  });

  it("menerima foto dari Vercel Blob", () => {
    const result = productCreateSchema.parse({
      name: "Pagar",
      price: 1,
      image_url: BLOB_URL,
    });
    expect(result.image_url).toBe(BLOB_URL);
  });

  it.each([
    "https://example.com/foto.jpg",
    "http://abc123.public.blob.vercel-storage.com/foto.jpg",
    "https://public.blob.vercel-storage.com.evil.com/foto.jpg",
    "javascript:alert(1)",
  ])("menolak foto di luar Vercel Blob: %s", (image_url) => {
    expect(
      productCreateSchema.safeParse({ name: "Pagar", price: 1, image_url })
        .success,
    ).toBe(false);
  });

  it("menolak harga kosong, negatif, dan pecahan", () => {
    for (const price of ["", -1, 1.5]) {
      expect(
        productCreateSchema.safeParse({ name: "Pagar", price }).success,
      ).toBe(false);
    }
  });
});

describe("productUpdateSchema", () => {
  it("tanpa nilai bawaan, jadi kolom yang tidak dikirim tidak tertimpa", () => {
    expect(productUpdateSchema.parse({ name: "Baru" })).toEqual({
      name: "Baru",
    });
  });
});

describe("galleryCreateSchema", () => {
  it("mewajibkan foto", () => {
    expect(
      galleryCreateSchema.safeParse({ title: "Pola", type: "LC 071" }).success,
    ).toBe(false);
  });

  it("menerima data lengkap dan memangkas spasi", () => {
    const result = galleryCreateSchema.parse({
      title: "  Pola LC 071 ",
      type: "LC 071",
      image_url: BLOB_URL,
    });
    expect(result.title).toBe("Pola LC 071");
    expect(result.description).toBe("");
  });

  it("versi ubah boleh tanpa foto", () => {
    expect(galleryUpdateSchema.parse({ title: "Judul baru" })).toEqual({
      title: "Judul baru",
    });
  });
});

describe("listQuerySchema", () => {
  const schema = listQuerySchema(50);

  it("nilai bawaan jika tidak ada parameter", () => {
    expect(schema.parse({})).toEqual({ q: undefined, page: 1, limit: 50 });
  });

  it("nilai tidak masuk akal diganti nilai bawaan, bukan ditolak", () => {
    expect(schema.parse({ page: "-3", limit: "99999", q: "  daun " })).toEqual({
      q: "daun",
      page: 1,
      limit: 50,
    });
  });
});
