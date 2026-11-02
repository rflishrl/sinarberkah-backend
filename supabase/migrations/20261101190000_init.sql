-- Skema awal Sinar Berkah di Supabase: tabel, index, RLS, dan fungsi RPC.
--
-- Aturan akses (RLS):
-- - Publik (anon) dan user biasa hanya boleh MEMBACA produk aktif dan semua galeri.
-- - Hanya admin yang boleh menulis. Admin = user dengan app_metadata.role = 'admin'.
--   app_metadata hanya bisa diubah dengan secret key, jadi user tidak bisa menjadikan
--   dirinya admin.
-- - Tabel penghitung rate limit ada di skema `private`, yang tidak dibuka lewat Data API.

create extension if not exists pg_trgm with schema extensions;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- --- Kolom updated_at otomatis ----------------------------------------------

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- --- Produk ------------------------------------------------------------------

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name varchar(120) not null,
  category varchar(60) not null default '',
  description text not null default '',
  -- Harga dalam rupiah (bilangan bulat).
  price integer not null check (price >= 0),
  image_url varchar(2048) not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_created_at_idx on public.products (created_at desc);
-- Index trigram untuk pencarian `ILIKE '%kata%'`.
create index products_name_trgm_idx
  on public.products using gin (name extensions.gin_trgm_ops);
create index products_category_trgm_idx
  on public.products using gin (category extensions.gin_trgm_ops);

create trigger products_set_updated_at
  before update on public.products
  for each row execute function private.set_updated_at();

-- --- Galeri (portofolio dan pola) -------------------------------------------

create type public.gallery_kind as enum ('portfolio', 'pattern');

create table public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  kind public.gallery_kind not null,
  title varchar(120) not null,
  type varchar(60) not null,
  description varchar(1000) not null default '',
  image_url varchar(2048) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index gallery_items_kind_created_at_idx
  on public.gallery_items (kind, created_at desc);
create index gallery_items_title_trgm_idx
  on public.gallery_items using gin (title extensions.gin_trgm_ops);
create index gallery_items_type_trgm_idx
  on public.gallery_items using gin (type extensions.gin_trgm_ops);

create trigger gallery_items_set_updated_at
  before update on public.gallery_items
  for each row execute function private.set_updated_at();

-- --- Hak akses tabel -----------------------------------------------------------

revoke all on public.products, public.gallery_items from anon, authenticated;
grant select on public.products, public.gallery_items to anon, authenticated;
grant insert, update, delete on public.products, public.gallery_items to authenticated;
grant all on public.products, public.gallery_items to service_role;

-- --- RLS -----------------------------------------------------------------------

alter table public.products enable row level security;
alter table public.gallery_items enable row level security;

create policy "Semua orang membaca produk aktif, admin membaca semua"
  on public.products for select to anon, authenticated
  using (
    is_active
    or coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin'
  );

create policy "Admin menambah produk"
  on public.products for insert to authenticated
  with check (coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin');

create policy "Admin mengubah produk"
  on public.products for update to authenticated
  using (coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin')
  with check (coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin');

create policy "Admin menghapus produk"
  on public.products for delete to authenticated
  using (coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin');

create policy "Semua orang membaca galeri"
  on public.gallery_items for select to anon, authenticated
  using (true);

create policy "Admin menambah galeri"
  on public.gallery_items for insert to authenticated
  with check (coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin');

create policy "Admin mengubah galeri"
  on public.gallery_items for update to authenticated
  using (coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin')
  with check (coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin');

create policy "Admin menghapus galeri"
  on public.gallery_items for delete to authenticated
  using (coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin');

-- --- RPC: daftar dan jumlah (pencarian aman, tanpa string filter PostgREST) ---------
-- Semua RPC data memakai `security invoker`, jadi RLS pemanggil tetap berlaku.
-- Karakter khusus LIKE (\ % _) diloloskan, jadi kata kunci dibaca sebagai teks biasa.

create or replace function public.list_products(
  p_q text default null,
  p_limit integer default 50,
  p_offset integer default 0,
  p_active_only boolean default true
)
returns setof public.products
language sql
stable
security invoker
set search_path = ''
as $$
  with params as (
    select '%' || replace(replace(replace(coalesce(p_q, ''), '\', '\\'), '%', '\%'), '_', '\_') || '%' as pattern
  )
  select p.*
  from public.products p, params
  where (not p_active_only or p.is_active)
    and (
      coalesce(p_q, '') = ''
      or p.name ilike params.pattern
      or p.category ilike params.pattern
    )
  order by p.created_at desc, p.id
  limit least(greatest(p_limit, 1), 100)
  offset greatest(p_offset, 0);
$$;

create or replace function public.count_products(
  p_q text default null,
  p_active_only boolean default true
)
returns integer
language sql
stable
security invoker
set search_path = ''
as $$
  with params as (
    select '%' || replace(replace(replace(coalesce(p_q, ''), '\', '\\'), '%', '\%'), '_', '\_') || '%' as pattern
  )
  select count(*)::integer
  from public.products p, params
  where (not p_active_only or p.is_active)
    and (
      coalesce(p_q, '') = ''
      or p.name ilike params.pattern
      or p.category ilike params.pattern
    );
$$;

create or replace function public.list_gallery_items(
  p_kind public.gallery_kind,
  p_q text default null,
  p_limit integer default 50,
  p_offset integer default 0
)
returns setof public.gallery_items
language sql
stable
security invoker
set search_path = ''
as $$
  with params as (
    select '%' || replace(replace(replace(coalesce(p_q, ''), '\', '\\'), '%', '\%'), '_', '\_') || '%' as pattern
  )
  select g.*
  from public.gallery_items g, params
  where g.kind = p_kind
    and (
      coalesce(p_q, '') = ''
      or g.title ilike params.pattern
      or g.type ilike params.pattern
    )
  order by g.created_at desc, g.id
  limit least(greatest(p_limit, 1), 100)
  offset greatest(p_offset, 0);
$$;

create or replace function public.count_gallery_items(
  p_kind public.gallery_kind,
  p_q text default null
)
returns integer
language sql
stable
security invoker
set search_path = ''
as $$
  with params as (
    select '%' || replace(replace(replace(coalesce(p_q, ''), '\', '\\'), '%', '\%'), '_', '\_') || '%' as pattern
  )
  select count(*)::integer
  from public.gallery_items g, params
  where g.kind = p_kind
    and (
      coalesce(p_q, '') = ''
      or g.title ilike params.pattern
      or g.type ilike params.pattern
    );
$$;

-- --- RPC: ubah data dengan baris terkunci ---------------------------------------
-- Baris dikunci (FOR UPDATE) sebelum diubah, jadi dua penyimpanan bersamaan berjalan
-- bergiliran dan `previous_image_url` selalu foto yang benar-benar diganti.
-- Kolom yang tidak ada di `p_patch` tidak diubah.

create or replace function public.update_product(p_id uuid, p_patch jsonb)
returns table (
  previous_image_url varchar,
  id uuid,
  name varchar,
  category varchar,
  description text,
  price integer,
  image_url varchar,
  is_active boolean,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
volatile
security invoker
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_previous varchar;
begin
  select p.image_url into v_previous
  from public.products p
  where p.id = p_id
  for update;

  if not found then
    return;
  end if;

  return query
  update public.products p
  set
    name = coalesce(p_patch ->> 'name', p.name),
    category = coalesce(p_patch ->> 'category', p.category),
    description = coalesce(p_patch ->> 'description', p.description),
    price = coalesce((p_patch ->> 'price')::integer, p.price),
    image_url = coalesce(p_patch ->> 'image_url', p.image_url),
    is_active = coalesce((p_patch ->> 'is_active')::boolean, p.is_active)
  where p.id = p_id
  returning
    v_previous,
    p.id,
    p.name,
    p.category,
    p.description,
    p.price,
    p.image_url,
    p.is_active,
    p.created_at,
    p.updated_at;
end;
$$;

create or replace function public.update_gallery_item(
  p_id uuid,
  p_kind public.gallery_kind,
  p_patch jsonb
)
returns table (
  previous_image_url varchar,
  id uuid,
  kind public.gallery_kind,
  title varchar,
  type varchar,
  description varchar,
  image_url varchar,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
volatile
security invoker
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_previous varchar;
begin
  select g.image_url into v_previous
  from public.gallery_items g
  where g.id = p_id and g.kind = p_kind
  for update;

  if not found then
    return;
  end if;

  return query
  update public.gallery_items g
  set
    title = coalesce(p_patch ->> 'title', g.title),
    type = coalesce(p_patch ->> 'type', g.type),
    description = coalesce(p_patch ->> 'description', g.description),
    image_url = coalesce(p_patch ->> 'image_url', g.image_url)
  where g.id = p_id and g.kind = p_kind
  returning
    v_previous,
    g.id,
    g.kind,
    g.title,
    g.type,
    g.description,
    g.image_url,
    g.created_at,
    g.updated_at;
end;
$$;

-- --- Rate limit (hanya server dengan secret key) ------------------------------------

create table private.rate_limits (
  key varchar(200) primary key,
  count integer not null,
  reset_at timestamptz not null
);

-- Satu perintah INSERT ... ON CONFLICT, jadi aman dipanggil bersamaan dan berlaku di
-- semua instance serverless. Waktu memakai jam database.
create or replace function public.rate_limit_hit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
)
returns table (allowed boolean, retry_after_seconds integer)
language sql
volatile
security definer
set search_path = ''
as $$
  insert into private.rate_limits as r (key, count, reset_at)
  values (p_key, 1, now() + make_interval(secs => p_window_seconds))
  on conflict (key) do update
  set
    count = case when r.reset_at <= now() then 1 else r.count + 1 end,
    reset_at = case when r.reset_at <= now() then excluded.reset_at else r.reset_at end
  returning
    r.count <= p_limit,
    case
      when r.count <= p_limit then 0
      else greatest(0, ceil(extract(epoch from r.reset_at - now())))::integer
    end;
$$;

-- Menghapus penghitung `p_key` (mis. setelah login berhasil) dan penghitung lain yang
-- sudah kedaluwarsa lebih dari sehari, supaya tabel tidak menumpuk.
create or replace function public.rate_limit_reset(p_key text)
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  delete from private.rate_limits
  where key = p_key or reset_at < now() - interval '1 day';
$$;

-- --- Hak menjalankan fungsi ------------------------------------------------------------
-- Postgres memberi EXECUTE ke PUBLIC secara bawaan; dicabut lalu diberikan seperlunya.

revoke execute on function
  public.list_products(text, integer, integer, boolean),
  public.count_products(text, boolean),
  public.list_gallery_items(public.gallery_kind, text, integer, integer),
  public.count_gallery_items(public.gallery_kind, text),
  public.update_product(uuid, jsonb),
  public.update_gallery_item(uuid, public.gallery_kind, jsonb),
  public.rate_limit_hit(text, integer, integer),
  public.rate_limit_reset(text)
from public, anon, authenticated;

grant execute on function
  public.list_products(text, integer, integer, boolean),
  public.count_products(text, boolean),
  public.list_gallery_items(public.gallery_kind, text, integer, integer),
  public.count_gallery_items(public.gallery_kind, text)
to anon, authenticated;

grant execute on function
  public.update_product(uuid, jsonb),
  public.update_gallery_item(uuid, public.gallery_kind, jsonb)
to authenticated;

grant execute on function
  public.rate_limit_hit(text, integer, integer),
  public.rate_limit_reset(text)
to service_role;
