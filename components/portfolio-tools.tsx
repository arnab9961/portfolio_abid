'use client'

import { FormEvent, useEffect, useState } from 'react'
import { Bot, Check, ChevronDown, Loader2, MessageCircle, Music2, Pause, Play, Send, Volume2, VolumeX, X } from 'lucide-react'
import type { Language } from '@/lib/portfolio-data'
import { createClient } from '@/lib/supabase/client'

type ChatMessage = { role: 'user' | 'assistant'; content: string }

export function Chatbot({ language }: { language: Language }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([{ role: 'assistant', content: language === 'bn' ? 'স্বাগতম। আবিদ হোসাইনের কাজ সম্পর্কে জানতে কীভাবে সাহায্য করতে পারি?' : language === 'ja' ? 'ようこそ。アビド・ホサインの作品について、何をお知りになりたいですか？' : 'Welcome. How may I help you explore Abid Hossain’s work?' }])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const suggestions = language === 'bn' ? ['শিল্পীর কাজ সম্পর্কে বলুন', 'কমিশন কীভাবে শুরু করব?'] : language === 'ja' ? ['作品について教えてください', '依頼を始めるには？'] : ['Tell me about the artist', 'How do I start a commission?']

  async function send(content = input) {
    const text = content.trim()
    if (!text || sending) return
    const next = [...messages, { role: 'user' as const, content: text }]
    setMessages(next); setInput(''); setSending(true); setError('')
    try {
      const response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ language, messages: next }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Unable to send message.')
      setMessages([...next, { role: 'assistant', content: result.message }])
    } catch (sendError) { setError(sendError instanceof Error ? sendError.message : 'Unable to send message.') }
    finally { setSending(false) }
  }

  return <div className="fixed bottom-5 right-5 z-50 sm:bottom-7 sm:right-7">
    {open && <section aria-label="Artist assistant" className="mb-3 flex h-[min(620px,calc(100vh-110px))] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-charcoal/15 bg-paper shadow-[0_18px_60px_rgb(32_33_31/.16)]">
      <header className="flex items-center justify-between border-b border-charcoal/10 px-5 py-4"><div><p className="eyebrow text-olive">Gallery assistant</p><p className="mt-1 font-serif text-xl">Ask about the work</p></div><button onClick={() => setOpen(false)} aria-label="Close assistant" className="rounded-full p-2 hover:bg-beige"><X className="size-4"/></button></header>
      <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">{messages.map((message, index) => <div key={index} className={`max-w-[88%] rounded-xl px-3.5 py-3 text-sm leading-6 ${message.role === 'user' ? 'ml-auto bg-charcoal text-paper' : 'bg-beige text-charcoal'}`}>{message.content}</div>)}{sending && <div className="flex items-center gap-2 text-xs text-charcoal/50"><Loader2 className="size-3 animate-spin"/> Thinking…</div>}{error && <p role="alert" className="text-xs text-red-700">{error}</p>}{messages.length === 1 && <div className="flex flex-wrap gap-2 pt-2">{suggestions.map(suggestion => <button key={suggestion} onClick={() => send(suggestion)} className="rounded-full border border-charcoal/15 px-3 py-2 text-left text-xs hover:border-olive">{suggestion}</button>)}</div>}</div>
      <form onSubmit={(event) => { event.preventDefault(); send() }} className="flex items-center gap-2 border-t border-charcoal/10 p-3"><input aria-label="Message the assistant" value={input} onChange={event => setInput(event.target.value)} placeholder="Write a message…" className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm outline-none" /><button aria-label="Send message" disabled={!input.trim() || sending} className="rounded-full bg-charcoal p-2.5 text-paper disabled:opacity-30"><Send className="size-4"/></button></form>
    </section>}
    <button onClick={() => setOpen(!open)} aria-expanded={open} aria-label={open ? 'Close artist assistant' : 'Open artist assistant'} className="ml-auto flex size-14 items-center justify-center rounded-full bg-charcoal text-paper shadow-lg transition-transform hover:-translate-y-1">{open ? <ChevronDown className="size-5"/> : <MessageCircle className="size-5"/>}</button>
  </div>
}

export function MusicPlayer() {
  const [settings, setSettings] = useState<{ track_title: string; audio_url: string; attribution: string | null } | null>(null)
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(0.7)
  const [expanded, setExpanded] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => { let active = true; createClient().from('music_settings').select('track_title,audio_url,attribution').eq('enabled', true).maybeSingle().then(({ data, error: queryError }) => { if (!active) return; if (queryError) setError('Music is unavailable.'); else if (data?.audio_url) setSettings(data) }); return () => { active = false } }, [])
  useEffect(() => () => { audio?.pause() }, [audio])
  useEffect(() => { if (audio) audio.volume = volume }, [audio, volume])
  if (!settings) return null
  function togglePlay() {
    if (!settings) return
    if (!audio) { const element = new Audio(settings.audio_url); element.preload = 'metadata'; element.onended = () => setPlaying(false); element.onerror = () => { setError('This track could not be played.'); setPlaying(false) }; setAudio(element); element.play().then(() => setPlaying(true)).catch(() => setError('Press play to start the track.')) }
    else if (playing) { audio.pause(); setPlaying(false) } else { audio.play().then(() => setPlaying(true)).catch(() => setError('This track could not be played.')) }
  }
  return <aside className={`fixed bottom-5 left-5 z-40 text-charcoal sm:bottom-7 sm:left-7 ${expanded ? 'w-[min(300px,calc(100vw-2rem))]' : 'w-auto'}`}><div className="rounded-2xl border border-charcoal/10 bg-paper/95 p-3 shadow-[0_12px_40px_rgb(32_33_31/.12)] backdrop-blur"><div className="flex items-center gap-3"><button onClick={togglePlay} aria-label={playing ? 'Pause music' : 'Play music'} className="flex size-10 shrink-0 items-center justify-center rounded-full bg-charcoal text-paper">{playing ? <Pause className="size-4"/> : <Play className="size-4"/>}</button>{expanded && <div className="min-w-0 flex-1"><p className="truncate text-sm">{settings.track_title || 'Piano study'}</p>{settings.attribution && <p className="truncate text-[10px] text-charcoal/50">{settings.attribution}</p>}{error && <p role="alert" className="mt-1 text-[10px] text-red-700">{error}</p>}</div>} {expanded && <><button onClick={() => { if (audio) audio.muted = !muted; setMuted(!muted) }} aria-label={muted ? 'Unmute music' : 'Mute music'} className="p-2 text-charcoal/55">{muted ? <VolumeX className="size-4"/> : <Volume2 className="size-4"/>}</button><label className="sr-only">Volume<input type="range" min="0" max="1" step="0.05" value={volume} onChange={event => setVolume(Number(event.target.value))}/></label></>}<button onClick={() => setExpanded(!expanded)} aria-label={expanded ? 'Minimize music player' : 'Expand music player'} className="p-2 text-charcoal/45">{expanded ? <ChevronDown className="size-4"/> : <Music2 className="size-4"/>}</button></div></div></aside>
}

export function InquiryForm({ onDone }: { onDone?: () => void }) {
  const [form, setForm] = useState({ name: '', email: '', whatsapp: '', inquiryType: 'commission', projectDescription: '', budget: '', deadline: '', preferredContact: 'email' })
  const [state, setState] = useState<'idle' | 'review' | 'saving' | 'done'>('idle')
  const [error, setError] = useState('')
  function update(key: keyof typeof form, value: string) { setForm(current => ({ ...current, [key]: value })) }
  async function submit(event: FormEvent) { event.preventDefault(); setState('saving'); setError(''); try { const response = await fetch('/api/inquiries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }); const result = await response.json(); if (!response.ok) throw new Error(result.error); setState('done'); onDone?.() } catch (submitError) { setError(submitError instanceof Error ? submitError.message : 'Unable to save inquiry.'); setState('review') } }
  if (state === 'done') return <div className="border border-olive/30 bg-olive/10 p-5 text-sm"><Check className="mb-3 size-5 text-olive"/><p className="font-serif text-2xl">Inquiry received</p><p className="mt-2 text-charcoal/65">Thank you. The artist will follow up using your preferred contact method.</p></div>
  return <form onSubmit={event => { event.preventDefault(); if (state === 'review') submit(event); else if (state === 'idle') setState('review') }} className="space-y-4">
    {(state === 'review' || state === 'saving') ? <div className="space-y-4 text-sm"><p className="eyebrow">Review your inquiry</p><p><strong>{form.name}</strong> · {form.inquiryType}</p><p className="whitespace-pre-wrap text-charcoal/65">{form.projectDescription}</p><button disabled={state === 'saving'} className="bg-paper px-5 py-3 text-[10px] uppercase tracking-[.13em] text-charcoal disabled:opacity-50">{state === 'saving' ? 'Sending…' : 'Confirm and send'}</button><button type="button" disabled={state === 'saving'} onClick={() => setState('idle')} className="ml-3 text-[10px] uppercase tracking-[.13em] text-paper/60">Edit</button></div> : <><div className="grid gap-4 sm:grid-cols-2"><label className="field text-paper/60">Name<input required value={form.name} onChange={event => update('name', event.target.value)}/></label><label className="field text-paper/60">Email<input type="email" value={form.email} onChange={event => update('email', event.target.value)}/></label><label className="field text-paper/60">WhatsApp<input value={form.whatsapp} onChange={event => update('whatsapp', event.target.value)}/></label><label className="field text-paper/60">Inquiry type<select value={form.inquiryType} onChange={event => update('inquiryType', event.target.value)}><option value="commission">Commission</option><option value="collaboration">Collaboration</option><option value="exhibition">Exhibition</option><option value="new-project">New project</option><option value="other">Other</option></select></label></div><label className="field text-paper/60">Project description<textarea required value={form.projectDescription} onChange={event => update('projectDescription', event.target.value)}/></label><div className="grid gap-4 sm:grid-cols-2"><label className="field text-paper/60">Budget (optional)<input value={form.budget} onChange={event => update('budget', event.target.value)}/></label><label className="field text-paper/60">Deadline (optional)<input value={form.deadline} onChange={event => update('deadline', event.target.value)}/></label></div><label className="field text-paper/60">Preferred contact<select value={form.preferredContact} onChange={event => update('preferredContact', event.target.value)}><option value="email">Email</option><option value="whatsapp">WhatsApp</option><option value="phone">Phone</option></select></label><button className="bg-paper px-5 py-3 text-[10px] uppercase tracking-[.13em] text-charcoal">Review inquiry</button></>}
    {error && <p role="alert" className="text-sm text-red-200">{error}</p>}
  </form>
}
