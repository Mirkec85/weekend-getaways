'use client'

import { useState } from 'react'

export default function Home() {
  const [email, setEmail] = useState('')
  const [gdprConsent, setGdprConsent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'already' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setStatus('idle')
    setErrorMessage('')

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, gdpr_consent: gdprConsent }),
      })

      if (res.status === 201) {
        setStatus('success')
        setEmail('')
        setGdprConsent(false)
      } else if (res.status === 409) {
        setStatus('already')
      } else {
        const data = await res.json()
        setStatus('error')
        setErrorMessage(data.error || 'Something went wrong. Please try again.')
      }
    } catch {
      setStatus('error')
      setErrorMessage('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-16">
      <main className="w-full max-w-xl">
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-6">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M2 16L30 4L22 28L16 18L2 16Z" fill="#18181b" />
              <path d="M16 18L20 14" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span className="text-2xl font-bold tracking-tight text-zinc-900">flajko</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 mb-4">
            Cheapest Weekend Flights from Zagreb
          </h1>
          <p className="text-lg text-zinc-600 leading-relaxed">
            Every Thursday, 3 budget destinations land in your inbox — hand-picked, genuinely cheap, ready to book.
          </p>
        </div>

        {status === 'success' ? (
          <div className="rounded-lg bg-green-50 border border-green-200 px-6 py-5">
            <p className="text-green-800 font-medium">
              Check your email to confirm your subscription!
            </p>
          </div>
        ) : status === 'already' ? (
          <div className="rounded-lg bg-blue-50 border border-blue-200 px-6 py-5">
            <p className="text-blue-800 font-medium">
              You&apos;re already subscribed!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-700 mb-1">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-zinc-300 px-4 py-3 text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-0"
              />
            </div>

            <div className="flex items-start gap-3">
              <input
                id="gdpr_consent"
                type="checkbox"
                checked={gdprConsent}
                onChange={(e) => setGdprConsent(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500"
              />
              <label htmlFor="gdpr_consent" className="text-sm text-zinc-600 leading-snug">
                I agree to receive weekly flight deal emails. I can unsubscribe at any time.{' '}
                <a href="/privacy" className="underline hover:text-zinc-900 transition-colors">Privacy policy</a>.
              </label>
            </div>

            {status === 'error' && (
              <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3">
                <p className="text-sm text-red-700">{errorMessage}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-zinc-900 px-6 py-3 text-white font-medium hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Subscribing...' : 'Subscribe'}
            </button>
          </form>
        )}
      </main>
    </div>
  )
}
