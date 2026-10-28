import { afterAll, beforeAll, describe, expect, it } from "vitest";

/*
 * Uji integrasi ke PostgreSQL sungguhan. Dilewati kecuali TEST_DATABASE_URL diisi, mis.:
 *   npm run db:up && npm run db:migrate
 *   $env:TEST_DATABASE_URL="postgres://sinarberkah:sinarberkah_dev@localhost:5432/sinarberkah"; npm test
 * Hanya baris uji (key berawalan "test:" dan produk "__uji__") yang dibuat dan dihapus.
 */
const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("database (integrasi)", () => {
  let mod: {
    rateLimit: typeof import("@/lib/rate-limit").rateLimit;
    resetRateLimit: typeof import("@/lib/rate-limit").resetRateLimit;
    productsRepository: typeof import("@/lib/repositories").productsRepository;
  };
  const key = `test:${crypto.randomUUID()}`;
  let productId: string | undefined;

  beforeAll(async () => {
    process.env.DATABASE_URL = url;
    const [rate, repos] = await Promise.all([
      import("@/lib/rate-limit"),
      import("@/lib/repositories"),
    ]);
    mod = { ...rate, productsRepository: repos.productsRepository };
  });

  afterAll(async () => {
    await mod?.resetRateLimit(key);
    if (productId) await mod?.productsRepository.remove(productId);
  });

  it("rateLimit menghitung bersamaan dengan benar dan menolak setelah batas", async () => {
    const results = await Promise.all(
      Array.from({ length: 5 }, () => mod.rateLimit(key, 3, 60_000)),
    );
    expect(results.filter((r) => r.allowed)).toHaveLength(3);
    const blocked = results.find((r) => !r.allowed);
    expect(blocked?.retryAfterSeconds).toBeGreaterThan(0);
    expect(blocked?.retryAfterSeconds).toBeLessThanOrEqual(60);

    await mod.resetRateLimit(key);
    await expect(mod.rateLimit(key, 3, 60_000)).resolves.toMatchObject({
      allowed: true,
    });
  });

  it("update berjalan bergiliran dan selalu mengembalikan data sebelumnya yang benar", async () => {
    const created = await mod.productsRepository.create({
      name: "__uji__",
      category: "",
      description: "",
      price: 1,
      image_url: "",
      isActive: false,
    });
    productId = created._id;

    const [a, b] = await Promise.all([
      mod.productsRepository.update(productId, { price: 2 }),
      mod.productsRepository.update(productId, { price: 3 }),
    ]);
    // Salah satu update melihat hasil update lainnya sebagai "sebelum".
    const previousPrices = [a?.previous.price, b?.previous.price].sort();
    expect(previousPrices[0]).toBe(1);
    expect([2, 3]).toContain(previousPrices[1]);
  });
});
