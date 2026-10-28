import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 120 }).notNull(),
    category: varchar("category", { length: 60 }).notNull().default(""),
    description: text("description").notNull().default(""),
    /** Harga dalam rupiah (bilangan bulat). */
    price: integer("price").notNull(),
    imageUrl: varchar("image_url", { length: 2048 }).notNull().default(""),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps,
  },
  (table) => [index("products_created_at_idx").on(table.createdAt)],
);

/**
 * Jenis konten galeri:
 * - `portfolio`: foto proyek yang pernah dikerjakan
 * - `pattern`: pola ornamen (galeri pola)
 */
export const galleryKind = pgEnum("gallery_kind", ["portfolio", "pattern"]);

/** Satu tabel untuk dua jenis konten yang bentuknya sama. */
export const galleryItems = pgTable(
  "gallery_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    kind: galleryKind("kind").notNull(),
    title: varchar("title", { length: 120 }).notNull(),
    type: varchar("type", { length: 60 }).notNull(),
    description: varchar("description", { length: 1000 }).notNull().default(""),
    imageUrl: varchar("image_url", { length: 2048 }).notNull(),
    ...timestamps,
  },
  (table) => [
    index("gallery_items_kind_created_at_idx").on(table.kind, table.createdAt),
  ],
);

/**
 * Penghitung percobaan (mis. login per IP). Disimpan di database, bukan di memori,
 * supaya batasnya berlaku sama di semua instance serverless.
 */
export const rateLimits = pgTable("rate_limits", {
  key: varchar("key", { length: 200 }).primaryKey(),
  count: integer("count").notNull(),
  resetAt: timestamp("reset_at", { withTimezone: true }).notNull(),
});

export type ProductRow = typeof products.$inferSelect;
export type GalleryItemRow = typeof galleryItems.$inferSelect;
