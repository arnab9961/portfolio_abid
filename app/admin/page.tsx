'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Check, LogOut, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Activity, ActivityType } from '@/lib/portfolio-data'

const types: ActivityType[] = ['Awards & Recognition', 'Exhibitions', 'Events & Workshops', 'Professional Activities', 'Places Visited', 'Other Activities']
const blank: Omit<Activity, 'id'> = { title: '', type: 'Exhibitions', date: '', location: '', description: '', image: '', additionalImages: [], externalUrl: '', status: 'draft' }

export default function AdminPage() {
  const supabase = useMemo(() => createClient(), [])
  const [items, setItems] = useState<Activity[]>([])
  const [form, setForm] = useState(blank)
  const [editing, setEditing] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  async function load() {
    const { data, error: loadError } = await supabase.from('activities').select('*').order('created_at', { ascending: false })
    if (loadError) setError(loadError.message)
    else setItems((data || []).map(row => ({ id: row.id, title: row.title, type: row.type, date: row.date, location: row.location, description: row.description, image: row.image || '', additionalImages: row.additional_images || [], externalUrl: row.external_url || '', status: row.status })))
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function save(event: FormEvent) {
    event.preventDefault()
    setError('')
    const payload = { title: form.title.trim(), type: form.type, date: form.date, location: form.location, description: form.description.trim(), image: form.image || null, additional_images: form.additionalImages || [], external_url: form.externalUrl || null, status: form.status, updated_at: new Date().toISOString() }
    if (!payload.title || !payload.description) { setError('Title and description are required.'); return }
    const result = editing
      ? await supabase.from('activities').update(payload).eq('id', editing)
      : await supabase.from('activities').insert(payload)
    if (result.error) setError(result.error.message)
    else { setNotice('Changes saved'); setForm(blank); setEditing(null); await load(); window.setTimeout(() => setNotice(''), 1800) }
  }

  async function remove(id: string | number) {
    if (!window.confirm('Delete this activity?')) return
    const { error: deleteError } = await supabase.from('activities').delete().eq('id', id)
    if (deleteError) setError(deleteError.message)
    else { setNotice('Entry deleted'); await load() }
  }

  async function logout() { await supabase.auth.signOut(); window.location.href = '/admin/login' }
  const filtered = items.filter(item => `${item.title} ${item.type} ${item.location}`.toLowerCase().includes(query.toLowerCase()) && (status === 'all' || item.status === status))

  return <main className="min-h-screen bg-paper text-charcoal"><header className="border-b border-charcoal/10 px-5 py-5 md:px-10"><div className="mx-auto flex max-w-7xl items-center justify-between"><a href="/" className="flex items-center gap-2 text-sm"><ArrowLeft className="size-4"/> Back to portfolio</a><span className="font-serif text-xl">Abid<span className="text-olive">.</span> / studio</span><button onClick={logout} className="flex items-center gap-2 text-[10px] uppercase tracking-[.13em]"><LogOut className="size-4"/> Sign out</button></div></header><div className="mx-auto max-w-7xl px-5 py-12 md:px-10"><div className="flex flex-col justify-between gap-6 md:flex-row md:items-end"><div><p className="eyebrow">Private workspace</p><h1 className="mt-3 font-serif text-5xl tracking-[-.06em]">Studio overview</h1><p className="mt-3 text-sm text-charcoal/55">Manage awards, exhibitions, and activities stored in Supabase.</p></div>{notice && <p className="flex items-center gap-2 text-sm text-olive"><Check className="size-4"/> {notice}</p>}</div>{error && <p role="alert" className="mt-6 border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}<form onSubmit={save} className="mt-12 border border-charcoal/10 bg-white p-6 md:p-8"><div className="mb-8 flex items-center justify-between"><div><p className="eyebrow">{editing ? 'Edit entry' : 'Add entry'}</p><h2 className="mt-2 font-serif text-3xl">Awards & Activities</h2></div>{editing && <button type="button" onClick={() => { setEditing(null); setForm(blank) }} aria-label="Cancel editing"><X/></button>}</div><div className="grid gap-6 md:grid-cols-2"><label className="field">Cover image URL<input type="url" value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} placeholder="Supabase public image URL"/></label><label className="field">Title<input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></label><label className="field">Activity type<select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as ActivityType })}>{types.map(type => <option key={type}>{type}</option>)}</select></label><label className="field">Date or year<input value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} placeholder="2025"/></label><label className="field">Location or venue<input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} /></label><label className="field">External URL<input type="url" value={form.externalUrl} onChange={e => setForm({ ...form, externalUrl: e.target.value })} /></label><label className="field md:col-span-2">Description<textarea required rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></label><label className="field">Status<select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as Activity['status'] })}><option value="draft">Draft</option><option value="published">Published</option></select></label></div><button className="mt-8 inline-flex items-center gap-2 bg-charcoal px-5 py-3 text-[11px] uppercase tracking-[.13em] text-paper"><Plus className="size-4"/> {editing ? 'Update entry' : 'Save entry'}</button></form><section className="mt-12"><div className="flex flex-col justify-between gap-4 border-b border-charcoal/10 pb-5 md:flex-row md:items-center"><div><p className="eyebrow">Published & draft content</p><h2 className="mt-2 font-serif text-3xl">Activity library</h2></div><div className="flex gap-3"><label className="flex items-center gap-2 border border-charcoal/15 px-3 py-2"><Search className="size-4 text-charcoal/45"/><span className="sr-only">Search activities</span><input className="w-36 bg-transparent text-sm outline-none" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search"/></label><select className="border border-charcoal/15 bg-transparent px-3 text-xs" value={status} onChange={e => setStatus(e.target.value)}><option value="all">All status</option><option value="published">Published</option><option value="draft">Draft</option></select></div></div>{loading ? <p className="py-10 text-sm text-charcoal/50">Loading content…</p> : <div className="divide-y divide-charcoal/10">{filtered.map(item => <div key={item.id} className="flex flex-col gap-4 py-5 md:flex-row md:items-center md:justify-between"><div><p className="eyebrow text-olive">{item.type} · {item.status}</p><h3 className="mt-1 font-serif text-2xl">{item.title}</h3><p className="text-xs text-charcoal/50">{item.date} · {item.location}</p></div><div className="flex gap-4 text-[10px] uppercase tracking-[.13em]"><button onClick={() => { setEditing(String(item.id)); setForm({ title: item.title, type: item.type, date: item.date, location: item.location, description: item.description, image: item.image, additionalImages: item.additionalImages || [], externalUrl: item.externalUrl || '', status: item.status }) }} className="inline-flex items-center gap-2"><Pencil className="size-4"/> Edit</button><button onClick={() => remove(item.id)} className="inline-flex items-center gap-2 text-charcoal/55"><Trash2 className="size-4"/> Delete</button></div></div>)}</div>}</section></div></main>
}
