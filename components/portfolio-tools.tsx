'use client'

import { useEffect, useState } from 'react'
import { ChevronDown, Loader2, MessageCircle, Music2, Pause, Play, Send, Volume2, VolumeX, X } from 'lucide-react'
import type { Language } from '@/lib/portfolio-data'
import { createClient } from '@/lib/supabase/client'

type ChatMessage = { role: 'user' | 'assistant'; content: string }

export function Chatbot({ language }: { language: Language }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([{ role: 'assistant', content: language === 'bn' ? 'স্বাগতম। কী জানতে চান?' : language === 'ja' ? 'ようこそ。何を知りたいですか？' : 'Welcome. What would you like to know?' }])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [typingMessage, setTypingMessage] = useState<number | null>(null)
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
      const assistantIndex = next.length
      setMessages([...next, { role: 'assistant', content: '' }])
      setTypingMessage(assistantIndex)
      for (let index = 1; index <= result.message.length; index += 1) {
        await new Promise(resolve => window.setTimeout(resolve, 18))
        setMessages(current => current.map((message, messageIndex) => messageIndex === assistantIndex ? { ...message, content: result.message.slice(0, index) } : message))
      }
      setTypingMessage(null)
    } catch (sendError) { setError(sendError instanceof Error ? sendError.message : 'Unable to send message.') }
    finally { setSending(false) }
  }

  return <div className="fixed bottom-5 right-5 z-50 sm:bottom-7 sm:right-7">
    {open && <section aria-label="Artist assistant" className="mb-3 flex h-[min(620px,calc(100vh-110px))] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-charcoal/15 bg-paper shadow-[0_18px_60px_rgb(32_33_31/.16)]">
      <header className="flex items-center justify-between border-b border-charcoal/10 px-5 py-4"><div><p className="eyebrow text-olive">Gallery assistant</p><p className="mt-1 font-serif text-xl">Ask about the work</p></div><button onClick={() => setOpen(false)} aria-label="Close assistant" className="rounded-full p-2 hover:bg-beige"><X className="size-4"/></button></header>
      <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">{messages.map((message, index) => <div key={index} className={`max-w-[88%] rounded-xl px-3.5 py-3 text-sm leading-6 ${message.role === 'user' ? 'ml-auto bg-charcoal text-paper' : 'bg-beige text-charcoal'}`}>{message.content}{typingMessage === index && <span className="ml-0.5 inline-block h-4 w-px animate-pulse bg-charcoal/60 align-[-2px]" aria-hidden="true" />}</div>)}{sending && !typingMessage && <div className="flex items-center gap-2 text-xs text-charcoal/50"><Loader2 className="size-3 animate-spin"/> Thinking…</div>}{error && <p role="alert" className="text-xs text-red-700">{error}</p>}{messages.length === 1 && <div className="flex flex-wrap gap-2 pt-2">{suggestions.map(suggestion => <button key={suggestion} onClick={() => send(suggestion)} className="rounded-full border border-charcoal/15 px-3 py-2 text-left text-xs hover:border-olive">{suggestion}</button>)}</div>}</div>
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
  useEffect(() => { let active = true; createClient().from('music_settings').select('track_title,audio_url,attribution').eq('enabled', true).maybeSingle().then(({ data, error: queryError }) => { if (!active) return; if (queryError && queryError.code !== 'PGRST205') setError('Music is unavailable.'); else if (data?.audio_url) setSettings(data) }); return () => { active = false } }, [])
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
