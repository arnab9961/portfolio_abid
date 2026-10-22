drop index if exists public.knowledge_chunks_embedding_idx;

alter table public.knowledge_chunks
  drop column if exists embedding;

alter table public.knowledge_chunks
  add column embedding vector(768);

create index if not exists knowledge_chunks_embedding_idx
  on public.knowledge_chunks using hnsw (embedding vector_cosine_ops);

create or replace function public.match_knowledge_chunks(
  query_embedding vector(768),
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
