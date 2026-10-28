import { describe, expect, it } from "vitest";

import {
  galleryInput,
  galleryUpdateInput,
  productInput,
  productUpdateInput,
} from "@/lib/validation";

const BLOB_URL =
  "https://abc123.public.blob.vercel-storage.com/sinarberkah/products/photo-x.jpg";

describe("productInput", () => {
  it("mengisi nilai bawaan untuk kolom opsional", () => {
    const result = productInput.parse({ name: "Pagar", price: "150000" });
    expect(result).toEqual({
      name: "Pagar",
      price: 150000,
      category: "",
      description: "",
      image_url: "",
      isActive: true,
    });
  });

  it("menerima foto dari Vercel Blob", () => {
    const result = productInput.parse({
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
    const result = productInput.safeParse({
      name: "Pagar",
      price: 1,
      image_url,
    });
    expect(result.success).toBe(false);
  });

  it("menolak harga negatif dan pecahan", () => {
    expect(productInput.safeParse({ name: "Pagar", price: -1 }).success).toBe(
      false,
    );
    expect(productInput.safeParse({ name: "Pagar", price: 1.5 }).success).toBe(
      false,
    );
  });
});

describe("productUpdateInput", () => {
  it("tidak mengisi nilai bawaan, jadi kolom yang tidak dikirim tidak tertimpa", () => {
    expect(productUpdateInput.parse({ name: "Baru" })).toEqual({
      name: "Baru",
    });
  });
});

describe("galleryInput", () => {
  it("mewajibkan foto", () => {
    expect(
      galleryInput.safeParse({ title: "Pola", type: "LC 071" }).success,
    ).toBe(false);
  });

  it("menerima data lengkap dan memangkas spasi", () => {
    const result = galleryInput.parse({
      title: "  Pola LC 071 ",
      type: "LC 071",
      image_url: BLOB_URL,
    });
    expect(result.title).toBe("Pola LC 071");
    expect(result.description).toBe("");
  });

  it("versi ubah boleh tanpa foto", () => {
    expect(galleryUpdateInput.parse({ title: "Judul baru" })).toEqual({
      title: "Judul baru",
    });
  });
});
