create table if not exists public.music_settings (
  id uuid primary key default '00000000-0000-0000-0000-000000000002',
  enabled boolean not null default false,
  track_title text not null default '',
  audio_url text not null default '',
  attribution text,
  license text,
  updated_at timestamptz not null default now(),
  constraint music_settings_singleton check (id = '00000000-0000-0000-0000-000000000002')
);

insert into public.music_settings (id)
values ('00000000-0000-0000-0000-000000000002')
on conflict (id) do nothing;

create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  whatsapp text,
  inquiry_type text not null check (inquiry_type in ('commission', 'collaboration', 'exhibition', 'new-project', 'other')),
  project_description text not null,
  budget text,
  deadline text,
  preferred_contact text not null check (preferred_contact in ('email', 'whatsapp', 'phone')),
  created_at timestamptz not null default now()
);

alter table public.music_settings enable row level security;
alter table public.inquiries enable row level security;

create policy "public can read enabled music settings"
  on public.music_settings for select to anon, authenticated
  using (enabled = true and audio_url <> '');
create policy "admins manage music settings"
  on public.music_settings for all to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
create policy "admins can read inquiries"
  on public.inquiries for select to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
create policy "admins can manage inquiries"
  on public.inquiries for all to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
create policy "public can submit inquiries"
  on public.inquiries for insert to anon, authenticated
  with check (true);

insert into storage.buckets (id, name, public)
values ('music', 'music', true)
on conflict (id) do nothing;

create policy "public can read music"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'music');
create policy "admins manage music"
  on storage.objects for all to authenticated
  using (bucket_id = 'music' and (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check (bucket_id = 'music' and (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
