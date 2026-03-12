'use client'

import { useState } from 'react'
import Image from 'next/image'

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
    <div className="relative min-h-screen flex flex-col">
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/bg-plane.jpg.jpg"
          alt="Airport tarmac"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-white/40" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-[80px] py-4 border-b" style={{ borderColor: '#CECECE' }}>
        <Image src="/logo.svg" alt="Flajko" width={110} height={32} priority />
        <div className="flex items-center gap-3">
          <button className="text-sm font-medium transition-colors px-2 py-1" style={{ color: '#0B0809' }} onMouseEnter={e => { e.currentTarget.style.color = '#155dfc'; }} onMouseLeave={e => { e.currentTarget.style.color = '#0B0809'; }}>
            Log In
          </button>
          <button className="text-sm font-medium rounded-lg px-4 py-1.5 border transition-colors hover:text-white" style={{ color: '#0B0809', borderColor: '#3174E0' }} onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#3174E0'; e.currentTarget.style.color = 'white'; }} onMouseLeave={e => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = '#0B0809'; }}>
            Register
          </button>
        </div>
      </nav>

      {/* Content */}
      <main className="relative z-10 flex-1 flex items-start justify-center px-[80px] pt-[100px]">
        <div className="w-full max-w-[600px]">
          <div className="mb-[16px]">
            <h1 className="text-[48px] leading-[110%] tracking-[0] font-bold text-zinc-900 mb-4 text-center">
              Cheapest Weekend Flights from Zagreb
            </h1>
            <p className="text-lg text-zinc-600 leading-relaxed text-center">
              Every Thursday, 3 budget destinations land in your inbox.<br />Hand-picked, genuinely cheap, ready to book.
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
                <label htmlFor="email" className="sr-only">
                  Email address
                </label>
                <div className="flex">
                  <input
                    id="email"
                    type="email"
                    required
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 rounded-l-lg border px-4 py-3 text-zinc-900 placeholder-[#71717A] focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0" style={{ borderColor: '#949494' }}
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="rounded-r-lg bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                  >
                    {loading ? 'Subscribing...' : 'Subscribe'}
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <input
                  id="gdpr_consent"
                  type="checkbox"
                  checked={gdprConsent}
                  onChange={(e) => setGdprConsent(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 bg-transparent"
                />
                <label htmlFor="gdpr_consent" className="text-sm text-zinc-600 leading-snug">
                  I agree to receive weekly flight deal emails. I can unsubscribe at any time.{' '}
                  <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-zinc-900 transition-colors">Privacy policy</a>.
                </label>
              </div>

              {status === 'error' && (
                <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3">
                  <p className="text-sm text-red-700">{errorMessage}</p>
                </div>
              )}
            </form>
          )}
        </div>
      </main>
    </div>
  )
}
