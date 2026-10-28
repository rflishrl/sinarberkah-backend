import { and, count, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";

import { galleryItems, products } from "@/db/schema";
import { getDb } from "@/lib/db";
import { toGalleryItemDto, toProductDto } from "@/lib/dto";
import type { GalleryKind } from "@/lib/gallery-config";
import type { GalleryItemDto, ProductDto } from "@/types";

export const PAGE_SIZE = 10;

export interface ListParams {
  q: string;
  page: number;
  notice?: string;
}

type RawSearchParams = Record<string, string | string[] | undefined>;

/** Membaca parameter daftar (?q, ?page, ?notice) dengan aman dari URL. */
export function parseListParams(raw: RawSearchParams): ListParams {
  const first = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;
  const page = Number.parseInt(first(raw.page) ?? "", 10);
  return {
    q: (first(raw.q) ?? "").trim().slice(0, 100),
    page: Number.isNaN(page) || page < 1 ? 1 : Math.min(page, 10_000),
    notice: first(raw.notice),
  };
}

export interface Paged<T> {
  items: T[];
  total: number;
  totalPages: number;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function search(q: string, columns: PgColumn[]): SQL | undefined {
  if (!q) return undefined;
  const pattern = `%${q.replace(/[\\%_]/g, "\\$&")}%`;
  return or(...columns.map((column) => ilike(column, pattern)));
}

function totalPages(total: number) {
  return Math.max(1, Math.ceil(total / PAGE_SIZE));
}

export async function listProducts({
  q,
  page,
}: ListParams): Promise<Paged<ProductDto>> {
  const db = getDb();
  const where = search(q, [products.name, products.category]);
  const [rows, totals] = await Promise.all([
    db
      .select()
      .from(products)
      .where(where)
      .orderBy(desc(products.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ total: count() }).from(products).where(where),
  ]);
  const total = totals[0]?.total ?? 0;
  return {
    items: rows.map(toProductDto),
    total,
    totalPages: totalPages(total),
  };
}

export async function getProduct(id: string): Promise<ProductDto | null> {
  if (!UUID_PATTERN.test(id)) return null;
  const [row] = await getDb()
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1);
  return row ? toProductDto(row) : null;
}

export async function listGallery(
  kind: GalleryKind,
  { q, page }: ListParams,
): Promise<Paged<GalleryItemDto>> {
  const db = getDb();
  const where = and(
    eq(galleryItems.kind, kind),
    search(q, [galleryItems.title, galleryItems.type]),
  );
  const [rows, totals] = await Promise.all([
    db
      .select()
      .from(galleryItems)
      .where(where)
      .orderBy(desc(galleryItems.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ total: count() }).from(galleryItems).where(where),
  ]);
  const total = totals[0]?.total ?? 0;
  return {
    items: rows.map(toGalleryItemDto),
    total,
    totalPages: totalPages(total),
  };
}

export async function getGalleryItem(
  kind: GalleryKind,
  id: string,
): Promise<GalleryItemDto | null> {
  if (!UUID_PATTERN.test(id)) return null;
  const [row] = await getDb()
    .select()
    .from(galleryItems)
    .where(and(eq(galleryItems.id, id), eq(galleryItems.kind, kind)))
    .limit(1);
  return row ? toGalleryItemDto(row) : null;
}

export async function getCounts() {
  const db = getDb();
  const [productTotals, galleryTotals] = await Promise.all([
    db.select({ total: count() }).from(products),
    db
      .select({ kind: galleryItems.kind, total: count() })
      .from(galleryItems)
      .groupBy(galleryItems.kind),
  ]);
  const byKind = (kind: GalleryKind) =>
    galleryTotals.find((row) => row.kind === kind)?.total ?? 0;

  return {
    products: productTotals[0]?.total ?? 0,
    portfolio: byKind("portfolio"),
    patterns: byKind("pattern"),
  };
}
