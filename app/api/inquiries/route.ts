import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const types = ['commission', 'collaboration', 'exhibition', 'new-project', 'other']
const contacts = ['email', 'whatsapp', 'phone']
const value = (input: unknown, max: number) => typeof input === 'string' ? input.trim().slice(0, max) : ''

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const name = value(body?.name, 120)
  const email = value(body?.email, 254)
  const whatsapp = value(body?.whatsapp, 40)
  const inquiryType = value(body?.inquiryType, 30)
  const projectDescription = value(body?.projectDescription, 4000)
  const preferredContact = value(body?.preferredContact, 20)
  if (!name || (!email && !whatsapp) || !types.includes(inquiryType) || !projectDescription || !contacts.includes(preferredContact)) {
    return NextResponse.json({ error: 'Please complete the required inquiry fields.' }, { status: 400 })
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('inquiries').insert({
      name, email: email || null, whatsapp: whatsapp || null, inquiry_type: inquiryType,
      project_description: projectDescription, budget: value(body?.budget, 120) || null,
      deadline: value(body?.deadline, 120) || null, preferred_contact: preferredContact,
    }).select('id').single()
    if (error) throw new Error(error.message)
    let notification: 'sent' | 'not-configured' | 'failed' = 'not-configured'
    if (process.env.RESEND_API_KEY && process.env.INQUIRY_FROM_EMAIL) {
      const { data: profile } = await supabase.from('artist_profile').select('email,name').maybeSingle()
      if (profile?.email) {
        const notificationResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: process.env.INQUIRY_FROM_EMAIL,
            to: [profile.email],
            subject: `New ${inquiryType} inquiry from ${name}`,
            text: `Name: ${name}\nEmail: ${email || 'Not provided'}\nWhatsApp: ${whatsapp || 'Not provided'}\nPreferred contact: ${preferredContact}\nBudget: ${value(body?.budget, 120) || 'Not provided'}\nDeadline: ${value(body?.deadline, 120) || 'Not provided'}\n\n${projectDescription}`,
          }),
        })
        notification = notificationResponse.ok ? 'sent' : 'failed'
        if (!notificationResponse.ok) console.error('Inquiry notification failed', notificationResponse.status, (await notificationResponse.text()).slice(0, 500))
      }
    }
    return NextResponse.json({ id: data.id, notification })
  } catch (error) {
    console.error('Inquiry save failed', error)
    return NextResponse.json({ error: 'We could not save your inquiry. Please try again or use the contact links.' }, { status: 500 })
  }
}
