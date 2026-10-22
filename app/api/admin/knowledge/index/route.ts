import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createEmbedding } from '@/lib/server-embeddings'

type Entry = {
  id: string
  title: string
  category: string
  content: string
  language: 'en' | 'bn' | 'ja'
  status: 'draft' | 'published'
}

function chunks(text: string, size = 1200, overlap = 180) {
  const normalized = text.replace(/\r\n/g, '\n').trim()
  const result: string[] = []
  let start = 0
  while (start < normalized.length) {
    let end = Math.min(start + size, normalized.length)
    if (end < normalized.length) {
      const boundary = Math.max(normalized.lastIndexOf('\n', end), normalized.lastIndexOf('. ', end), normalized.lastIndexOf('。', end))
      if (boundary > start + Math.floor(size * 0.55)) end = boundary + 1
    }
    result.push(normalized.slice(start, end).trim())
    if (end >= normalized.length) break
    start = Math.max(end - overlap, start + 1)
  }
  return result.filter(Boolean)
}

async function isAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return Boolean(user?.app_metadata?.role === 'admin')
}

export async function POST(request: Request) {
  if (!await isAdmin()) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  const body = await request.json().catch(() => null)
  const entryId = typeof body?.entryId === 'string' ? body.entryId : ''
  if (!entryId) return NextResponse.json({ error: 'An entry ID is required.' }, { status: 400 })
  const supabase = await createClient()
  const { data: entry, error: entryError } = await supabase.from('knowledge_entries').select('id,title,category,content,language,status').eq('id', entryId).single() as { data: Entry | null; error: { message: string } | null }
  if (entryError || !entry) return NextResponse.json({ error: entryError?.message || 'Knowledge entry not found.' }, { status: 404 })
  await supabase.from('knowledge_entries').update({ indexing_status: 'processing', indexing_error: null, updated_at: new Date().toISOString() }).eq('id', entry.id)
  await supabase.from('knowledge_chunks').delete().eq('entry_id', entry.id)
  if (entry.status !== 'published') {
    await supabase.from('knowledge_entries').update({ indexing_status: 'pending', indexing_error: null }).eq('id', entry.id)
    return NextResponse.json({ status: 'pending', chunks: 0, embeddings: false })
  }
  try {
    const entryChunks = chunks(entry.content)
    const rows = []
    for (let index = 0; index < entryChunks.length; index += 1) {
      rows.push({
        entry_id: entry.id, chunk_index: index, title: entry.title, category: entry.category,
        language: entry.language, content: entryChunks[index], embedding: await createEmbedding(`${entry.title}\n${entry.category}\n${entryChunks[index]}`),
      })
    }
    const { error: insertError } = await supabase.from('knowledge_chunks').insert(rows)
    if (insertError) throw new Error(insertError.message)
    await supabase.from('knowledge_entries').update({ indexing_status: 'indexed', indexing_error: null, updated_at: new Date().toISOString() }).eq('id', entry.id)
    return NextResponse.json({ status: 'indexed', chunks: rows.length, embeddings: Boolean(process.env.GEMINI_API_KEY || (process.env.EMBEDDING_API_KEY && process.env.EMBEDDING_MODEL)) })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Indexing failed.'
    await supabase.from('knowledge_entries').update({ indexing_status: 'failed', indexing_error: message }).eq('id', entry.id)
    return NextResponse.json({ error: message, status: 'failed' }, { status: 502 })
  }
}
