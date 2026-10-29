-- Index trigram untuk pencarian ILIKE '%kata%'. Neon dan Postgres resmi sudah menyertakan pg_trgm.
CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
CREATE INDEX "gallery_items_title_trgm_idx" ON "gallery_items" USING gin ("title" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "gallery_items_type_trgm_idx" ON "gallery_items" USING gin ("type" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "products_name_trgm_idx" ON "products" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "products_category_trgm_idx" ON "products" USING gin ("category" gin_trgm_ops);