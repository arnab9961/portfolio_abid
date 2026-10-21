create extension if not exists "pgcrypto";

create table if not exists public.artist_profile (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Abid Hossain',
  discipline text not null default '3D Landscape Artist',
  portrait text not null default '/artist-portrait.jpg',
  bio_en text not null default '',
  bio_bn text not null default '',
  bio_ja text not null default '',
  email text not null default '',
  phone text not null default '',
  whatsapp text not null default '',
  updated_at timestamptz not null default now(),
  constraint artist_profile_singleton check (id = '00000000-0000-0000-0000-000000000001')
);

insert into public.artist_profile (id, bio_en, bio_bn, bio_ja) values (
  '00000000-0000-0000-0000-000000000001',
  'Biography placeholder — add the artist’s story, practice, and background here.',
  'জীবনী প্লেসহোল্ডার — শিল্পীর গল্প, শিল্পচর্চা এবং পরিচয় এখানে যোগ করুন।',
  '略歴プレースホルダー — アーティストの物語、制作活動、背景をここに追加してください。'
)
on conflict (id) do nothing;

create table if not exists public.artworks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  title_bn text,
  title_ja text,
  category text not null,
  year text,
  description text not null default '',
  description_bn text,
  description_ja text,
  image text not null,
  featured boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  title_bn text,
  title_ja text,
  type text not null check (type in ('Awards & Recognition', 'Exhibitions', 'Events & Workshops', 'Professional Activities', 'Places Visited', 'Other Activities')),
  date text not null default '',
  location text not null default '',
  description text not null default '',
  description_bn text,
  description_ja text,
  image text,
  additional_images text[] not null default '{}',
  external_url text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.artist_profile enable row level security;
alter table public.artworks enable row level security;
alter table public.activities enable row level security;

create policy "public can read profile" on public.artist_profile for select using (true);
create policy "public can read published artworks" on public.artworks for select using (status = 'published');
create policy "public can read published activities" on public.activities for select using (status = 'published');
create policy "admins manage profile" on public.artist_profile for all using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin') with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
create policy "admins manage artworks" on public.artworks for all using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin') with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
create policy "admins manage activities" on public.activities for all using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin') with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

insert into storage.buckets (id, name, public) values
  ('artworks', 'artworks', true),
  ('activities', 'activities', true),
  ('profile', 'profile', true)
on conflict (id) do nothing;

create policy "public image read" on storage.objects for select using (bucket_id in ('artworks', 'activities', 'profile'));
create policy "admins upload images" on storage.objects for insert with check (bucket_id in ('artworks', 'activities', 'profile') and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
create policy "admins update images" on storage.objects for update using (bucket_id in ('artworks', 'activities', 'profile') and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
create policy "admins delete images" on storage.objects for delete using (bucket_id in ('artworks', 'activities', 'profile') and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
