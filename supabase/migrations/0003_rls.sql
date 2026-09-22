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
