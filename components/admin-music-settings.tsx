'use client'

import { FormEvent, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Settings = { enabled: boolean; track_title: string; audio_url: string; attribution: string; license: string }

export function AdminMusicSettings({ onSaved }: { onSaved: (message: string) => void }) {
  const supabase = createClient()
  const [settings, setSettings] = useState<Settings>({ enabled: false, track_title: '', audio_url: '', attribution: '', license: '' })
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => { supabase.from('music_settings').select('*').maybeSingle().then(({ data, error: queryError }) => { if (queryError) setError(queryError.code === 'PGRST205' ? 'Music settings are not installed in this Supabase project. Apply migration 20261022090000_chatbot_music.sql, then reload the schema cache.' : queryError.message); if (data) setSettings({ enabled: data.enabled, track_title: data.track_title, audio_url: data.audio_url, attribution: data.attribution || '', license: data.license || '' }); setLoading(false) }) }, [])
  function update(key: keyof Settings, value: string | boolean) { setSettings(current => ({ ...current, [key]: value })) }
  async function save(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError('')
    try {
      let audioUrl = settings.audio_url
      if (file) {
        if (!file.type.startsWith('audio/')) throw new Error('Please choose an audio file.')
        if (file.size > 30 * 1024 * 1024) throw new Error('Audio files must be 30 MB or smaller.')
        const extension = file.name.split('.').pop()?.toLowerCase() || 'mp3'
        const path = `tracks/${crypto.randomUUID()}.${extension}`
        const { error: uploadError } = await supabase.storage.from('music').upload(path, file, { upsert: false, contentType: file.type })
        if (uploadError) throw new Error(uploadError.message)
        audioUrl = supabase.storage.from('music').getPublicUrl(path).data.publicUrl
      }
      const { error: saveError } = await supabase.from('music_settings').update({ enabled: settings.enabled, track_title: settings.track_title.trim(), audio_url: audioUrl.trim(), attribution: settings.attribution.trim() || null, license: settings.license.trim() || null, updated_at: new Date().toISOString() }).eq('id', '00000000-0000-0000-0000-000000000002')
      if (saveError) throw new Error(saveError.message)
      setSettings(current => ({ ...current, audio_url: audioUrl })); setFile(null); onSaved('Music settings saved')
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'Unable to save music settings.') }
    finally { setSaving(false) }
  }
  if (loading) return <p className="mt-8 text-sm text-charcoal/50">Loading music settings…</p>
  return <form onSubmit={save} className="mt-8 border border-charcoal/10 bg-white p-6 md:p-8"><p className="eyebrow">Music settings</p><h2 className="mt-2 font-serif text-3xl">A quiet soundtrack</h2><p className="mt-3 max-w-xl text-sm leading-6 text-charcoal/55">Only publish audio you own or have a verified license to use.</p><div className="mt-8 grid gap-6 md:grid-cols-2"><label className="field md:col-span-2"><span className="flex items-center gap-3"><input type="checkbox" checked={settings.enabled} onChange={event => update('enabled', event.target.checked)} className="size-4 accent-[#777d68]"/> Enable music player</span></label><label className="field">Track title<input value={settings.track_title} onChange={event => update('track_title', event.target.value)} /></label><label className="field">Audio file (optional)<input type="file" accept="audio/*" onChange={event => setFile(event.target.files?.[0] || null)} />{file && <span className="text-xs normal-case text-charcoal/50">{file.name}</span>}</label><label className="field md:col-span-2">Audio URL (or upload above)<input type="url" value={settings.audio_url} onChange={event => update('audio_url', event.target.value)} placeholder="https://…" /></label><label className="field">Artist / track attribution<input value={settings.attribution} onChange={event => update('attribution', event.target.value)} /></label><label className="field">License information<input value={settings.license} onChange={event => update('license', event.target.value)} /></label></div>{settings.audio_url && <div className="mt-6"><p className="eyebrow mb-2">Preview</p><audio controls preload="metadata" src={settings.audio_url} className="w-full"/></div>}{error && <p role="alert" className="mt-5 text-sm text-red-700">{error}</p>}<button disabled={saving} className="mt-8 bg-charcoal px-5 py-3 text-[11px] uppercase tracking-[.13em] text-paper disabled:opacity-50">{saving ? 'Saving…' : 'Save music settings'}</button></form>
}
