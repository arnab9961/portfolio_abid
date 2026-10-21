'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AdminLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) router.replace('/admin')
    })
  }, [router])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await createClient().auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    else router.replace('/admin')
    setLoading(false)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-5 text-charcoal">
      <form onSubmit={submit} className="w-full max-w-md border border-charcoal/10 bg-white p-8 md:p-10">
        <p className="eyebrow">Private workspace</p>
        <h1 className="mt-3 font-serif text-5xl tracking-[-.06em]">Studio login</h1>
        <p className="mt-4 text-sm leading-6 text-charcoal/55">Sign in with the administrator account created in Supabase.</p>
        <div className="mt-8 space-y-5">
          <label className="field">Email<input required type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} /></label>
          <label className="field">Password<input required type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} /></label>
        </div>
        {error && <p role="alert" className="mt-5 text-sm text-red-700">{error}</p>}
        <button disabled={loading} className="mt-8 w-full bg-charcoal px-5 py-3 text-[11px] uppercase tracking-[.13em] text-paper disabled:opacity-50">
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
        <a href="/" className="mt-6 block text-center text-[10px] uppercase tracking-[.13em] text-charcoal/50">Back to portfolio</a>
      </form>
    </main>
  )
}
