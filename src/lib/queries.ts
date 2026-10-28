import { count } from "drizzle-orm";

import { galleryItems, products } from "@/db/schema";
import { getDb } from "@/lib/db";
import type { GalleryKind } from "@/lib/gallery-config";
import { isUuid } from "@/lib/ids";
import {
  galleryRepository,
  productsRepository,
  type Repository,
} from "@/lib/repositories";
import type { GalleryItemDto, ProductDto } from "@/types";

/*
 * Pembacaan data untuk halaman admin. Semua akses database lewat repositori yang sama
 * dengan API (src/lib/repositories.ts), jadi aturan pencarian dan urutan tidak terduplikasi.
 * Bedanya hanya: admin melihat semua data (`publicOnly: false`) dan 10 baris per halaman.
 */

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

async function listPage<TDto, TInput>(
  repository: Repository<TDto, TInput>,
  { q, page }: ListParams,
): Promise<Paged<TDto>> {
  const { items, total } = await repository.list({
    q: q || undefined,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
    publicOnly: false,
  });
  return {
    items,
    total,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

export function listProducts(params: ListParams): Promise<Paged<ProductDto>> {
  return listPage(productsRepository, params);
}

export async function getProduct(id: string): Promise<ProductDto | null> {
  if (!isUuid(id)) return null;
  return productsRepository.find(id, { publicOnly: false });
}

export function listGallery(
  kind: GalleryKind,
  params: ListParams,
): Promise<Paged<GalleryItemDto>> {
  return listPage(galleryRepository(kind), params);
}

export async function getGalleryItem(
  kind: GalleryKind,
  id: string,
): Promise<GalleryItemDto | null> {
  if (!isUuid(id)) return null;
  return galleryRepository(kind).find(id, { publicOnly: false });
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
