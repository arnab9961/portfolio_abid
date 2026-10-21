'use client'

import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import { ArrowDownRight, ArrowLeft, ArrowRight, ArrowUpRight, Menu, X } from 'lucide-react'
import { artist, artworks, activities, ui, type Activity, type Artwork, type Language } from '@/lib/portfolio-data'
import { createClient } from '@/lib/supabase/client'

function usePortfolioData() {
  const [, refresh] = useState(0)
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) return
    let active = true
    async function load() {
      try {
        const supabase = createClient()
        const [{ data: profile }, { data: remoteArtworks }, { data: remoteActivities }] = await Promise.all([
          supabase.from('artist_profile').select('*').limit(1).maybeSingle(),
          supabase.from('artworks').select('*').eq('status', 'published').order('created_at', { ascending: false }),
          supabase.from('activities').select('*').eq('status', 'published').order('created_at', { ascending: false }),
        ])
        if (!active) return
        if (profile) Object.assign(artist, {
          name: profile.name, discipline: profile.discipline, portrait: profile.portrait,
          email: profile.email, phone: profile.phone, whatsapp: profile.whatsapp,
          bio: { en: profile.bio_en, bn: profile.bio_bn, ja: profile.bio_ja },
        })
        if (remoteArtworks) {
          artworks.splice(0, artworks.length, ...remoteArtworks.map(row => ({
            id: row.id, title: row.title, titleBn: row.title_bn, titleJa: row.title_ja,
            category: row.category, year: row.year, description: row.description,
            descriptionBn: row.description_bn, descriptionJa: row.description_ja, image: row.image,
            featured: row.featured, status: row.status,
          })))
        }
        if (remoteActivities) {
          activities.splice(0, activities.length, ...remoteActivities.map(row => ({
            id: row.id, title: row.title, titleBn: row.title_bn, titleJa: row.title_ja, type: row.type, date: row.date, location: row.location,
            description: row.description, descriptionBn: row.description_bn, descriptionJa: row.description_ja, image: row.image || '', additionalImages: row.additional_images || [],
            externalUrl: row.external_url || '', status: row.status,
          })))
        }
        refresh(value => value + 1)
      } catch (error) {
        console.error('Unable to load portfolio content from Supabase', error)
      }
    }
    load()
    return () => { active = false }
  }, [])
}

function useLanguage() {
  const [language, setLanguage] = useState<Language>('en')
  useEffect(() => { const saved = window.localStorage.getItem('portfolio-language') as Language | null; if (saved && ['en', 'bn', 'ja'].includes(saved)) setLanguage(saved) }, [])
  const change = (next: Language) => { setLanguage(next); window.localStorage.setItem('portfolio-language', next) }
  return { language, change, t: ui[language] }
}

function LanguageSwitcher({ language, onChange }: { language: Language; onChange: (value: Language) => void }) {
  return <label className="flex items-center gap-2 text-[10px] uppercase tracking-[.14em] text-charcoal/55"><span className="sr-only">Language</span><select aria-label="Language" value={language} onChange={(e) => onChange(e.target.value as Language)} className="cursor-pointer appearance-none bg-transparent pr-1 text-charcoal outline-none"><option value="en">EN</option><option value="bn">BN</option><option value="ja">JA</option></select></label>
}

function Nav({ language, onChange }: { language: Language; onChange: (value: Language) => void }) {
  const [open, setOpen] = useState(false); const t = ui[language]
  return <header className="fixed inset-x-0 top-0 z-40 px-5 py-5 md:px-10"><nav className="mx-auto flex max-w-[1440px] items-center justify-between rounded-full border border-charcoal/10 bg-paper/85 px-5 py-3.5 backdrop-blur-md md:px-7"><a href="#top" className="font-serif text-xl tracking-[-.04em]" aria-label={`${artist.name} home`}>Abid<span className="text-olive">.</span></a><div className="hidden items-center gap-8 text-[11px] uppercase tracking-[.16em] text-charcoal/65 md:flex"><a href="#work" className="hover:text-charcoal">{t.selectedWorks}</a><a href="#activities" className="hover:text-charcoal">Activities</a><a href="#about" className="hover:text-charcoal">{t.about}</a><a href="#contact" className="hover:text-charcoal">{t.contact}</a></div><div className="hidden items-center gap-5 md:flex"><LanguageSwitcher language={language} onChange={onChange}/><a href="#contact" className="rounded-full bg-charcoal px-5 py-2.5 text-[11px] uppercase tracking-[.14em] text-paper hover:-translate-y-0.5">{t.connect}</a></div><button className="md:hidden" onClick={() => setOpen(!open)} aria-label={open ? 'Close menu' : 'Open menu'}>{open ? <X/> : <Menu/>}</button></nav>{open && <div className="mx-auto mt-2 flex max-w-[1440px] flex-col gap-5 rounded-3xl border border-charcoal/10 bg-paper p-6 text-sm md:hidden"><a href="#work" onClick={() => setOpen(false)}>{t.selectedWorks}</a><a href="#about" onClick={() => setOpen(false)}>{t.about}</a><a href="#contact" onClick={() => setOpen(false)}>{t.contact}</a><LanguageSwitcher language={language} onChange={onChange}/></div>}</header>
}

function Hero({ t }: { t: typeof ui.en }) { return <section id="top" className="px-5 pb-20 pt-36 md:px-10 md:pb-28 md:pt-44"><div className="mx-auto max-w-[1440px]"><div className="grid items-end gap-10 md:grid-cols-[1fr_1.25fr] md:gap-16"><div className="pb-4"><p className="eyebrow mb-8">3D landscape artist <span className="ml-2 text-olive">/ 01</span></p><h1 className="max-w-xl font-serif text-[clamp(3.8rem,7vw,7.4rem)] leading-[.88] tracking-[-.065em]">{t.hero}</h1><p className="mt-9 max-w-sm text-[15px] leading-7 text-charcoal/65">{t.intro}</p><div className="mt-9 flex items-center gap-7"><a href="#work" className="inline-flex items-center gap-3 rounded-full bg-charcoal px-6 py-3.5 text-[11px] uppercase tracking-[.13em] text-paper">{t.explore}<ArrowDownRight className="size-4"/></a><a href="#contact" className="text-[11px] uppercase tracking-[.13em] text-charcoal/60 underline decoration-charcoal/20 underline-offset-8">{t.getInTouch}</a></div></div><div className="relative aspect-[1.38/1] overflow-hidden bg-beige"><div className="flex h-full items-center justify-center p-8 text-center"><p className="max-w-xs font-serif text-4xl leading-none text-charcoal/30">New landscapes<br/><em>coming soon.</em></p></div></div></div><div className="mt-10 flex items-center justify-between border-t border-charcoal/15 pt-5 text-[10px] uppercase tracking-[.16em] text-charcoal/45"><span>{t.scroll}</span><span>{t.location}</span></div></div></section> }

function Gallery({ language, t }: { language: Language; t: typeof ui.en }) { const [filter, setFilter] = useState('All'); const [selected, setSelected] = useState<Artwork|null>(null); const published = artworks.filter(a => a.status === 'published'); const cats = ['All', ...Array.from(new Set(published.map(a => a.category)))]; const filtered = filter === 'All' ? published : published.filter(a => a.category === filter); const title = (a: Artwork) => language === 'bn' ? a.titleBn || a.title : language === 'ja' ? a.titleJa || a.title : a.title; const desc = (a: Artwork) => language === 'bn' ? a.descriptionBn || a.description : language === 'ja' ? a.descriptionJa || a.description : a.description; return <section id="work" className="bg-beige px-5 py-24 md:px-10 md:py-36"><div className="mx-auto max-w-[1440px]"><div className="flex flex-col justify-between gap-8 md:flex-row md:items-end"><div><p className="eyebrow mb-5">{t.selectedWorks} <span className="ml-2 text-olive">/ 02</span></p><h2 className="font-serif text-5xl tracking-[-.06em] md:text-7xl">{t.worlds}</h2><p className="mt-5 max-w-md text-sm leading-6 text-charcoal/60">{t.galleryIntro}</p></div><div className="flex flex-wrap gap-x-5 gap-y-3 border-b border-charcoal/15 pb-3 text-[10px] uppercase tracking-[.13em]">{cats.map(c => <button key={c} onClick={() => setFilter(c)} className={filter === c ? 'text-charcoal' : 'text-charcoal/40'}>{c === 'All' ? t.all : c}</button>)}</div></div>{filtered.length === 0 ? <div className="flex min-h-64 items-center justify-center border-b border-charcoal/15 py-20 text-center"><p className="font-serif text-4xl text-charcoal/45">{t.empty}</p></div> : <div className="mt-16 grid gap-5 md:grid-cols-2">{filtered.map(a => <button key={a.id} onClick={() => setSelected(a)} className="group text-left"><div className="relative aspect-[1.35/1] overflow-hidden bg-paper"><Image src={a.image} alt={title(a)} fill className="object-cover transition-transform duration-700 group-hover:scale-105" sizes="(max-width: 768px) 100vw, 50vw"/><span className="absolute right-5 top-5 flex size-10 items-center justify-center rounded-full bg-paper/90 opacity-0 group-hover:opacity-100"><ArrowUpRight className="size-4"/></span></div><div className="mt-4 flex justify-between"><div><h3 className="font-serif text-2xl">{title(a)}</h3><p className="mt-1 text-[10px] uppercase tracking-[.14em] text-charcoal/45">{a.category}</p></div><span className="text-[10px] text-charcoal/40">{a.year}</span></div></button>)}</div>}</div>{selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/95 p-5 md:p-12" role="dialog" aria-modal="true" aria-label={title(selected)}><button onClick={() => setSelected(null)} className="absolute right-5 top-5 text-paper/70" aria-label="Close artwork"><X/></button><div className="grid w-full max-w-6xl gap-8 md:grid-cols-[1fr_260px] md:items-end"><div className="relative aspect-[1.35/1] overflow-hidden"><Image src={selected.image} alt={title(selected)} fill className="object-contain" sizes="90vw"/></div><div className="text-paper"><h2 className="font-serif text-4xl">{title(selected)}</h2><p className="mt-3 text-xs uppercase tracking-[.15em] text-paper/50">{selected.category} {selected.year && `· ${selected.year}`}</p><p className="mt-8 text-sm leading-6 text-paper/65">{desc(selected)}</p></div></div></div>}</section> }

function Activities({ t, language }: { t: typeof ui.en; language: Language }) {
  const [filter, setFilter] = useState('All')
  const items = activities
  const published = items.filter(item => item.status === 'published')
  const categories = ['All', ...Array.from(new Set(published.map(item => item.type)))]
  const filtered = filter === 'All' ? published : published.filter(item => item.type === filter)
  return <section id="activities" className="border-t border-charcoal/10 px-5 py-24 md:px-10 md:py-36"><div className="mx-auto max-w-[1440px]"><div className="flex flex-col justify-between gap-8 md:flex-row md:items-end"><div><p className="eyebrow mb-5">Awards & Activities <span className="ml-2 text-olive">/ 03</span></p><h2 className="font-serif text-5xl tracking-[-.06em] md:text-7xl">A life in motion.</h2><p className="mt-5 max-w-md text-sm leading-6 text-charcoal/60">Recognition, encounters, exhibitions, and moments that shape the practice.</p></div>{categories.length > 1 && <div className="flex max-w-lg flex-wrap gap-x-5 gap-y-3 border-b border-charcoal/15 pb-3 text-[10px] uppercase tracking-[.13em]">{categories.map(category => <button key={category} onClick={() => setFilter(category)} className={filter === category ? 'text-charcoal' : 'text-charcoal/40'}>{category}</button>)}</div>}</div>{filtered.length === 0 ? <div className="mt-16 border-b border-charcoal/15 py-16 text-center"><p className="font-serif text-4xl text-charcoal/45">New moments are coming soon.</p></div> : <div className="mt-16 grid gap-x-6 gap-y-14 md:grid-cols-2 lg:grid-cols-3">{filtered.map(item => { const title = language === 'bn' ? item.titleBn || item.title : language === 'ja' ? item.titleJa || item.title : item.title; const description = language === 'bn' ? item.descriptionBn || item.description : language === 'ja' ? item.descriptionJa || item.description : item.description; return <article key={item.id} className="group"><div className="relative aspect-[1.2/1] overflow-hidden bg-beige">{item.image && <Image src={item.image} alt={title} fill className="object-cover transition-transform duration-700 group-hover:scale-105" sizes="(max-width: 768px) 90vw, 30vw"/>}</div><div className="mt-5 flex items-start justify-between gap-4"><div><p className="eyebrow text-olive">{item.type}</p><h3 className="mt-2 font-serif text-3xl leading-none">{title}</h3></div><span className="text-[10px] uppercase tracking-[.12em] text-charcoal/45">{item.date}</span></div><p className="mt-4 text-sm leading-6 text-charcoal/60">{description}</p><p className="mt-4 text-[10px] uppercase tracking-[.13em] text-charcoal/45">{item.location}</p>{item.externalUrl && <a href={item.externalUrl} target="_blank" rel="noreferrer" className="mt-4 inline-block text-[10px] uppercase tracking-[.13em] underline underline-offset-4">View more ↗</a>}</article> })}</div>}</div></section>
}

function About({ t, language }: { t: typeof ui.en; language: Language }) { return <section id="about" className="px-5 py-24 md:px-10 md:py-36"><div className="mx-auto grid max-w-[1440px] gap-12 md:grid-cols-[.75fr_1fr] md:gap-28"><div className="relative aspect-[.85/1] max-w-md overflow-hidden bg-beige"><Image src={artist.portrait} alt={`${artist.name} portrait`} fill className="object-cover" sizes="(max-width: 768px) 90vw, 35vw"/><span className="absolute bottom-5 left-5 text-[10px] uppercase tracking-[.15em] text-paper">{artist.name}</span></div><div className="max-w-xl self-center"><p className="eyebrow mb-6">{t.aboutArtist} <span className="ml-2 text-olive">/ 03</span></p><h2 className="font-serif text-5xl leading-[.95] tracking-[-.06em] md:text-7xl">{artist.name}<br/><em className="text-olive">{artist.discipline}</em></h2><p className="mt-9 max-w-md text-[15px] leading-7 text-charcoal/65">{artist.bio[language]}</p><div className="mt-14 grid grid-cols-2 gap-6 border-t border-charcoal/15 pt-5 text-[10px] uppercase tracking-[.14em] text-charcoal/50"><span>{t.focus}<br/><strong className="mt-2 block font-normal text-charcoal">{t.focusValue}</strong></span><span>{t.based}<br/><strong className="mt-2 block font-normal text-charcoal">{t.basedValue}</strong></span></div></div></div></section> }

function Contact({ t }: { t: typeof ui.en }) { const links = [{ label: t.email, href: artist.email ? `mailto:${artist.email}` : '' }, { label: t.call, href: artist.phone ? `tel:${artist.phone}` : '' }, { label: t.whatsapp, href: artist.whatsapp ? `https://wa.me/${artist.whatsapp.replace(/[^\d]/g, '')}` : '' }].filter(x => x.href); return <section id="contact" className="bg-charcoal px-5 py-24 text-paper md:px-10 md:py-36"><div className="mx-auto max-w-[1440px]"><div className="grid gap-16 md:grid-cols-[1fr_.7fr] md:items-end"><div><p className="eyebrow text-paper/45">{t.contact} <span className="ml-2 text-olive">/ 05</span></p><h2 className="mt-6 max-w-3xl font-serif text-6xl leading-[.88] tracking-[-.06em]">{t.contactIntro}</h2></div><div>{links.length > 0 && <div className="flex flex-col items-start gap-5 text-sm">{links.map(l => <a key={l.label} href={l.href} className="link-line">{l.label}<ArrowUpRight/></a>)}</div>}</div></div></div></section> }

export default function Page() { usePortfolioData(); const { language, change, t } = useLanguage(); return <main><Nav language={language} onChange={change}/><Hero t={t}/><Gallery language={language} t={t}/><Activities language={language} t={t}/><About t={t} language={language}/><section className="border-y border-charcoal/10 px-5 py-20 md:px-10"><div className="mx-auto max-w-[1440px]"><p className="eyebrow">{t.approach} <span className="ml-2 text-olive">/ 04</span></p></div></section><Contact t={t}/><footer className="bg-charcoal px-5 pb-8 text-paper md:px-10"><div className="mx-auto flex max-w-[1440px] flex-col gap-5 border-t border-paper/15 pt-6 text-[10px] uppercase tracking-[.14em] text-paper/40 md:flex-row md:items-center md:justify-between"><span className="font-serif text-xl normal-case tracking-[-.04em] text-paper">Abid<span className="text-olive">.</span></span><span>© {new Date().getFullYear()} {artist.name} · {artist.discipline}</span><a href="/admin" className="hover:text-paper">{t.admin} ↗</a></div></footer></main> }
