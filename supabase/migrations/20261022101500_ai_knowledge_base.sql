create extension if not exists vector;

create table if not exists public.knowledge_entries (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  content text not null,
  language text not null check (language in ('en', 'bn', 'ja')),
  tags text[] not null default '{}',
  source_url text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  indexing_status text not null default 'pending' check (indexing_status in ('pending', 'processing', 'indexed', 'failed')),
  indexing_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.knowledge_entries(id) on delete cascade,
  chunk_index integer not null,
  title text not null,
  category text not null,
  language text not null check (language in ('en', 'bn', 'ja')),
  content text not null,
  embedding vector(1536),
  search_vector tsvector generated always as (
    to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(category, '') || ' ' || coalesce(content, ''))
  ) stored,
  created_at timestamptz not null default now(),
  unique (entry_id, chunk_index)
);

create index if not exists knowledge_entries_status_language_idx
  on public.knowledge_entries (status, language, updated_at desc);
create index if not exists knowledge_chunks_search_idx
  on public.knowledge_chunks using gin (search_vector);
create index if not exists knowledge_chunks_embedding_idx
  on public.knowledge_chunks using hnsw (embedding vector_cosine_ops);

alter table public.knowledge_entries enable row level security;
alter table public.knowledge_chunks enable row level security;

create policy "public can read indexed published knowledge"
  on public.knowledge_entries for select to anon, authenticated
  using (status = 'published' and indexing_status = 'indexed');
create policy "admins manage knowledge entries"
  on public.knowledge_entries for all to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
create policy "public can read published knowledge chunks"
  on public.knowledge_chunks for select to anon, authenticated
  using (exists (
    select 1 from public.knowledge_entries entry
    where entry.id = knowledge_chunks.entry_id
      and entry.status = 'published'
      and entry.indexing_status = 'indexed'
  ));
create policy "admins manage knowledge chunks"
  on public.knowledge_chunks for all to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create or replace function public.match_knowledge_chunks(
  query_embedding vector(1536),
  match_language text,
  match_count integer default 6
)
returns table (
  id uuid,
  entry_id uuid,
  title text,
  category text,
  language text,
  content text,
  similarity real
)
language sql
stable
as $$
  select chunk.id, chunk.entry_id, chunk.title, chunk.category, chunk.language,
    chunk.content, (1 - (chunk.embedding <=> query_embedding))::real
  from public.knowledge_chunks chunk
  join public.knowledge_entries entry on entry.id = chunk.entry_id
  where chunk.embedding is not null
    and entry.status = 'published'
    and entry.indexing_status = 'indexed'
    and (match_language = '' or chunk.language = match_language)
  order by chunk.embedding <=> query_embedding
  limit greatest(1, least(match_count, 12));
$$;

grant execute on function public.match_knowledge_chunks(vector(1536), text, integer) to anon, authenticated;
