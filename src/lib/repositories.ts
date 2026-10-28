import { and, count, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";

import { galleryItems, products } from "@/db/schema";
import { getDb } from "@/lib/db";
import { toGalleryItemDto, toProductDto } from "@/lib/dto";
import type { GalleryInput, ProductInput } from "@/lib/validation";
import type { GalleryItemDto, ProductDto } from "@/types";

export interface ListOptions {
  q?: string;
  limit: number;
  offset: number;
  /** `true` untuk pembaca publik (mis. hanya produk yang aktif). */
  publicOnly: boolean;
}

/** Kontrak penyimpanan yang dipakai handler CRUD umum. */
export interface Repository<TDto, TInput> {
  list(options: ListOptions): Promise<{ items: TDto[]; total: number }>;
  find(id: string, options: { publicOnly: boolean }): Promise<TDto | null>;
  create(input: TInput): Promise<TDto>;
  /** Mengembalikan data sebelum dan sesudah diubah, atau `null` jika id tidak ada. */
  update(
    id: string,
    input: Partial<TInput>,
  ): Promise<{ previous: TDto; current: TDto } | null>;
  /** Mengembalikan data yang dihapus, atau `null` jika id tidak ada. */
  remove(id: string): Promise<TDto | null>;
}

/** Meloloskan karakter khusus LIKE agar kata kunci diperlakukan sebagai teks biasa. */
function escapeLike(text: string): string {
  return text.replace(/[\\%_]/g, "\\$&");
}

function search(q: string | undefined, columns: PgColumn[]): SQL | undefined {
  if (!q) return undefined;
  const pattern = `%${escapeLike(q)}%`;
  return or(...columns.map((column) => ilike(column, pattern)));
}

// --- Produk ---------------------------------------------------------------

function productValues(input: Partial<ProductInput>) {
  return {
    ...(input.name !== undefined && { name: input.name }),
    ...(input.category !== undefined && { category: input.category }),
    ...(input.description !== undefined && { description: input.description }),
    ...(input.price !== undefined && { price: input.price }),
    ...(input.image_url !== undefined && { imageUrl: input.image_url }),
    ...(input.isActive !== undefined && { isActive: input.isActive }),
  };
}

export const productsRepository: Repository<ProductDto, ProductInput> = {
  async list({ q, limit, offset, publicOnly }) {
    const db = getDb();
    const where = and(
      publicOnly ? eq(products.isActive, true) : undefined,
      search(q, [products.name, products.category]),
    );
    const [rows, totals] = await Promise.all([
      db
        .select()
        .from(products)
        .where(where)
        .orderBy(desc(products.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ total: count() }).from(products).where(where),
    ]);
    return { items: rows.map(toProductDto), total: totals[0]?.total ?? 0 };
  },

  async find(id, { publicOnly }) {
    const [row] = await getDb()
      .select()
      .from(products)
      .where(
        and(
          eq(products.id, id),
          publicOnly ? eq(products.isActive, true) : undefined,
        ),
      )
      .limit(1);
    return row ? toProductDto(row) : null;
  },

  async create(input) {
    const [row] = await getDb()
      .insert(products)
      .values({ ...productValues(input), name: input.name, price: input.price })
      .returning();
    if (!row) throw new Error("Gagal menyimpan produk.");
    return toProductDto(row);
  },

  async update(id, input) {
    // Baris dikunci (FOR UPDATE) selama transaksi, jadi dua penyimpanan bersamaan
    // berjalan bergiliran dan foto lama yang dihapus selalu foto yang benar.
    return getDb().transaction(async (tx) => {
      const [before] = await tx
        .select()
        .from(products)
        .where(eq(products.id, id))
        .for("update");
      if (!before) return null;

      const values = productValues(input);
      if (Object.keys(values).length === 0) {
        const unchanged = toProductDto(before);
        return { previous: unchanged, current: unchanged };
      }

      const [after] = await tx
        .update(products)
        .set(values)
        .where(eq(products.id, id))
        .returning();
      return after
        ? { previous: toProductDto(before), current: toProductDto(after) }
        : null;
    });
  },

  async remove(id) {
    const [row] = await getDb()
      .delete(products)
      .where(eq(products.id, id))
      .returning();
    return row ? toProductDto(row) : null;
  },
};

// --- Galeri (portofolio dan pola) -----------------------------------------

function galleryValues(input: Partial<GalleryInput>) {
  return {
    ...(input.title !== undefined && { title: input.title }),
    ...(input.type !== undefined && { type: input.type }),
    ...(input.description !== undefined && { description: input.description }),
    ...(input.image_url !== undefined && { imageUrl: input.image_url }),
  };
}

/** Repositori untuk satu jenis galeri; `kind` selalu ikut menjadi filter. */
export function galleryRepository(
  kind: "portfolio" | "pattern",
): Repository<GalleryItemDto, GalleryInput> {
  const ofKind = eq(galleryItems.kind, kind);

  return {
    async list({ q, limit, offset }) {
      const db = getDb();
      const where = and(
        ofKind,
        search(q, [galleryItems.title, galleryItems.type]),
      );
      const [rows, totals] = await Promise.all([
        db
          .select()
          .from(galleryItems)
          .where(where)
          .orderBy(desc(galleryItems.createdAt))
          .limit(limit)
          .offset(offset),
        db.select({ total: count() }).from(galleryItems).where(where),
      ]);
      return {
        items: rows.map(toGalleryItemDto),
        total: totals[0]?.total ?? 0,
      };
    },

    async find(id) {
      const [row] = await getDb()
        .select()
        .from(galleryItems)
        .where(and(eq(galleryItems.id, id), ofKind))
        .limit(1);
      return row ? toGalleryItemDto(row) : null;
    },

    async create(input) {
      const [row] = await getDb()
        .insert(galleryItems)
        .values({
          kind,
          title: input.title,
          type: input.type,
          description: input.description,
          imageUrl: input.image_url,
        })
        .returning();
      if (!row) throw new Error("Gagal menyimpan data.");
      return toGalleryItemDto(row);
    },

    async update(id, input) {
      // Sama seperti produk: baris dikunci selama transaksi.
      return getDb().transaction(async (tx) => {
        const [before] = await tx
          .select()
          .from(galleryItems)
          .where(and(eq(galleryItems.id, id), ofKind))
          .for("update");
        if (!before) return null;

        const values = galleryValues(input);
        if (Object.keys(values).length === 0) {
          const unchanged = toGalleryItemDto(before);
          return { previous: unchanged, current: unchanged };
        }

        const [after] = await tx
          .update(galleryItems)
          .set(values)
          .where(and(eq(galleryItems.id, id), ofKind))
          .returning();
        return after
          ? {
              previous: toGalleryItemDto(before),
              current: toGalleryItemDto(after),
            }
          : null;
      });
    },

    async remove(id) {
      const [row] = await getDb()
        .delete(galleryItems)
        .where(and(eq(galleryItems.id, id), ofKind))
        .returning();
      return row ? toGalleryItemDto(row) : null;
    },
  };
}

// --- Foto yang masih dipakai -----------------------------------------------

/** Semua alamat foto yang masih dipakai produk atau galeri (untuk pembersihan Blob). */
export async function getReferencedImageUrls(): Promise<Set<string>> {
  const db = getDb();
  const [productRows, galleryRows] = await Promise.all([
    db.select({ url: products.imageUrl }).from(products),
    db.select({ url: galleryItems.imageUrl }).from(galleryItems),
  ]);
  return new Set(
    [...productRows, ...galleryRows].map((row) => row.url).filter(Boolean),
  );
}
