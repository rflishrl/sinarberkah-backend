// Menyalin isi `products` dan `gallery_items` dari Neon (database lama) ke Supabase.
// Hanya MEMBACA dari Neon; Neon tidak diubah sama sekali.
// Id, tanggal, dan URL foto dipertahankan, jadi foto di Vercel Blob tetap terpakai.
// Aman dijalankan ulang: baris yang id-nya sudah ada di Supabase dilewati.
//
// Butuh di .env.local: NEON_DATABASE_URL, SUPABASE_URL, SUPABASE_SECRET_KEY.
// Pemakaian: npm run db:copy-from-neon
import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";

const { NEON_DATABASE_URL, SUPABASE_URL, SUPABASE_SECRET_KEY } = process.env;
if (!NEON_DATABASE_URL || !SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.error(
    "Isi NEON_DATABASE_URL, SUPABASE_URL, dan SUPABASE_SECRET_KEY di .env.local.",
  );
  process.exit(1);
}

const neon = postgres(NEON_DATABASE_URL, { max: 1, prepare: false });
const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const iso = (value) => new Date(value).toISOString();

async function copy(table, rows) {
  if (rows.length === 0) {
    console.log(`${table}: kosong, dilewati.`);
    return;
  }
  const { data, error } = await supabase
    .from(table)
    .upsert(rows, { onConflict: "id", ignoreDuplicates: true })
    .select("id");
  if (error) throw new Error(`${table}: ${error.message}`);
  console.log(
    `${table}: ${rows.length} baris dibaca, ${data.length} baris baru disalin.`,
  );
}

try {
  const products = await neon`
    select id, name, category, description, price, image_url, is_active, created_at, updated_at
    from products order by created_at`;
  const gallery = await neon`
    select id, kind, title, type, description, image_url, created_at, updated_at
    from gallery_items order by created_at`;

  await copy(
    "products",
    products.map((row) => ({
      ...row,
      created_at: iso(row.created_at),
      updated_at: iso(row.updated_at),
    })),
  );
  await copy(
    "gallery_items",
    gallery.map((row) => ({
      ...row,
      created_at: iso(row.created_at),
      updated_at: iso(row.updated_at),
    })),
  );

  const [{ count: productCount }, { count: galleryCount }] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase.from("gallery_items").select("id", { count: "exact", head: true }),
  ]);
  console.log(
    `Cek: Neon ${products.length}/${gallery.length}, Supabase ${productCount}/${galleryCount} (produk/galeri).`,
  );
} catch (error) {
  console.error(
    "Gagal menyalin:",
    error instanceof Error ? error.message : error,
  );
  process.exitCode = 1;
} finally {
  await neon.end();
}
