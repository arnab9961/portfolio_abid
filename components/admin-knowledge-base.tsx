'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, RefreshCw, Search, Trash2, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const categories = ['Personal Biography', 'Professional Background', 'Artistic Journey', 'Education and Training', 'Artistic Style and Philosophy', '3D Landscape Art Techniques', 'Software and Tools', 'Portfolio and Projects', 'Awards and Achievements', 'Exhibitions and Events', 'Professional Experience', 'Collaborations and Commissions', 'Frequently Asked Questions', 'Contact and Booking Information', 'Other Information']
type Language = 'en' | 'bn' | 'ja'
type Status = 'draft' | 'published'
type Entry = { id: string; title: string; category: string; content: string; language: Language; tags: string[]; source_url: string; status: Status; indexing_status: 'pending' | 'processing' | 'indexed' | 'failed'; indexing_error: string | null; created_at: string; updated_at: string }
const empty: Omit<Entry, 'id' | 'indexing_status' | 'indexing_error' | 'created_at' | 'updated_at'> = { title: '', category: categories[0], content: '', language: 'en', tags: [], source_url: '', status: 'draft' }

export function AdminKnowledgeBase({ onSaved }: { onSaved: (message: string) => void }) {
  const supabase = useMemo(() => createClient(), [])
  const [entries, setEntries] = useState<Entry[]>([])
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [status, setStatus] = useState<'all' | Status>('all')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [testQuestion, setTestQuestion] = useState('')
  const [testResult, setTestResult] = useState<{ answer: string; language: string; retrieved: Array<Record<string, unknown>>; embeddings: boolean; sufficientContext: boolean } | null>(null)
  const [testing, setTesting] = useState(false)

  async function load() {
    setLoading(true)
    const { data, error: loadError } = await supabase.from('knowledge_entries').select('*').order('updated_at', { ascending: false })
    if (loadError) setError(loadError.message)
    setEntries((data || []) as Entry[])
    setLoading(false)
  }
  useEffect(() => { load() }, [])
  const filtered = entries.filter(entry => `${entry.title} ${entry.category} ${entry.tags.join(' ')}`.toLowerCase().includes(query.toLowerCase()) && (category === 'all' || entry.category === category) && (status === 'all' || entry.status === status))
  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) { setForm(current => ({ ...current, [key]: value })) }
  function reset() { setEditing(null); setForm(empty) }

  async function save(event: FormEvent) {
    event.preventDefault()
    if (!form.title.trim() || !form.content.trim()) { setError('Title and detailed content are required.'); return }
    setSaving(true); setError('')
    try {
      const payload = { ...form, title: form.title.trim(), content: form.content.trim(), tags: form.tags.map(tag => tag.trim()).filter(Boolean), source_url: form.source_url.trim() || null, updated_at: new Date().toISOString(), indexing_status: 'pending', indexing_error: null }
      const result = editing ? await supabase.from('knowledge_entries').update(payload).eq('id', editing).select('*').single() : await supabase.from('knowledge_entries').insert(payload).select('*').single()
      if (result.error) throw new Error(result.error.message)
      const entry = result.data as Entry
      const indexResponse = await fetch('/api/admin/knowledge/index', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entryId: entry.id }) })
      const indexResult = await indexResponse.json()
      if (!indexResponse.ok) throw new Error(indexResult.error || 'Indexing failed.')
      await load(); reset(); onSaved(indexResult.status === 'indexed' ? 'Knowledge entry saved and indexed' : 'Draft saved')
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'Unable to save knowledge entry.') }
    finally { setSaving(false) }
  }
  async function remove(id: string) {
    if (!window.confirm('Delete this knowledge entry and its searchable chunks?')) return
    const { error: deleteError } = await supabase.from('knowledge_entries').delete().eq('id', id)
    if (deleteError) setError(deleteError.message); else { await load(); onSaved('Knowledge entry deleted') }
  }
  async function reindex(id: string) {
    setError('')
    const response = await fetch('/api/admin/knowledge/index', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entryId: id }) })
    const result = await response.json()
    if (!response.ok) setError(result.error || 'Indexing failed.'); else { await load(); onSaved(result.status === 'indexed' ? 'Entry indexed' : 'Draft removed from search') }
  }
  async function testQuestionSubmit(event: FormEvent) {
    event.preventDefault(); setTesting(true); setError('')
    try {
      const response = await fetch('/api/admin/knowledge/test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: testQuestion }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Test failed.')
      setTestResult(result)
    } catch (testError) { setError(testError instanceof Error ? testError.message : 'Test failed.') }
    finally { setTesting(false) }
  }
  return <section className="mt-8">
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="eyebrow">AI Knowledge Base</p><h2 className="mt-2 font-serif text-4xl">Teach the gallery assistant</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-charcoal/55">Published entries are chunked and indexed for retrieval. Drafts remain private.</p></div><button onClick={reset} className="flex items-center gap-2 self-start bg-charcoal px-4 py-3 text-[10px] uppercase tracking-[.13em] text-paper"><Plus className="size-4"/> New entry</button></div>
    {error && <p role="alert" className="mt-5 border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
    <form onSubmit={save} className="mt-8 border border-charcoal/10 bg-white p-6 md:p-8"><div className="flex items-center justify-between"><div><p className="eyebrow">{editing ? 'Edit entry' : 'New entry'}</p><h3 className="mt-2 font-serif text-2xl">Knowledge details</h3></div>{editing && <button type="button" onClick={reset} aria-label="Cancel editing"><X className="size-5"/></button>}</div><div className="mt-6 grid gap-5 md:grid-cols-2"><label className="field">Title<input required value={form.title} onChange={event => update('title', event.target.value)} /></label><label className="field">Category<select value={form.category} onChange={event => update('category', event.target.value)}>{categories.map(option => <option key={option}>{option}</option>)}</select></label><label className="field">Language<select value={form.language} onChange={event => update('language', event.target.value as Language)}><option value="en">English</option><option value="bn">Bangla</option><option value="ja">Japanese</option></select></label><label className="field">Status<select value={form.status} onChange={event => update('status', event.target.value as Status)}><option value="draft">Draft</option><option value="published">Published</option></select></label><label className="field md:col-span-2">Tags / keywords<input value={form.tags.join(', ')} onChange={event => update('tags', event.target.value.split(',').map(tag => tag.trim()))} placeholder="landscape, Blender, commissions" /></label><label className="field md:col-span-2">Source / reference URL<input type="url" value={form.source_url} onChange={event => update('source_url', event.target.value)} /></label><label className="field md:col-span-2">Detailed content<textarea required rows={12} value={form.content} onChange={event => update('content', event.target.value)} placeholder="Write the approved information the assistant may use…" /></label></div><div className="mt-6 flex gap-3"><button disabled={saving} className="bg-charcoal px-5 py-3 text-[10px] uppercase tracking-[.13em] text-paper disabled:opacity-50">{saving ? 'Saving and indexing…' : editing ? 'Update entry' : 'Save entry'}</button>{editing && <button type="button" onClick={reset} className="border border-charcoal/15 px-5 py-3 text-[10px] uppercase tracking-[.13em]">Cancel</button>}</div></form>
    <div className="mt-10 flex flex-col gap-3 md:flex-row"><label className="flex flex-1 items-center gap-2 border border-charcoal/15 bg-white px-3 py-2"><Search className="size-4 text-charcoal/45"/><span className="sr-only">Search knowledge</span><input className="w-full bg-transparent text-sm outline-none" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search entries and tags" /></label><select className="border border-charcoal/15 bg-transparent px-3 text-xs" value={category} onChange={event => setCategory(event.target.value)}><option value="all">All categories</option>{categories.map(option => <option key={option}>{option}</option>)}</select><select className="border border-charcoal/15 bg-transparent px-3 text-xs" value={status} onChange={event => setStatus(event.target.value as 'all' | Status)}><option value="all">All status</option><option value="published">Published</option><option value="draft">Draft</option></select></div>
    <div className="mt-5 divide-y divide-charcoal/10 border-y border-charcoal/10">{loading ? <p className="py-8 text-sm text-charcoal/50">Loading knowledge…</p> : filtered.map(entry => <article key={entry.id} className="py-5"><div className="flex flex-col justify-between gap-4 md:flex-row md:items-start"><div><p className="eyebrow text-olive">{entry.category} · {entry.language.toUpperCase()} · {entry.status}</p><h3 className="mt-1 font-serif text-2xl">{entry.title}</h3><p className="mt-2 line-clamp-2 max-w-3xl text-sm leading-6 text-charcoal/60">{entry.content}</p><p className="mt-2 text-[10px] uppercase tracking-[.12em] text-charcoal/45">{entry.indexing_status}{entry.indexing_error ? ` · ${entry.indexing_error}` : ''}</p></div><div className="flex shrink-0 gap-3 text-[10px] uppercase tracking-[.12em]"><button onClick={() => { setEditing(entry.id); setForm({ title: entry.title, category: entry.category, content: entry.content, language: entry.language, tags: entry.tags, source_url: entry.source_url || '', status: entry.status }); window.scrollTo({ top: 0, behavior: 'smooth' }) }} className="flex items-center gap-1"><Pencil className="size-3"/> Edit</button><button onClick={() => reindex(entry.id)} className="flex items-center gap-1"><RefreshCw className="size-3"/> Index</button><button onClick={() => remove(entry.id)} className="flex items-center gap-1 text-red-700"><Trash2 className="size-3"/> Delete</button></div></div></article>)}</div>
    <form onSubmit={testQuestionSubmit} className="mt-12 border border-olive/25 bg-olive/10 p-6 md:p-8"><p className="eyebrow text-olive">Test AI Chatbot</p><h3 className="mt-2 font-serif text-3xl">Inspect retrieval before publishing</h3><div className="mt-5 flex gap-3"><input required value={testQuestion} onChange={event => setTestQuestion(event.target.value)} className="min-w-0 flex-1 border border-charcoal/15 bg-paper px-3 py-3 text-sm outline-none" placeholder="Ask a question about the knowledge base" /><button disabled={testing} className="bg-charcoal px-4 py-3 text-[10px] uppercase tracking-[.12em] text-paper disabled:opacity-50">{testing ? 'Testing…' : 'Test'}</button></div>{testResult && <div className="mt-6 space-y-4 text-sm"><p><strong>Language:</strong> {testResult.language} · <strong>Context:</strong> {testResult.sufficientContext ? 'sufficient' : 'insufficient'} · <strong>Embeddings:</strong> {testResult.embeddings ? 'used' : 'not configured'}</p><div className="border border-charcoal/10 bg-paper p-4 leading-6"><strong>Answer</strong><p className="mt-2 whitespace-pre-wrap">{testResult.answer}</p></div><div><strong>Retrieved chunks</strong>{testResult.retrieved.map((chunk, index) => <p key={index} className="mt-2 border-t border-charcoal/10 pt-2 text-xs text-charcoal/65">{String(chunk.title)} · {String(chunk.category)}{chunk.similarity !== undefined ? ` · score ${Number(chunk.similarity).toFixed(3)}` : ''}</p>)}</div></div>}</form>
  </section>
}
