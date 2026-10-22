'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, Trash2, X } from 'lucide-react'
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
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [documentFile, setDocumentFile] = useState<File | null>(null)

  async function load() {
    setLoading(true)
    const { data, error: loadError } = await supabase.from('knowledge_entries').select('*').order('updated_at', { ascending: false })
    if (loadError) setError(loadError.message)
    setEntries((data || []) as Entry[])
    setLoading(false)
  }
  useEffect(() => { load() }, [])
  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) { setForm(current => ({ ...current, [key]: value })) }
  function reset() { setEditing(null); setForm(empty); setDocumentFile(null) }
  async function loadDocument(file: File | undefined) {
    if (!file) return
    const allowed = ['text/plain', 'text/markdown', 'application/json']
    if (!allowed.includes(file.type) && !/\.(txt|md|markdown|json)$/i.test(file.name)) {
      setError('Please upload a text, Markdown, or JSON document.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Documents must be 2 MB or smaller.')
      return
    }
    const content = await file.text()
    setDocumentFile(file)
    setForm(current => ({ ...current, title: current.title || file.name.replace(/\.(txt|md|markdown|json)$/i, ''), content }))
    setError('')
  }

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
  return <section className="mt-8">
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="eyebrow">AI Knowledge Base</p><h2 className="mt-2 font-serif text-4xl">Teach the gallery assistant</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-charcoal/55">Published entries are chunked and indexed for retrieval. Drafts remain private.</p></div><button onClick={reset} className="flex items-center gap-2 self-start bg-charcoal px-4 py-3 text-[10px] uppercase tracking-[.13em] text-paper"><Plus className="size-4"/> New entry</button></div>
    {error && <p role="alert" className="mt-5 border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
    <form onSubmit={save} className="mt-8 border border-charcoal/10 bg-white p-6 md:p-8"><div className="flex items-center justify-between"><div><p className="eyebrow">{editing ? 'Edit information' : 'Add information'}</p><h3 className="mt-2 font-serif text-2xl">Simple knowledge entry</h3></div>{editing && <button type="button" onClick={reset} aria-label="Cancel editing"><X className="size-5"/></button>}</div><div className="mt-6 space-y-5"><label className="field">Title<input required value={form.title} onChange={event => update('title', event.target.value)} placeholder="For example: About Abid Hossain" /></label><label className="field">Upload a document<input type="file" accept=".txt,.md,.markdown,.json,text/plain,text/markdown,application/json" onChange={event => loadDocument(event.target.files?.[0])} />{documentFile && <span className="text-xs normal-case text-charcoal/50">{documentFile.name} loaded</span>}<span className="text-xs normal-case text-charcoal/45">Use a .txt, .md, or .json file.</span></label><label className="field">Information<textarea required rows={14} value={form.content} onChange={event => update('content', event.target.value)} placeholder="Write or paste information about Abid Hossain here…" /></label><div className="grid gap-5 md:grid-cols-2"><label className="field">Language<select value={form.language} onChange={event => update('language', event.target.value as Language)}><option value="en">English</option><option value="bn">Bangla</option><option value="ja">Japanese</option></select></label><label className="field">Publish<select value={form.status} onChange={event => update('status', event.target.value as Status)}><option value="draft">Keep as draft</option><option value="published">Publish for chatbot</option></select></label></div></div><div className="mt-6 flex gap-3"><button disabled={saving} className="bg-charcoal px-5 py-3 text-[10px] uppercase tracking-[.13em] text-paper disabled:opacity-50">{saving ? 'Saving and indexing…' : editing ? 'Update information' : 'Save information'}</button>{editing && <button type="button" onClick={reset} className="border border-charcoal/15 px-5 py-3 text-[10px] uppercase tracking-[.13em]">Cancel</button>}</div></form>
    <div className="mt-10 divide-y divide-charcoal/10 border-y border-charcoal/10">{loading ? <p className="py-8 text-sm text-charcoal/50">Loading information…</p> : entries.map(entry => <article key={entry.id} className="py-5"><div className="flex flex-col justify-between gap-4 md:flex-row md:items-start"><div><p className="eyebrow text-olive">{entry.language.toUpperCase()} · {entry.status}</p><h3 className="mt-1 font-serif text-2xl">{entry.title}</h3><p className="mt-2 line-clamp-2 max-w-3xl text-sm leading-6 text-charcoal/60">{entry.content}</p><p className="mt-2 text-[10px] uppercase tracking-[.12em] text-charcoal/45">{entry.indexing_status}{entry.indexing_error ? ` · ${entry.indexing_error}` : ''}</p></div><div className="flex shrink-0 gap-3 text-[10px] uppercase tracking-[.12em]"><button onClick={() => { setEditing(entry.id); setForm({ title: entry.title, category: entry.category, content: entry.content, language: entry.language, tags: entry.tags, source_url: entry.source_url || '', status: entry.status }); window.scrollTo({ top: 0, behavior: 'smooth' }) }} className="flex items-center gap-1"><Pencil className="size-3"/> Edit</button><button onClick={() => remove(entry.id)} className="flex items-center gap-1 text-red-700"><Trash2 className="size-3"/> Delete</button></div></div></article>)}</div>
  </section>
}
