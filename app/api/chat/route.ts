import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const allowedLanguages = ['en', 'bn', 'ja'] as const
type Language = (typeof allowedLanguages)[number]
type Message = { role: 'user' | 'assistant'; content: string }

function clean(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

export async function POST(request: Request) {
  const apiKey = process.env.GROQ_API_KEY
  const model = process.env.GROQ_MODEL
  if (!apiKey || !model) return NextResponse.json({ error: 'Chat is not configured yet.' }, { status: 503 })

  const body = await request.json().catch(() => null)
  const messages = Array.isArray(body?.messages)
    ? body.messages.filter((message: Message) => ['user', 'assistant'].includes(message?.role) && typeof message?.content === 'string').slice(-12).map((message: Message) => ({ role: message.role, content: clean(message.content, 2000) }))
    : []
  if (!messages.length || messages[messages.length - 1].role !== 'user') return NextResponse.json({ error: 'A user message is required.' }, { status: 400 })
  const language: Language = allowedLanguages.includes(body?.language) ? body.language : 'en'

  try {
    const supabase = await createClient()
    const [profile, artworks, activities] = await Promise.all([
      supabase.from('artist_profile').select('name,discipline,bio_en,bio_bn,bio_ja,email,phone,whatsapp').maybeSingle(),
      supabase.from('artworks').select('title,title_bn,title_ja,category,year,description,description_bn,description_ja').eq('status', 'published').limit(50),
      supabase.from('activities').select('title,title_bn,title_ja,type,date,location,description,description_bn,description_ja').eq('status', 'published').limit(50),
    ])
    if (profile.error || artworks.error || activities.error) throw new Error('Unable to load portfolio knowledge.')
    const knowledge = JSON.stringify({ profile: profile.data, artworks: artworks.data, activities: activities.data })
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        temperature: 0.35,
        max_tokens: 350,
        messages: [
          { role: 'system', content: `You are the concise, warm gallery assistant for Abid Hossain, a 3D Landscape Artist. Answer in the visitor's language (${language === 'bn' ? 'Bangla' : language === 'ja' ? 'Japanese' : 'English'}) when possible. Use only the portfolio data below. Never invent awards, prices, availability, or facts. If data is missing, say so and suggest contacting the artist. Help with commissions, collaborations, exhibitions, and new projects, but do not collect sensitive information in chat. Keep replies elegant and under 120 words. Portfolio data: ${knowledge}` },
          ...messages,
        ],
      }),
    })
    if (!groqResponse.ok) {
      const detail = await groqResponse.text()
      console.error('Groq request failed', groqResponse.status, detail.slice(0, 500))
      return NextResponse.json({ error: groqResponse.status === 429 ? 'The assistant is busy. Please try again shortly.' : 'The assistant is temporarily unavailable.' }, { status: 502 })
    }
    const result = await groqResponse.json()
    const content = result?.choices?.[0]?.message?.content
    if (typeof content !== 'string' || !content.trim()) throw new Error('Groq returned no answer.')
    return NextResponse.json({ message: content.trim() })
  } catch (error) {
    console.error('Chat request failed', error)
    return NextResponse.json({ error: 'The assistant is temporarily unavailable.' }, { status: 500 })
  }
}
