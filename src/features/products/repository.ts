import "server-only";

import type {
  ProductCreateInput,
  ProductDto,
  ProductUpdateInput,
} from "@/features/products/schemas";
import { getDb } from "@/lib/db/client";

interface RawProductRow {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  image_url: string;
  is_active: boolean;
  created_at: string | Date;
  updated_at: string | Date;
}

/** Preserves legacy column names for backwards compatibility. */
function toDto(row: RawProductRow): ProductDto {
  return {
    _id: row.id,
    name: row.name,
    category: row.category,
    description: row.description,
    price: Number(row.price),
    image: { image_url: row.image_url },
    isActive: row.is_active,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export interface ListParams {
  q?: string;
  limit: number;
  offset: number;
  activeOnly: boolean;
}

export async function listProducts({
  q,
  limit,
  offset,
  activeOnly,
}: ListParams): Promise<{ items: ProductDto[]; total: number }> {
  const sql = getDb();
  const searchPattern = q ? `%${q.trim()}%` : null;

  const countRows = await sql`
    SELECT COUNT(*)::int AS count
    FROM products
    WHERE
      (${!activeOnly} OR is_active = true)
      AND (${!searchPattern} OR name ILIKE ${searchPattern} OR category ILIKE ${searchPattern})
  `;
  const total = Number(countRows[0]?.count || 0);

  const rows = await sql`
    SELECT id, name, category, description, price, image_url, is_active, created_at, updated_at
    FROM products
    WHERE
      (${!activeOnly} OR is_active = true)
      AND (${!searchPattern} OR name ILIKE ${searchPattern} OR category ILIKE ${searchPattern})
    ORDER BY created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

  return {
    items: (rows as unknown as RawProductRow[]).map(toDto),
    total,
  };
}

export async function countProducts(): Promise<number> {
  const sql = getDb();
  const rows = await sql`SELECT COUNT(*)::int AS count FROM products`;
  return Number(rows[0]?.count || 0);
}

export async function findProduct(
  id: string,
  { activeOnly }: { activeOnly: boolean },
): Promise<ProductDto | null> {
  const sql = getDb();
  const rows = await sql`
    SELECT id, name, category, description, price, image_url, is_active, created_at, updated_at
    FROM products
    WHERE id = ${id}::uuid AND (${!activeOnly} OR is_active = true)
    LIMIT 1
  `;
  if (rows.length === 0) return null;
  return toDto(rows[0] as unknown as RawProductRow);
}

export async function insertProduct(
  input: ProductCreateInput,
): Promise<ProductDto> {
  const sql = getDb();
  const rows = await sql`
    INSERT INTO products (
      name, category, description, price, image_url, is_active
    ) VALUES (
      ${input.name},
      ${input.category ?? ""},
      ${input.description ?? ""},
      ${input.price},
      ${input.image_url ?? ""},
      ${input.isActive ?? true}
    )
    RETURNING id, name, category, description, price, image_url, is_active, created_at, updated_at
  `;
  return toDto(rows[0] as unknown as RawProductRow);
}

export async function updateProduct(
  id: string,
  input: ProductUpdateInput,
): Promise<{ item: ProductDto; previousImageUrl: string } | null> {
  const sql = getDb();

  const existing = await sql`SELECT image_url FROM products WHERE id = ${id}::uuid LIMIT 1`;
  if (existing.length === 0) return null;
  const previousImageUrl = (existing[0] as { image_url: string }).image_url;

  const rows = await sql`
    UPDATE products
    SET
      name = COALESCE(${input.name ?? null}, name),
      category = COALESCE(${input.category ?? null}, category),
      description = COALESCE(${input.description ?? null}, description),
      price = COALESCE(${input.price ?? null}, price),
      image_url = COALESCE(${input.image_url ?? null}, image_url),
      is_active = COALESCE(${input.isActive ?? null}, is_active),
      updated_at = NOW()
    WHERE id = ${id}::uuid
    RETURNING id, name, category, description, price, image_url, is_active, created_at, updated_at
  `;

  if (rows.length === 0) return null;
  return { item: toDto(rows[0] as unknown as RawProductRow), previousImageUrl };
}

export async function deleteProduct(id: string): Promise<ProductDto | null> {
  const sql = getDb();
  const rows = await sql`
    DELETE FROM products
    WHERE id = ${id}::uuid
    RETURNING id, name, category, description, price, image_url, is_active, created_at, updated_at
  `;
  if (rows.length === 0) return null;
  return toDto(rows[0] as unknown as RawProductRow);
}
