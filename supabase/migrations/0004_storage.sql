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
