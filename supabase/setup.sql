-- House of Dum - complete Supabase setup
-- Run this entire file once in Supabase Dashboard -> SQL Editor.
-- It creates the schema, functions, RLS policies, storage bucket, and seed data.

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


-- =============================================================================
-- Functions: admin check, order codes, place_order, track_order
-- =============================================================================

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- Human-readable, unambiguous code such as HOD-7K4P92 (no 0/O/1/I/L).
-- Uses gen_random_uuid() as a cryptographically strong random source.
create or replace function public.generate_order_code()
returns text
language plpgsql
volatile
as $$
declare
  alphabet constant text := '23456789ABCDEFGHJKMNPQRSTUVWXYZ';  -- 31 characters
  raw bytea := decode(replace(gen_random_uuid()::text, '-', ''), 'hex');
  code text := '';
  i integer;
begin
  -- bytes 0..5 of a v4 uuid are fully random
  for i in 0..5 loop
    code := code || substr(alphabet, (get_byte(raw, i) % 31) + 1, 1);
  end loop;
  return 'HOD-' || code;
end;
$$;

-- -----------------------------------------------------------------------------
-- place_order: the ONLY way customers create orders.
-- Prices, names and availability are read from the database. Any price sent by
-- the browser is ignored (the browser does not even send one).
-- p_items: [{ "item_id": uuid, "variant_id": uuid|null, "quantity": 1..20 }, ...]
-- -----------------------------------------------------------------------------
create or replace function public.place_order(
  p_customer_name text,
  p_phone         text,
  p_address       text,
  p_landmark      text,
  p_instructions  text,
  p_items         jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name          text := btrim(coalesce(p_customer_name, ''));
  v_digits        text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
  v_phone         text;
  v_address       text := btrim(coalesce(p_address, ''));
  v_landmark      text := btrim(coalesce(p_landmark, ''));
  v_instructions  text := nullif(btrim(coalesce(p_instructions, '')), '');
  v_line          jsonb;
  v_item          public.menu_items%rowtype;
  v_variant       public.menu_item_variants%rowtype;
  v_item_id       uuid;
  v_variant_id    uuid;
  v_qty           integer;
  v_unit          numeric(10,2);
  v_label         text;
  v_has_variants  boolean;
  v_total         numeric(10,2) := 0;
  v_lines         jsonb := '[]'::jsonb;
  v_order_id      uuid;
  v_code          text;
  v_attempts      integer := 0;
begin
  -- ---- customer details ----
  if char_length(v_name) < 2 or char_length(v_name) > 100 then
    raise exception 'Please enter your full name.';
  end if;

  if char_length(v_digits) = 12 and left(v_digits, 2) = '91' then
    v_digits := substr(v_digits, 3);
  elsif char_length(v_digits) = 11 and left(v_digits, 1) = '0' then
    v_digits := substr(v_digits, 2);
  end if;
  if v_digits !~ '^[6-9][0-9]{9}$' then
    raise exception 'Please enter a valid 10-digit mobile number.';
  end if;
  v_phone := '+91' || v_digits;

  if char_length(v_address) < 10 or char_length(v_address) > 500 then
    raise exception 'Please enter your full delivery address (at least 10 characters).';
  end if;
  if char_length(v_landmark) < 2 or char_length(v_landmark) > 150 then
    raise exception 'Please enter a landmark near your address.';
  end if;
  if v_instructions is not null and char_length(v_instructions) > 300 then
    raise exception 'Delivery instructions can be at most 300 characters.';
  end if;

  -- ---- cart ----
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Your cart is empty.';
  end if;
  if jsonb_array_length(p_items) > 40 then
    raise exception 'Your cart has too many items. Please split it into two orders.';
  end if;

  for v_line in select value from jsonb_array_elements(p_items) loop
    if jsonb_typeof(v_line) <> 'object' then
      raise exception 'Invalid cart data. Please refresh the page and try again.';
    end if;

    begin
      v_item_id    := (v_line ->> 'item_id')::uuid;
      v_variant_id := nullif(v_line ->> 'variant_id', '')::uuid;
      v_qty        := (v_line ->> 'quantity')::integer;
    exception when others then
      raise exception 'Invalid cart data. Please refresh the page and try again.';
    end;

    if v_qty is null or v_qty < 1 or v_qty > 20 then
      raise exception 'Quantity must be between 1 and 20 for each item.';
    end if;

    select * into v_item from public.menu_items where id = v_item_id;
    if not found then
      raise exception 'An item in your cart is no longer on the menu. Please review your cart.';
    end if;
    if not v_item.is_available then
      raise exception '% is currently unavailable. Please remove it from your cart.', v_item.name;
    end if;

    select exists (select 1 from public.menu_item_variants where item_id = v_item.id)
      into v_has_variants;

    if v_has_variants then
      if v_variant_id is null then
        raise exception 'Please choose an option for %.', v_item.name;
      end if;
      select * into v_variant
        from public.menu_item_variants
        where id = v_variant_id and item_id = v_item.id;
      if not found then
        raise exception 'The option you chose for % is no longer available. Please review your cart.', v_item.name;
      end if;
      if not v_variant.is_available then
        raise exception '% (%) is currently unavailable. Please remove it from your cart.', v_item.name, v_variant.label;
      end if;
      v_unit  := v_variant.price;
      v_label := v_variant.label;
    else
      v_unit       := v_item.price;
      v_label      := null;
      v_variant_id := null;
    end if;

    if v_unit <= 0 then
      raise exception 'The price for % is not available right now. Please call the restaurant to order it.', v_item.name;
    end if;

    v_total := v_total + (v_unit * v_qty);
    v_lines := v_lines || jsonb_build_array(jsonb_build_object(
      'item_id',       v_item.id,
      'variant_id',    v_variant_id,
      'name',          v_item.name,
      'variant_label', v_label,
      'quantity',      v_qty,
      'unit_price',    v_unit,
      'line_total',    v_unit * v_qty
    ));
  end loop;

  -- ---- create order with a unique code (retry on the very unlikely collision) ----
  loop
    v_code := public.generate_order_code();
    begin
      insert into public.orders (order_code, customer_name, phone, address, landmark, instructions, total)
      values (v_code, v_name, v_phone, v_address, v_landmark, v_instructions, v_total)
      returning id into v_order_id;
      exit;
    exception when unique_violation then
      v_attempts := v_attempts + 1;
      if v_attempts > 8 then
        raise exception 'Could not create an order code. Please try again.';
      end if;
    end;
  end loop;

  insert into public.order_items
    (order_id, menu_item_id, variant_id, line_no, item_name, variant_label, unit_price, quantity, line_total)
  select
    v_order_id,
    (e.value ->> 'item_id')::uuid,
    nullif(e.value ->> 'variant_id', '')::uuid,
    e.ord::integer,
    e.value ->> 'name',
    e.value ->> 'variant_label',
    (e.value ->> 'unit_price')::numeric,
    (e.value ->> 'quantity')::integer,
    (e.value ->> 'line_total')::numeric
  from jsonb_array_elements(v_lines) with ordinality as e(value, ord);

  return jsonb_build_object(
    'order_code',    v_code,
    'status',        'received',
    'total',         v_total,
    'created_at',    now(),
    'customer_name', v_name,
    'phone',         v_phone,
    'address',       v_address,
    'landmark',      v_landmark,
    'instructions',  v_instructions,
    'items', (
      select jsonb_agg(jsonb_build_object(
        'name',          e.value ->> 'name',
        'variant_label', e.value ->> 'variant_label',
        'quantity',      (e.value ->> 'quantity')::integer,
        'unit_price',    (e.value ->> 'unit_price')::numeric,
        'line_total',    (e.value ->> 'line_total')::numeric
      ) order by e.ord)
      from jsonb_array_elements(v_lines) with ordinality as e(value, ord)
    )
  );
end;
$$;

revoke all on function public.place_order(text, text, text, text, text, jsonb) from public;
grant execute on function public.place_order(text, text, text, text, text, jsonb) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- track_order: safe, read-only lookup by order code.
-- Returns NULL when the code does not exist. Never returns ids, phone or address.
-- -----------------------------------------------------------------------------
create or replace function public.track_order(p_code text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_code   text := upper(btrim(coalesce(p_code, '')));
  v_order  public.orders%rowtype;
begin
  if v_code !~ '^HOD-[A-Z0-9]{6}$' then
    return null;
  end if;

  select * into v_order from public.orders where order_code = v_code;
  if not found then
    return null;
  end if;

  return jsonb_build_object(
    'order_code',          v_order.order_code,
    'status',              v_order.status,
    'total',               v_order.total,
    'created_at',          v_order.created_at,
    'updated_at',          v_order.updated_at,
    'customer_first_name', split_part(v_order.customer_name, ' ', 1),
    'timeline', jsonb_build_object(
      'received',          v_order.created_at,
      'confirmed',         v_order.confirmed_at,
      'preparing',         v_order.preparing_at,
      'out_for_delivery',  v_order.out_for_delivery_at,
      'delivered',         v_order.delivered_at,
      'cancelled',         v_order.cancelled_at
    ),
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'name',          i.item_name,
        'variant_label', i.variant_label,
        'quantity',      i.quantity,
        'unit_price',    i.unit_price,
        'line_total',    i.line_total
      ) order by i.line_no)
      from public.order_items i
      where i.order_id = v_order.id
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.track_order(text) from public;
grant execute on function public.track_order(text) to anon, authenticated;


-- =============================================================================
-- Row Level Security
--  * Public visitors: read menu, gallery and settings. Nothing else.
--  * Orders can only be created through place_order() and read through track_order().
--  * Admins (rows in public.admins): full management access.
-- =============================================================================

alter table public.menu_categories     enable row level security;
alter table public.menu_items          enable row level security;
alter table public.menu_item_variants  enable row level security;
alter table public.orders              enable row level security;
alter table public.order_items         enable row level security;
alter table public.gallery             enable row level security;
alter table public.restaurant_settings enable row level security;
alter table public.admins              enable row level security;

-- Defence in depth: remove table privileges the public never needs.
revoke all on public.orders, public.order_items, public.admins from anon;
revoke insert, update, delete, truncate on
  public.menu_categories, public.menu_items, public.menu_item_variants,
  public.gallery, public.restaurant_settings from anon;
revoke all on public.admins from authenticated;
grant select on public.admins to authenticated;

-- ---------- Public read ----------
drop policy if exists "Public read categories" on public.menu_categories;
create policy "Public read categories" on public.menu_categories
  for select to anon, authenticated using (true);

drop policy if exists "Public read items" on public.menu_items;
create policy "Public read items" on public.menu_items
  for select to anon, authenticated using (true);

drop policy if exists "Public read variants" on public.menu_item_variants;
create policy "Public read variants" on public.menu_item_variants
  for select to anon, authenticated using (true);

drop policy if exists "Public read gallery" on public.gallery;
create policy "Public read gallery" on public.gallery
  for select to anon, authenticated using (true);

drop policy if exists "Public read settings" on public.restaurant_settings;
create policy "Public read settings" on public.restaurant_settings
  for select to anon, authenticated using (true);

-- ---------- Admin full access ----------
drop policy if exists "Admins manage categories" on public.menu_categories;
create policy "Admins manage categories" on public.menu_categories
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins manage items" on public.menu_items;
create policy "Admins manage items" on public.menu_items
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins manage variants" on public.menu_item_variants;
create policy "Admins manage variants" on public.menu_item_variants
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins manage gallery" on public.gallery;
create policy "Admins manage gallery" on public.gallery
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins manage settings" on public.restaurant_settings;
create policy "Admins manage settings" on public.restaurant_settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins manage orders" on public.orders;
create policy "Admins manage orders" on public.orders
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins manage order items" on public.order_items;
create policy "Admins manage order items" on public.order_items
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- A signed-in user may see only their own row in admins (used to confirm admin status).
drop policy if exists "Users read own admin row" on public.admins;
create policy "Users read own admin row" on public.admins
  for select to authenticated using (user_id = auth.uid());

-- ---------- Realtime for the admin dashboard (RLS still applies) ----------
do $$
begin
  alter publication supabase_realtime add table public.orders;
exception
  when duplicate_object then null;
  when undefined_object then null;
end;
$$;


-- =============================================================================
-- Storage: one public bucket for logo, hero, menu and gallery images.
-- Anyone can view images by URL. Only admins can upload, replace or delete.
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'restaurant-media',
  'restaurant-media',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Admins read restaurant media" on storage.objects;
create policy "Admins read restaurant media" on storage.objects
  for select to authenticated
  using (bucket_id = 'restaurant-media' and public.is_admin());

drop policy if exists "Admins upload restaurant media" on storage.objects;
create policy "Admins upload restaurant media" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'restaurant-media' and public.is_admin());

drop policy if exists "Admins update restaurant media" on storage.objects;
create policy "Admins update restaurant media" on storage.objects
  for update to authenticated
  using (bucket_id = 'restaurant-media' and public.is_admin())
  with check (bucket_id = 'restaurant-media' and public.is_admin());

drop policy if exists "Admins delete restaurant media" on storage.objects;
create policy "Admins delete restaurant media" on storage.objects
  for delete to authenticated
  using (bucket_id = 'restaurant-media' and public.is_admin());


-- =============================================================================
-- House of Dum - seed data
-- Source: the official House of Dum menu PDF (names and prices copied exactly).
-- Descriptions were not printed on the menu, so they are left empty on purpose.
-- Add them, or correct anything, from /admin -> Menu.
--
-- Safe to run more than once: it does nothing if categories already exist.
-- Run AFTER all files in supabase/migrations.
-- =============================================================================

do $seed$
begin
  if exists (select 1 from public.menu_categories) then
    raise notice 'Menu already has data - seed skipped.';
    return;
  end if;

  -- ---------- Categories (order as printed on the menu) ----------
  insert into public.menu_categories (name, sort_order) values
    ('Authentic Hyderabadi Dum Biryani', 10),
    ('Shahi Hyderabadi Dum Biryani',     20),
    ('Tandoori Tikka & Kebabs',          30),
    ('HOD Fried Chicken & Fries',        40),
    ('Chinese Starters',                 50),
    ('Sides, Desserts & Beverages',      60),
    ('Combos',                           70);

  -- ---------- Items ----------
  -- is_veg: true = vegetarian, false = non-vegetarian (decided from the dish name).
  -- is_featured marks the items highlighted on the home page; change from the admin panel.
  insert into public.menu_items (category_id, name, price, is_veg, is_featured, sort_order)
  select c.id, v.name, v.price, v.is_veg, v.is_featured, v.sort_order
  from (values
    -- Authentic Hyderabadi Dum Biryani
    ('Authentic Hyderabadi Dum Biryani', 'Hyderabadi Chicken Dum Biryani',   279, false, true,  10),
    ('Authentic Hyderabadi Dum Biryani', 'Hyderabadi Mutton Dum Biryani',    299, false, true,  20),
    ('Authentic Hyderabadi Dum Biryani', 'Nawabi Paneer Dum Biryani',        239, true,  true,  30),
    ('Authentic Hyderabadi Dum Biryani', 'Hyderabadi Egg Dum Biryani',       249, false, false, 40),
    ('Authentic Hyderabadi Dum Biryani', 'Subz-E-Hyderabad Dum Biryani',     229, true,  false, 50),
    -- Shahi Hyderabadi Dum Biryani
    ('Shahi Hyderabadi Dum Biryani', 'Dumdar Murgh Tikka Biryani',           395, false, true,  10),
    ('Shahi Hyderabadi Dum Biryani', 'Zaikedaar Paneer Tikka Biryani',       375, true,  false, 20),
    ('Shahi Hyderabadi Dum Biryani', 'Dil Khush Boneless Chicken Dum Biryani', 375, false, false, 30),
    ('Shahi Hyderabadi Dum Biryani', 'Lazeez Chicken Tandoori Biryani',      385, false, true,  40),
    -- Tandoori Tikka & Kebabs (chicken items have 4 / 8 piece variants, price = 4 pieces)
    ('Tandoori Tikka & Kebabs', 'Tandoori Chicken',         299, false, true,  10),
    ('Tandoori Tikka & Kebabs', 'Afgani Tandoori Chicken',  349, false, false, 20),
    ('Tandoori Tikka & Kebabs', 'Chicken Angara Tikka',     169, false, false, 30),
    ('Tandoori Tikka & Kebabs', 'Chicken Aachari Tikka',    169, false, false, 40),
    ('Tandoori Tikka & Kebabs', 'Chicken Garlic Tikka',     169, false, false, 50),
    ('Tandoori Tikka & Kebabs', 'Chicken Kalimiri Tikka',   169, false, false, 60),
    ('Tandoori Tikka & Kebabs', 'Chicken Tikka Kebab',      169, false, true,  70),
    ('Tandoori Tikka & Kebabs', 'Chicken Hariyali Tikka',   169, false, false, 80),
    ('Tandoori Tikka & Kebabs', 'Paneer Hariyali Tikka',    289, true,  false, 90),
    ('Tandoori Tikka & Kebabs', 'Paneer Kalimiri Tikka',    289, true,  false, 100),
    ('Tandoori Tikka & Kebabs', 'Paneer Tikka Kebab',       289, true,  false, 110),
    -- HOD Fried Chicken & Fries
    ('HOD Fried Chicken & Fries', 'Chicken Popcorn',        249, false, false, 10),
    ('HOD Fried Chicken & Fries', 'Crispy Chicken Strips',  249, false, false, 20),
    ('HOD Fried Chicken & Fries', 'Peri Peri Fries',        199, true,  false, 30),
    ('HOD Fried Chicken & Fries', 'French Fries',           149, true,  false, 40),
    -- Chinese Starters
    ('Chinese Starters', 'Chilli Chicken',    289, false, false, 10),
    ('Chinese Starters', 'Garlic Chicken',    289, false, false, 20),
    ('Chinese Starters', 'Chicken 65',        289, false, true,  30),
    ('Chinese Starters', 'Chicken Lollipop',  299, false, false, 40),
    ('Chinese Starters', 'Chilli Paneer',     269, true,  false, 50),
    ('Chinese Starters', 'Chicken Pakoda',    289, false, false, 60),
    ('Chinese Starters', 'Garlic Paneer',     269, true,  false, 70),
    -- Sides, Desserts & Beverages
    ('Sides, Desserts & Beverages', 'Diet Coke',        59,  true, false, 10),
    ('Sides, Desserts & Beverages', 'Red Bull',         149, true, false, 20),
    ('Sides, Desserts & Beverages', 'Butter Milk',      29,  true, false, 30),
    ('Sides, Desserts & Beverages', 'Cold Drink',       29,  true, false, 40),
    ('Sides, Desserts & Beverages', 'Fresh Lime Soda',  99,  true, false, 50),
    ('Sides, Desserts & Beverages', 'Masala Lemonade',  99,  true, false, 60),
    -- Combos
    ('Combos', 'Mutton Biryani + Chicken Tikka + Chicken Garlic Tikka + Chicken Angara Tikka (4 Pieces)',  449, false, false, 10),
    ('Combos', 'Chicken Biryani + Chicken Tikka + Chicken Garlic Tikka + Chicken Angara Tikka (4 Pieces)', 399, false, false, 20),
    ('Combos', 'Chicken Biryani + Chicken Popcorn',                    429, false, false, 30),
    ('Combos', 'Shahi Chicken Kheema Masala + 2 Malabar Paratha',      349, false, false, 40),
    ('Combos', 'Shahi Mutton Kheema Masala + 2 Malabar Paratha',       449, false, false, 50),
    ('Combos', 'Shahi Bhuna Mutton Masala + 2 Malabar Paratha',        449, false, false, 60),
    ('Combos', 'Shahi Bhuna Chicken Masala + 2 Malabar Paratha',       349, false, false, 70)
  ) as v(category, name, price, is_veg, is_featured, sort_order)
  join public.menu_categories c on c.name = v.category;

  -- ---------- Variants (4 Pieces / 8 Pieces) ----------
  insert into public.menu_item_variants (item_id, label, price, sort_order)
  select i.id, v.label, v.price, v.sort_order
  from (values
    ('Tandoori Chicken',        '4 Pieces', 299, 10), ('Tandoori Chicken',        '8 Pieces', 549, 20),
    ('Afgani Tandoori Chicken', '4 Pieces', 349, 10), ('Afgani Tandoori Chicken', '8 Pieces', 599, 20),
    ('Chicken Angara Tikka',    '4 Pieces', 169, 10), ('Chicken Angara Tikka',    '8 Pieces', 329, 20),
    ('Chicken Aachari Tikka',   '4 Pieces', 169, 10), ('Chicken Aachari Tikka',   '8 Pieces', 329, 20),
    ('Chicken Garlic Tikka',    '4 Pieces', 169, 10), ('Chicken Garlic Tikka',    '8 Pieces', 329, 20),
    ('Chicken Kalimiri Tikka',  '4 Pieces', 169, 10), ('Chicken Kalimiri Tikka',  '8 Pieces', 329, 20),
    ('Chicken Tikka Kebab',     '4 Pieces', 169, 10), ('Chicken Tikka Kebab',     '8 Pieces', 329, 20),
    ('Chicken Hariyali Tikka',  '4 Pieces', 169, 10), ('Chicken Hariyali Tikka',  '8 Pieces', 329, 20)
  ) as v(item, label, price, sort_order)
  join public.menu_items i on i.name = v.item;

  raise notice 'Seeded % categories and % items.',
    (select count(*) from public.menu_categories),
    (select count(*) from public.menu_items);
end
$seed$;

-- ---------- Restaurant settings (from the "Business details" on the menu) ----------
-- WhatsApp, Instagram and opening hours were not on the menu: fill them in from /admin -> Settings.
insert into public.restaurant_settings
  (name, tagline, phone, address, branches, description)
values (
  'House of Dum',
  'Hyderabadi Dum Biryani & Kababs',
  '+91 9209383121',
  'Shop No. 1, Meghdoot Height, Besides Pizza Hut, South Ambazari Road, Shraddhanand Peth, Nagpur',
  'Laxmi Nagar | MIHAN',
  'House of Dum serves Hyderabadi dum biryani, tandoori tikkas and kababs in Nagpur. Browse the menu, add your favourites to the cart and order online for delivery.'
)
on conflict (singleton) do nothing;
