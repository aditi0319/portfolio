-- =========================================================
-- Portfolio: Supabase setup
-- 1) Find & replace every YOUR_EMAIL@example.com below with the
--    email you will log in to the admin panel with.
-- 2) Paste this whole file into Supabase → SQL Editor → Run.
-- =========================================================

-- ---------- Table that stores your work ----------
create table if not exists public.works (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  category     text not null default 'other',
  type         text not null check (type in ('image', 'video', 'embed')),
  media_url    text not null,
  storage_path text,
  cover_url    text,
  cover_path   text,
  client       text,
  featured     boolean not null default false,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now()
);

alter table public.works enable row level security;

-- Anyone can view your portfolio
drop policy if exists "works_public_read" on public.works;
create policy "works_public_read" on public.works
  for select using (true);

-- Only YOU (logged in with your email) can add / edit / delete
drop policy if exists "works_owner_insert" on public.works;
create policy "works_owner_insert" on public.works
  for insert to authenticated
  with check ((auth.jwt() ->> 'email') = 'YOUR_EMAIL@example.com');

drop policy if exists "works_owner_update" on public.works;
create policy "works_owner_update" on public.works
  for update to authenticated
  using ((auth.jwt() ->> 'email') = 'YOUR_EMAIL@example.com')
  with check ((auth.jwt() ->> 'email') = 'YOUR_EMAIL@example.com');

drop policy if exists "works_owner_delete" on public.works;
create policy "works_owner_delete" on public.works
  for delete to authenticated
  using ((auth.jwt() ->> 'email') = 'YOUR_EMAIL@example.com');

-- ---------- Storage bucket for images & videos (public, 50 MB max per file) ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('portfolio', 'portfolio', true, 52428800, array['image/*', 'video/*'])
on conflict (id) do update set public = true;

drop policy if exists "portfolio_public_read" on storage.objects;
create policy "portfolio_public_read" on storage.objects
  for select using (bucket_id = 'portfolio');

drop policy if exists "portfolio_owner_write" on storage.objects;
create policy "portfolio_owner_write" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'portfolio' and (auth.jwt() ->> 'email') = 'YOUR_EMAIL@example.com');

drop policy if exists "portfolio_owner_update" on storage.objects;
create policy "portfolio_owner_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'portfolio' and (auth.jwt() ->> 'email') = 'YOUR_EMAIL@example.com');

drop policy if exists "portfolio_owner_delete" on storage.objects;
create policy "portfolio_owner_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'portfolio' and (auth.jwt() ->> 'email') = 'YOUR_EMAIL@example.com');
