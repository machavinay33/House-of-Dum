-- =============================================================================
-- House of Dum - core schema
-- Run order: 0001_schema.sql -> 0002_functions.sql -> 0003_rls.sql -> 0004_storage.sql -> seed.sql
-- =============================================================================

-- ---------- Helpers ----------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------- Menu ----------
create table if not exists public.menu_categories (
  id           uuid primary key default gen_random_uuid(),
  name         text not null check (char_length(btrim(name)) between 1 and 120),
  description  text,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.menu_items (
  id            uuid primary key default gen_random_uuid(),
  category_id   uuid not null references public.menu_categories(id) on delete cascade,
  name          text not null check (char_length(btrim(name)) between 1 and 200),
  description   text,
  -- Used when the item has no variants. When variants exist, variant prices are used instead.
  price         numeric(10,2) not null default 0 check (price >= 0),
  image_url     text,
  is_veg        boolean,                      -- true = vegetarian, false = non-vegetarian, null = not specified
  is_available  boolean not null default true,
  is_featured   boolean not null default false,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.menu_item_variants (
  id            uuid primary key default gen_random_uuid(),
  item_id       uuid not null references public.menu_items(id) on delete cascade,
  label         text not null check (char_length(btrim(label)) between 1 and 80),  -- e.g. "4 Pieces", "Half", "Chicken"
  price         numeric(10,2) not null check (price >= 0),
  sort_order    integer not null default 0,
  is_available  boolean not null default true,
  created_at    timestamptz not null default now()
);

create index if not exists menu_categories_sort_idx on public.menu_categories (sort_order);
create index if not exists menu_items_category_sort_idx on public.menu_items (category_id, sort_order);
create index if not exists menu_items_featured_idx on public.menu_items (is_featured) where is_featured;
create index if not exists menu_item_variants_item_idx on public.menu_item_variants (item_id, sort_order);

create trigger menu_categories_updated_at before update on public.menu_categories
  for each row execute function public.set_updated_at();
create trigger menu_items_updated_at before update on public.menu_items
  for each row execute function public.set_updated_at();

-- ---------- Orders ----------
create table if not exists public.orders (
  id                   uuid primary key default gen_random_uuid(),
  order_code           text not null unique,
  customer_name        text not null,
  phone                text not null,
  address              text not null,
  landmark             text not null default '',
  instructions         text,
  status               text not null default 'received'
                       check (status in ('received','confirmed','preparing','out_for_delivery','delivered','cancelled')),
  total                numeric(10,2) not null check (total >= 0),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  confirmed_at         timestamptz,
  preparing_at         timestamptz,
  out_for_delivery_at  timestamptz,
  delivered_at         timestamptz,
  cancelled_at         timestamptz
);

-- Snapshot of what was ordered. Name and price are copied so old orders never change
-- when the menu is edited later. menu_item_id is only a soft reference.
create table if not exists public.order_items (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid not null references public.orders(id) on delete cascade,
  menu_item_id   uuid references public.menu_items(id) on delete set null,
  variant_id     uuid,
  line_no        integer not null default 0,
  item_name      text not null,
  variant_label  text,
  unit_price     numeric(10,2) not null check (unit_price >= 0),
  quantity       integer not null check (quantity between 1 and 50),
  line_total     numeric(10,2) not null check (line_total >= 0)
);

create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_status_idx on public.orders (status, created_at desc);
create index if not exists order_items_order_idx on public.order_items (order_id, line_no);

-- Keeps updated_at fresh and records when each status was reached.
create or replace function public.orders_before_update()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();

  if new.status is distinct from old.status then
    if new.status <> 'cancelled' then
      new.cancelled_at := null;
    end if;

    if new.status = 'received' then
      new.confirmed_at := null; new.preparing_at := null;
      new.out_for_delivery_at := null; new.delivered_at := null;
    elsif new.status = 'confirmed' then
      new.confirmed_at := now(); new.preparing_at := null;
      new.out_for_delivery_at := null; new.delivered_at := null;
    elsif new.status = 'preparing' then
      new.preparing_at := now();
      new.out_for_delivery_at := null; new.delivered_at := null;
    elsif new.status = 'out_for_delivery' then
      new.out_for_delivery_at := now(); new.delivered_at := null;
    elsif new.status = 'delivered' then
      new.delivered_at := now();
    elsif new.status = 'cancelled' then
      new.cancelled_at := now();
    end if;
  end if;

  return new;
end;
$$;

create trigger orders_before_update before update on public.orders
  for each row execute function public.orders_before_update();

-- ---------- Gallery ----------
create table if not exists public.gallery (
  id          uuid primary key default gen_random_uuid(),
  image_url   text not null,
  caption     text,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists gallery_sort_idx on public.gallery (sort_order);

-- ---------- Restaurant settings (single row) ----------
create table if not exists public.restaurant_settings (
  id              uuid primary key default gen_random_uuid(),
  singleton       boolean not null default true unique check (singleton),
  name            text not null default 'House of Dum',
  tagline         text not null default '',
  logo_url        text,
  hero_image_url  text,
  phone           text not null default '',
  whatsapp        text not null default '',
  address         text not null default '',
  instagram       text not null default '',
  opening_hours   text not null default '',
  description     text not null default '',
  branches        text not null default '',
  updated_at      timestamptz not null default now()
);

create trigger restaurant_settings_updated_at before update on public.restaurant_settings
  for each row execute function public.set_updated_at();

-- ---------- Admins ----------
-- A Supabase Auth user is an admin only if their id is listed here.
create table if not exists public.admins (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now()
);
