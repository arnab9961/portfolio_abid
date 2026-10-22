'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Check, ImagePlus, LogOut, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Activity, ActivityType, Artwork, ArtistProfile } from '@/lib/portfolio-data'
import { AdminMusicSettings } from '@/components/admin-music-settings'
import { AdminKnowledgeBase } from '@/components/admin-knowledge-base'

const activityTypes: ActivityType[] = ['Awards & Recognition', 'Exhibitions', 'Events & Workshops', 'Professional Activities', 'Places Visited', 'Other Activities']
type Tab = 'profile' | 'artworks' | 'activities' | 'music' | 'knowledge'
type Status = 'draft' | 'published'
type ArtworkForm = Omit<Artwork, 'id' | 'status'> & { status: Status }
type ActivityForm = Omit<Activity, 'id' | 'status'> & { status: Status }

const emptyArtwork: ArtworkForm = { title: '', titleBn: '', titleJa: '', category: '', year: '', description: '', descriptionBn: '', descriptionJa: '', image: '', featured: false, status: 'draft' }
const emptyActivity: ActivityForm = { title: '', titleBn: '', titleJa: '', type: 'Exhibitions', date: '', location: '', description: '', descriptionBn: '', descriptionJa: '', image: '', additionalImages: [], externalUrl: '', status: 'draft' }

function mapArtwork(row: Record<string, unknown>): Artwork {
  return { id: String(row.id), title: String(row.title || ''), titleBn: String(row.title_bn || ''), titleJa: String(row.title_ja || ''), category: String(row.category || ''), year: String(row.year || ''), description: String(row.description || ''), descriptionBn: String(row.description_bn || ''), descriptionJa: String(row.description_ja || ''), image: String(row.image || ''), featured: Boolean(row.featured), status: row.status === 'published' ? 'published' : 'draft' }
}

function mapActivity(row: Record<string, unknown>): Activity {
  return { id: String(row.id), title: String(row.title || ''), titleBn: String(row.title_bn || ''), titleJa: String(row.title_ja || ''), type: row.type as ActivityType, date: String(row.date || ''), location: String(row.location || ''), description: String(row.description || ''), descriptionBn: String(row.description_bn || ''), descriptionJa: String(row.description_ja || ''), image: String(row.image || ''), additionalImages: Array.isArray(row.additional_images) ? row.additional_images.map(String) : [], externalUrl: String(row.external_url || ''), status: row.status === 'published' ? 'published' : 'draft' }
}

async function uploadImage(supabase: ReturnType<typeof createClient>, file: File, bucket: 'artworks' | 'activities' | 'profile') {
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image file.')
  if (file.size > 5 * 1024 * 1024) throw new Error('Images must be 5 MB or smaller.')
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${crypto.randomUUID()}.${extension}`
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false, contentType: file.type })
  if (error) throw new Error(error.message)
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

export default function AdminPage() {
  const supabase = useMemo(() => createClient(), [])
  const [tab, setTab] = useState<Tab>('profile')
  const [profile, setProfile] = useState<ArtistProfile>({ name: 'Abid Hossain', discipline: '3D Landscape Artist', portrait: '/artist-portrait.jpg', heroImage: '', bio: { en: '', bn: '', ja: '' }, email: '', phone: '', whatsapp: '', facebook: '' })
  const [artworks, setArtworks] = useState<Artwork[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [artworkForm, setArtworkForm] = useState<ArtworkForm>(emptyArtwork)
  const [activityForm, setActivityForm] = useState<ActivityForm>(emptyActivity)
  const [editingArtwork, setEditingArtwork] = useState<string | null>(null)
  const [editingActivity, setEditingActivity] = useState<string | null>(null)
  const [artworkFile, setArtworkFile] = useState<File | null>(null)
  const [activityFile, setActivityFile] = useState<File | null>(null)
  const [portraitFile, setPortraitFile] = useState<File | null>(null)
  const [heroFile, setHeroFile] = useState<File | null>(null)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'all' | Status>('all')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    const [profileResult, artworkResult, activityResult] = await Promise.all([
      supabase.from('artist_profile').select('*').limit(1).maybeSingle(),
      supabase.from('artworks').select('*').order('created_at', { ascending: false }),
      supabase.from('activities').select('*').order('created_at', { ascending: false }),
    ])
    const firstError = profileResult.error || artworkResult.error || activityResult.error
    if (firstError) setError(firstError.message)
    if (profileResult.data) setProfile({ name: profileResult.data.name, discipline: profileResult.data.discipline, portrait: profileResult.data.portrait, heroImage: profileResult.data.hero_image || '', bio: { en: profileResult.data.bio_en, bn: profileResult.data.bio_bn, ja: profileResult.data.bio_ja }, email: profileResult.data.email, phone: profileResult.data.phone, whatsapp: profileResult.data.whatsapp, facebook: profileResult.data.facebook || '' })
    setArtworks((artworkResult.data || []).map(mapArtwork))
    setActivities((activityResult.data || []).map(mapActivity))
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function flash(message: string) {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 2000)
  }

  async function saveProfile(event: FormEvent) {
    event.preventDefault()
    setSaving(true); setError('')
    try {
      const portrait = portraitFile ? await uploadImage(supabase, portraitFile, 'profile') : profile.portrait
      const heroImage = heroFile ? await uploadImage(supabase, heroFile, 'profile') : profile.heroImage
      const { error: saveError } = await supabase.from('artist_profile').update({ name: profile.name, discipline: profile.discipline, portrait, hero_image: heroImage || null, bio_en: profile.bio.en, bio_bn: profile.bio.bn, bio_ja: profile.bio.ja, email: profile.email, phone: profile.phone, whatsapp: profile.whatsapp, facebook: profile.facebook || null, updated_at: new Date().toISOString() }).eq('id', '00000000-0000-0000-0000-000000000001')
      if (saveError) throw new Error(saveError.message)
      setProfile({ ...profile, portrait, heroImage }); setPortraitFile(null); setHeroFile(null); flash('Profile saved')
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'Unable to save profile.') }
    finally { setSaving(false) }
  }

  async function saveArtwork(event: FormEvent) {
    event.preventDefault()
    setSaving(true); setError('')
    try {
      const image = artworkFile ? await uploadImage(supabase, artworkFile, 'artworks') : artworkForm.image
      if (!artworkForm.title.trim() || !artworkForm.category.trim() || !artworkForm.description.trim() || !image) throw new Error('Title, category, description, and image are required.')
      const payload = { title: artworkForm.title.trim(), title_bn: artworkForm.titleBn || null, title_ja: artworkForm.titleJa || null, category: artworkForm.category.trim(), year: artworkForm.year || null, description: artworkForm.description.trim(), description_bn: artworkForm.descriptionBn || null, description_ja: artworkForm.descriptionJa || null, image, featured: artworkForm.featured, status: artworkForm.status, updated_at: new Date().toISOString() }
      const result = editingArtwork ? await supabase.from('artworks').update(payload).eq('id', editingArtwork) : await supabase.from('artworks').insert(payload)
      if (result.error) throw new Error(result.error.message)
      setArtworkForm(emptyArtwork); setArtworkFile(null); setEditingArtwork(null); await load(); flash('Artwork saved')
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'Unable to save artwork.') }
    finally { setSaving(false) }
  }

  async function saveActivity(event: FormEvent) {
    event.preventDefault()
    setSaving(true); setError('')
    try {
      const image = activityFile ? await uploadImage(supabase, activityFile, 'activities') : activityForm.image
      if (!activityForm.title.trim() || !activityForm.description.trim()) throw new Error('Title and description are required.')
      const payload = { title: activityForm.title.trim(), title_bn: activityForm.titleBn || null, title_ja: activityForm.titleJa || null, type: activityForm.type, date: activityForm.date, location: activityForm.location, description: activityForm.description.trim(), description_bn: activityForm.descriptionBn || null, description_ja: activityForm.descriptionJa || null, image: image || null, additional_images: activityForm.additionalImages || [], external_url: activityForm.externalUrl || null, status: activityForm.status, updated_at: new Date().toISOString() }
      const result = editingActivity ? await supabase.from('activities').update(payload).eq('id', editingActivity) : await supabase.from('activities').insert(payload)
      if (result.error) throw new Error(result.error.message)
      setActivityForm(emptyActivity); setActivityFile(null); setEditingActivity(null); await load(); flash('Activity saved')
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'Unable to save activity.') }
    finally { setSaving(false) }
  }

  async function remove(table: 'artworks' | 'activities', id: string | number) {
    if (!window.confirm('Delete this entry?')) return
    const { error: deleteError } = await supabase.from(table).delete().eq('id', id)
    if (deleteError) setError(deleteError.message)
    else { await load(); flash('Entry deleted') }
  }

  async function logout() { await supabase.auth.signOut(); window.location.href = '/admin/login' }
  const filteredArtworks = artworks.filter(item => `${item.title} ${item.category}`.toLowerCase().includes(query.toLowerCase()) && (status === 'all' || item.status === status))
  const filteredActivities = activities.filter(item => `${item.title} ${item.type} ${item.location}`.toLowerCase().includes(query.toLowerCase()) && (status === 'all' || item.status === status))
  const field = (label: string, value: string, onChange: (value: string) => void, props: Record<string, string> = {}) => <label className="field">{label}<input value={value} onChange={event => onChange(event.target.value)} {...props} /></label>
  const textArea = (label: string, value: string, onChange: (value: string) => void) => <label className="field">{label}<textarea rows={4} value={value} onChange={event => onChange(event.target.value)} /></label>

  return <main className="min-h-screen bg-paper text-charcoal"><header className="border-b border-charcoal/10 px-5 py-5 md:px-10"><div className="mx-auto flex max-w-7xl items-center justify-between"><a href="/" className="flex items-center gap-2 text-sm"><ArrowLeft className="size-4"/> Back to portfolio</a><span className="font-serif text-xl">Abid<span className="text-olive">.</span> / studio</span><button onClick={logout} className="flex items-center gap-2 text-[10px] uppercase tracking-[.13em]"><LogOut className="size-4"/> Sign out</button></div></header><div className="mx-auto max-w-7xl px-5 py-10 md:px-10"><div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="eyebrow">Private workspace</p><h1 className="mt-3 font-serif text-5xl tracking-[-.06em]">Studio overview</h1><p className="mt-3 text-sm text-charcoal/55">Manage your profile, artworks, awards, activities, music, and AI knowledge.</p></div>{notice && <p className="flex items-center gap-2 text-sm text-olive"><Check className="size-4"/> {notice}</p>}</div>{error && <p role="alert" className="mt-6 border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}<nav className="mt-10 flex flex-wrap gap-2 border-b border-charcoal/10 pb-3">{(['profile', 'artworks', 'activities', 'music', 'knowledge'] as Tab[]).map(item => <button key={item} onClick={() => { setTab(item); setQuery(''); setStatus('all') }} className={`px-4 py-2 text-[10px] uppercase tracking-[.14em] ${tab === item ? 'bg-charcoal text-paper' : 'text-charcoal/55'}`}>{item === 'knowledge' ? 'AI knowledge base' : item}</button>)}</nav>{tab === 'music' && <AdminMusicSettings onSaved={flash}/>} {tab === 'knowledge' && <AdminKnowledgeBase onSaved={flash}/>} {tab === 'profile' && <form onSubmit={saveProfile} className="mt-8 border border-charcoal/10 bg-white p-6 md:p-8"><p className="eyebrow">Artist profile</p><h2 className="mt-2 font-serif text-3xl">Public information</h2><div className="mt-8 grid gap-6 md:grid-cols-2">{field('Artist name', profile.name, value => setProfile({ ...profile, name: value }))}{field('Discipline', profile.discipline, value => setProfile({ ...profile, discipline: value }))}{field('Email', profile.email, value => setProfile({ ...profile, email: value }), { type: 'email' })}{field('Phone', profile.phone, value => setProfile({ ...profile, phone: value }))}{field('WhatsApp number', profile.whatsapp, value => setProfile({ ...profile, whatsapp: value }), { placeholder: '8801...' })}{field('Facebook profile URL', profile.facebook, value => setProfile({ ...profile, facebook: value }), { type: 'url', placeholder: 'https://facebook.com/your-profile' })}<label className="field">Portrait image<input type="file" accept="image/*" onChange={event => setPortraitFile(event.target.files?.[0] || null)} />{portraitFile && <span className="text-xs normal-case text-charcoal/50">{portraitFile.name}</span>}</label><label className="field">Coming soon landscape<input type="file" accept="image/*" onChange={event => setHeroFile(event.target.files?.[0] || null)} />{heroFile && <span className="text-xs normal-case text-charcoal/50">{heroFile.name}</span>}{profile.heroImage && !heroFile && <span className="truncate text-xs normal-case text-charcoal/50">{profile.heroImage}</span>}</label>{textArea('Biography (English)', profile.bio.en, value => setProfile({ ...profile, bio: { ...profile.bio, en: value } }))}{textArea('Biography (Bangla)', profile.bio.bn, value => setProfile({ ...profile, bio: { ...profile.bio, bn: value } }))}{textArea('Biography (Japanese)', profile.bio.ja, value => setProfile({ ...profile, bio: { ...profile.bio, ja: value } }))}</div><button disabled={saving} className="mt-8 bg-charcoal px-5 py-3 text-[11px] uppercase tracking-[.13em] text-paper disabled:opacity-50">{saving ? 'Saving…' : 'Save profile'}</button>  </form>}{(tab === 'artworks' || tab === 'activities') && <><div className="mt-8 flex flex-col justify-between gap-4 md:flex-row md:items-center"><div className="flex gap-3"><label className="flex items-center gap-2 border border-charcoal/15 px-3 py-2"><Search className="size-4 text-charcoal/45"/><span className="sr-only">Search</span><input className="w-44 bg-transparent text-sm outline-none" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search"/></label><select className="border border-charcoal/15 bg-transparent px-3 text-xs" value={status} onChange={event => setStatus(event.target.value as 'all' | Status)}><option value="all">All status</option><option value="published">Published</option><option value="draft">Draft</option></select></div></div>{tab === 'artworks' ? <ArtworkEditor form={artworkForm} setForm={setArtworkForm} file={artworkFile} setFile={setArtworkFile} editing={editingArtwork} onSave={saveArtwork} onCancel={() => { setEditingArtwork(null); setArtworkForm(emptyArtwork); setArtworkFile(null) }} saving={saving}/> : <ActivityEditor form={activityForm} setForm={setActivityForm} file={activityFile} setFile={setActivityFile} editing={editingActivity} onSave={saveActivity} onCancel={() => { setEditingActivity(null); setActivityForm(emptyActivity); setActivityFile(null) }} saving={saving}/>}<section className="mt-10 divide-y divide-charcoal/10">{loading ? <p className="py-10 text-sm text-charcoal/50">Loading content…</p> : (tab === 'artworks' ? filteredArtworks.map(item => <div key={item.id} className="flex flex-col justify-between gap-4 py-5 md:flex-row md:items-center"><div><p className="eyebrow text-olive">{item.category} · {item.status}</p><h3 className="mt-1 font-serif text-2xl">{item.title}</h3><p className="text-xs text-charcoal/50">{item.year || 'No year'} {item.featured && '· Featured'}</p></div><EntryActions onEdit={() => { setEditingArtwork(String(item.id)); setArtworkForm({ title: item.title, titleBn: item.titleBn || '', titleJa: item.titleJa || '', category: item.category, year: item.year || '', description: item.description, descriptionBn: item.descriptionBn || '', descriptionJa: item.descriptionJa || '', image: item.image, featured: Boolean(item.featured), status: item.status }); window.scrollTo({ top: 0, behavior: 'smooth' }) }} onDelete={() => remove('artworks', item.id)}/></div>) : filteredActivities.map(item => <div key={item.id} className="flex flex-col justify-between gap-4 py-5 md:flex-row md:items-center"><div><p className="eyebrow text-olive">{item.type} · {item.status}</p><h3 className="mt-1 font-serif text-2xl">{item.title}</h3><p className="text-xs text-charcoal/50">{item.date} · {item.location}</p></div><EntryActions onEdit={() => { setEditingActivity(String(item.id)); setActivityForm({ title: item.title, titleBn: item.titleBn || '', titleJa: item.titleJa || '', type: item.type, date: item.date, location: item.location, description: item.description, descriptionBn: item.descriptionBn || '', descriptionJa: item.descriptionJa || '', image: item.image, additionalImages: item.additionalImages || [], externalUrl: item.externalUrl || '', status: item.status }); window.scrollTo({ top: 0, behavior: 'smooth' }) }} onDelete={() => remove('activities', item.id)}/></div>))}</section></>}</div></main>
}

function EntryActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return <div className="flex gap-4 text-[10px] uppercase tracking-[.13em]"><button onClick={onEdit} className="inline-flex items-center gap-2"><Pencil className="size-4"/> Edit</button><button onClick={onDelete} className="inline-flex items-center gap-2 text-charcoal/55"><Trash2 className="size-4"/> Delete</button></div>
}

function ArtworkEditor({ form, setForm, file, setFile, editing, onSave, onCancel, saving }: { form: ArtworkForm; setForm: (value: ArtworkForm) => void; file: File | null; setFile: (value: File | null) => void; editing: string | null; onSave: (event: FormEvent) => void; onCancel: () => void; saving: boolean }) {
  return <form onSubmit={onSave} className="mt-8 border border-charcoal/10 bg-white p-6 md:p-8"><div className="flex items-center justify-between"><div><p className="eyebrow">{editing ? 'Edit artwork' : 'Add artwork'}</p><h2 className="mt-2 font-serif text-3xl">Artwork library</h2></div>{editing && <button type="button" onClick={onCancel} aria-label="Cancel editing"><X/></button>}</div><div className="mt-8 grid gap-6 md:grid-cols-2"><label className="field md:col-span-2">Artwork image<input required={!form.image} type="file" accept="image/*" onChange={event => setFile(event.target.files?.[0] || null)}/>{file && <span className="text-xs normal-case text-charcoal/50">{file.name}</span>}{form.image && !file && <span className="truncate text-xs normal-case text-charcoal/50">{form.image}</span>}</label><label className="field">Title<input required value={form.title} onChange={event => setForm({ ...form, title: event.target.value })}/></label><label className="field">Category<input required value={form.category} onChange={event => setForm({ ...form, category: event.target.value })}/></label><label className="field">Year<input value={form.year} onChange={event => setForm({ ...form, year: event.target.value })}/></label><label className="field">Bangla title<input value={form.titleBn} onChange={event => setForm({ ...form, titleBn: event.target.value })}/></label><label className="field">Japanese title<input value={form.titleJa} onChange={event => setForm({ ...form, titleJa: event.target.value })}/></label><label className="field md:col-span-2">Description<textarea required rows={4} value={form.description} onChange={event => setForm({ ...form, description: event.target.value })}/></label><label className="field md:col-span-2">Bangla description<textarea rows={3} value={form.descriptionBn} onChange={event => setForm({ ...form, descriptionBn: event.target.value })}/></label><label className="field md:col-span-2">Japanese description<textarea rows={3} value={form.descriptionJa} onChange={event => setForm({ ...form, descriptionJa: event.target.value })}/></label><label className="flex items-center gap-3 text-[10px] uppercase tracking-[.14em]"><input type="checkbox" checked={form.featured} onChange={event => setForm({ ...form, featured: event.target.checked })}/> Featured</label><label className="field">Status<select value={form.status} onChange={event => setForm({ ...form, status: event.target.value as Status })}><option value="draft">Draft</option><option value="published">Published</option></select></label></div><button disabled={saving} className="mt-8 inline-flex items-center gap-2 bg-charcoal px-5 py-3 text-[11px] uppercase tracking-[.13em] text-paper disabled:opacity-50"><ImagePlus className="size-4"/> {saving ? 'Saving…' : editing ? 'Update artwork' : 'Save artwork'}</button></form>
}

function ActivityEditor({ form, setForm, file, setFile, editing, onSave, onCancel, saving }: { form: ActivityForm; setForm: (value: ActivityForm) => void; file: File | null; setFile: (value: File | null) => void; editing: string | null; onSave: (event: FormEvent) => void; onCancel: () => void; saving: boolean }) {
  return <form onSubmit={onSave} className="mt-8 border border-charcoal/10 bg-white p-6 md:p-8"><div className="flex items-center justify-between"><div><p className="eyebrow">{editing ? 'Edit entry' : 'Add entry'}</p><h2 className="mt-2 font-serif text-3xl">Awards & Activities</h2></div>{editing && <button type="button" onClick={onCancel} aria-label="Cancel editing"><X/></button>}</div><div className="mt-8 grid gap-6 md:grid-cols-2"><label className="field md:col-span-2">Cover image<input type="file" accept="image/*" onChange={event => setFile(event.target.files?.[0] || null)}/>{file && <span className="text-xs normal-case text-charcoal/50">{file.name}</span>}{form.image && !file && <span className="truncate text-xs normal-case text-charcoal/50">{form.image}</span>}</label><label className="field">Title<input required value={form.title} onChange={event => setForm({ ...form, title: event.target.value })}/></label><label className="field">Activity type<select value={form.type} onChange={event => setForm({ ...form, type: event.target.value as ActivityType })}>{activityTypes.map(type => <option key={type}>{type}</option>)}</select></label><label className="field">Date or year<input value={form.date} onChange={event => setForm({ ...form, date: event.target.value })}/></label><label className="field">Location or venue<input value={form.location} onChange={event => setForm({ ...form, location: event.target.value })}/></label><label className="field">Bangla title<input value={form.titleBn} onChange={event => setForm({ ...form, titleBn: event.target.value })}/></label><label className="field">Japanese title<input value={form.titleJa} onChange={event => setForm({ ...form, titleJa: event.target.value })}/></label><label className="field md:col-span-2">External URL<input type="url" value={form.externalUrl} onChange={event => setForm({ ...form, externalUrl: event.target.value })}/></label><label className="field md:col-span-2">Description<textarea required rows={4} value={form.description} onChange={event => setForm({ ...form, description: event.target.value })}/></label><label className="field md:col-span-2">Bangla description<textarea rows={3} value={form.descriptionBn} onChange={event => setForm({ ...form, descriptionBn: event.target.value })}/></label><label className="field md:col-span-2">Japanese description<textarea rows={3} value={form.descriptionJa} onChange={event => setForm({ ...form, descriptionJa: event.target.value })}/></label><label className="field">Status<select value={form.status} onChange={event => setForm({ ...form, status: event.target.value as Status })}><option value="draft">Draft</option><option value="published">Published</option></select></label></div><button disabled={saving} className="mt-8 inline-flex items-center gap-2 bg-charcoal px-5 py-3 text-[11px] uppercase tracking-[.13em] text-paper disabled:opacity-50"><Plus className="size-4"/> {saving ? 'Saving…' : editing ? 'Update entry' : 'Save entry'}</button></form>
}
