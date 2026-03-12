'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

const deals = [
  { id: 1, destination: 'Rome', iata: 'FCO', country: 'Italy', price: 29, originalPrice: 89, departure: 'Fri, 21 Mar', return: 'Sun, 23 Mar', duration: '2h 10m', airline: 'Ryanair', tag: 'Best deal' },
  { id: 2, destination: 'Vienna', iata: 'VIE', country: 'Austria', price: 19, originalPrice: 65, departure: 'Fri, 21 Mar', return: 'Sun, 23 Mar', duration: '1h 05m', airline: 'Wizz Air', tag: 'Nearby' },
  { id: 3, destination: 'Barcelona', iata: 'BCN', country: 'Spain', price: 39, originalPrice: 120, departure: 'Fri, 28 Mar', return: 'Sun, 30 Mar', duration: '2h 30m', airline: 'Vueling', tag: 'Popular' },
  { id: 4, destination: 'Amsterdam', iata: 'AMS', country: 'Netherlands', price: 45, originalPrice: 130, departure: 'Fri, 4 Apr', return: 'Sun, 6 Apr', duration: '2h 20m', airline: 'KLM', tag: '' },
  { id: 5, destination: 'Paris', iata: 'CDG', country: 'France', price: 49, originalPrice: 150, departure: 'Fri, 4 Apr', return: 'Sun, 6 Apr', duration: '2h 15m', airline: 'Air France', tag: '' },
  { id: 6, destination: 'Budapest', iata: 'BUD', country: 'Hungary', price: 15, originalPrice: 55, departure: 'Fri, 11 Apr', return: 'Sun, 13 Apr', duration: '0h 55m', airline: 'Wizz Air', tag: 'Flash deal' },
]

const testimonials = [
  {
    name: 'Maja Kovač',
    role: 'Travel blogger',
    avatar: 'MK',
    quote: 'I booked a weekend in Rome for €29 last month. I had no idea prices like that existed. Flajko found it before I even thought to look.',
  },
  {
    name: 'Tomislav Babić',
    role: 'Software engineer',
    avatar: 'TB',
    quote: 'Week 3, I got Budapest for €15 return. Booked it in 5 minutes. Now I open Flajko emails before I even have my morning coffee.',
  },
  {
    name: 'Ana Perić',
    role: 'UX Designer',
    avatar: 'AP',
    quote: 'Finally a newsletter that respects my time. Three deals. Every Thursday. No ads, no filler. Just flights I can actually afford.',
  },
]

const steps = [
  {
    number: '01',
    title: 'Subscribe',
    description: 'Enter your email. No account, no credit card, no setup required.',
  },
  {
    number: '02',
    title: 'Get your deals',
    description: 'Every Thursday morning, 3 hand-picked weekend flights from Zagreb land in your inbox.',
  },
  {
    number: '03',
    title: 'Book & fly',
    description: 'Click through to book directly with the airline. We never mark up prices — what you see is what you pay.',
  },
]

function SubscribeForm({
  email,
  setEmail,
  gdprConsent,
  setGdprConsent,
  loading,
  status,
  errorMessage,
  onSubmit,
  dark = false,
}: {
  email: string
  setEmail: (v: string) => void
  gdprConsent: boolean
  setGdprConsent: (v: boolean) => void
  loading: boolean
  status: string
  errorMessage: string
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  dark?: boolean
}) {
  if (status === 'success') {
    return (
      <div className="rounded-xl bg-green-50 border border-green-200 px-6 py-5 max-w-md">
        <p className="text-green-800 font-medium">✓ Check your email to confirm your subscription!</p>
      </div>
    )
  }
  if (status === 'already') {
    return (
      <div className="rounded-xl bg-blue-50 border border-blue-200 px-6 py-5 max-w-md">
        <p className="text-blue-800 font-medium">You&apos;re already subscribed!</p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 max-w-md w-full">
      <div className="flex">
        <input
          type="email"
          required
          placeholder="your@email.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className={`flex-1 rounded-l-xl border px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3174E0]/30 ${
            dark
              ? 'bg-[#1A1A1A] border-[#333] text-white placeholder-[#555] focus:border-[#3174E0]'
              : 'bg-white border-[#949494] text-[#0B0809] placeholder-[#71717A] focus:border-[#3174E0]'
          }`}
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-r-xl bg-[#3174E0] px-6 py-3.5 text-white text-sm font-semibold hover:bg-[#2563c8] focus:outline-none focus:ring-2 focus:ring-[#3174E0] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
        >
          {loading ? 'Subscribing…' : 'Subscribe free'}
        </button>
      </div>

      <div className="flex items-start gap-2.5">
        <input
          id={dark ? 'gdpr_dark' : 'gdpr_light'}
          type="checkbox"
          checked={gdprConsent}
          onChange={e => setGdprConsent(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-[#3174E0] focus:ring-[#3174E0] bg-transparent"
        />
        <label
          htmlFor={dark ? 'gdpr_dark' : 'gdpr_light'}
          className={`text-xs leading-snug ${dark ? 'text-[#666]' : 'text-[#71717A]'}`}
        >
          I agree to receive weekly flight deal emails. I can unsubscribe at any time.{' '}
          <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#0B0809] transition-colors">
            Privacy policy
          </a>.
        </label>
      </div>

      {status === 'error' && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
          <p className="text-sm text-red-700">{errorMessage}</p>
        </div>
      )}
    </form>
  )
}

export default function Home() {
  const [email, setEmail] = useState('')
  const [gdprConsent, setGdprConsent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'already' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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
    <div className="min-h-screen bg-white text-[#0B0809]">

      {/* ── NAVBAR ── */}
      <nav
        className={`sticky top-0 z-50 transition-all duration-200 border-b ${
          scrolled ? 'bg-white/95 backdrop-blur-sm shadow-sm border-[#ECECEC]' : 'bg-white border-[#ECECEC]'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-10 flex items-center justify-between h-16">
          <a href="#hero">
            <Image src="/logo.svg" alt="Flajko" width={100} height={28} priority />
          </a>

          <div className="hidden md:flex items-center gap-8">
            <a href="#how-it-works" className="text-sm text-[#71717A] hover:text-[#0B0809] transition-colors">How it works</a>
            <a href="#deals" className="text-sm text-[#71717A] hover:text-[#0B0809] transition-colors">Deals</a>
            <a href="#testimonials" className="text-sm text-[#71717A] hover:text-[#0B0809] transition-colors">Reviews</a>
          </div>

          <div className="flex items-center gap-3">
            <button
              className="text-sm font-medium px-3 py-1.5 transition-colors"
              style={{ color: '#0B0809' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#155dfc' }}
              onMouseLeave={e => { e.currentTarget.style.color = '#0B0809' }}
            >
              Log In
            </button>
            <button
              className="text-sm font-medium rounded-lg px-4 py-1.5 border transition-colors"
              style={{ color: '#0B0809', borderColor: '#3174E0' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#3174E0'; e.currentTarget.style.color = 'white' }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = '#0B0809' }}
            >
              Register
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section id="hero" className="relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image src="/bg-plane.jpg.jpg" alt="" fill className="object-cover" priority />
          <div className="absolute inset-0 bg-white/65" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 pt-20 pb-32">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase text-[#3174E0] bg-blue-50 border border-blue-100 rounded-full px-3 py-1 mb-6">
              ✈ Every Thursday · Free newsletter
            </span>

            <h1 className="text-5xl md:text-6xl font-bold leading-[1.08] tracking-tight text-[#0B0809] mb-5">
              Cheapest Weekend Flights from Zagreb
            </h1>

            <p className="text-lg text-[#52525B] leading-relaxed mb-8 max-w-lg">
              Every Thursday, 3 budget destinations land in your inbox. Hand-picked, genuinely cheap, ready to book.
            </p>

            <SubscribeForm
              email={email}
              setEmail={setEmail}
              gdprConsent={gdprConsent}
              setGdprConsent={setGdprConsent}
              loading={loading}
              status={status}
              errorMessage={errorMessage}
              onSubmit={handleSubmit}
            />

            <p className="text-xs text-[#A1A1AA] mt-4">Free forever · No spam · Unsubscribe anytime</p>
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF ── */}
      <section className="bg-[#FAFAFA] border-y border-[#ECECEC] py-12">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <p className="text-center text-xs font-semibold tracking-widest uppercase text-[#A1A1AA] mb-8">
            Flight data powered by
          </p>
          <div className="flex flex-wrap items-center justify-center gap-10 md:gap-16">
            <div className="flex items-center gap-2.5 opacity-60 hover:opacity-100 transition-opacity">
              <div className="w-7 h-7 rounded-full bg-[#00B2A9] flex items-center justify-center">
                <span className="text-white text-[11px] font-bold">K</span>
              </div>
              <span className="text-[#52525B] font-semibold text-sm tracking-tight">Kiwi.com</span>
            </div>
            <div className="flex items-center gap-2.5 opacity-60 hover:opacity-100 transition-opacity">
              <div className="w-7 h-7 rounded bg-[#FF4B00] flex items-center justify-center">
                <span className="text-white text-[11px] font-bold">L</span>
              </div>
              <span className="text-[#52525B] font-semibold text-sm tracking-tight">lastminute.com</span>
            </div>
            <div className="flex items-center gap-2.5 opacity-60 hover:opacity-100 transition-opacity">
              <div className="w-7 h-7 rounded bg-[#FF690F] flex items-center justify-center">
                <span className="text-white text-[11px] font-bold">K</span>
              </div>
              <span className="text-[#52525B] font-semibold text-sm tracking-tight">Kayak</span>
            </div>
            <div className="flex items-center gap-2.5 opacity-60 hover:opacity-100 transition-opacity">
              <div className="w-7 h-7 rounded bg-[#4285F4] flex items-center justify-center">
                <span className="text-white text-[11px] font-bold">G</span>
              </div>
              <span className="text-[#52525B] font-semibold text-sm tracking-tight">Google Flights</span>
            </div>
            <div className="flex items-center gap-2.5 opacity-60 hover:opacity-100 transition-opacity">
              <div className="w-7 h-7 rounded bg-[#0770E3] flex items-center justify-center">
                <span className="text-white text-[11px] font-bold">S</span>
              </div>
              <span className="text-[#52525B] font-semibold text-sm tracking-tight">Skyscanner</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="max-w-xl mb-16">
            <span className="text-xs font-semibold tracking-widest uppercase text-[#3174E0] mb-3 block">
              Simple by design
            </span>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-[#0B0809]">
              How Flajko works
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            {steps.map(step => (
              <div key={step.number} className="relative">
                <span className="text-[88px] font-black text-[#F0F0F2] leading-none select-none absolute -top-6 -left-3 z-0">
                  {step.number}
                </span>
                <div className="relative z-10 pt-8">
                  <h3 className="text-xl font-bold text-[#0B0809] mb-3">{step.title}</h3>
                  <p className="text-[#71717A] leading-relaxed text-sm">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DEALS ── */}
      <section id="deals" className="py-24 bg-[#FAFAFA]">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <span className="text-xs font-semibold tracking-widest uppercase text-[#3174E0] mb-3 block">
                This week
              </span>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-[#0B0809]">Latest deals</h2>
              <p className="text-[#71717A] mt-3 text-sm">
                Round-trip from Zagreb (ZAG). Updated every Thursday morning.
              </p>
            </div>
            <p className="text-sm text-[#A1A1AA] shrink-0">Subscribe to get these in your inbox →</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {deals.map(deal => (
              <div
                key={deal.id}
                className="bg-white rounded-2xl border border-[#ECECEC] p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-lg font-bold text-[#0B0809]">{deal.destination}</span>
                      <span className="text-xs text-[#A1A1AA] font-mono bg-[#F4F4F5] px-1.5 py-0.5 rounded">
                        {deal.iata}
                      </span>
                    </div>
                    <span className="text-xs text-[#A1A1AA]">{deal.country}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-[#3174E0]">€{deal.price}</div>
                    <div className="text-xs text-[#A1A1AA] line-through">€{deal.originalPrice}</div>
                  </div>
                </div>

                <div className="space-y-1.5 mb-4 border-t border-[#F4F4F5] pt-4">
                  <div className="flex items-center gap-2 text-xs text-[#71717A]">
                    <span>✈</span>
                    <span>{deal.departure} → {deal.return}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#71717A]">
                    <span>⏱</span>
                    <span>{deal.duration} · {deal.airline}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  {deal.tag ? (
                    <span className="text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full bg-blue-50 text-[#3174E0] border border-blue-100">
                      {deal.tag}
                    </span>
                  ) : (
                    <span />
                  )}
                  <span className="text-xs text-[#A1A1AA]">Subscribe to book →</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-[#71717A] text-sm mb-4">Want deals like these in your inbox every Thursday?</p>
            <a
              href="#hero"
              className="inline-flex items-center gap-2 bg-[#3174E0] text-white font-semibold text-sm px-6 py-3 rounded-xl hover:bg-[#2563c8] transition-colors"
            >
              Subscribe free ↑
            </a>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="max-w-xl mb-16">
            <span className="text-xs font-semibold tracking-widest uppercase text-[#3174E0] mb-3 block">
              What subscribers say
            </span>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-[#0B0809]">
              They booked. You can too.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map(t => (
              <div key={t.name} className="bg-[#FAFAFA] rounded-2xl border border-[#ECECEC] p-6 flex flex-col">
                <div className="text-3xl text-[#D4D4D8] leading-none mb-4 font-serif">"</div>
                <p className="text-[#52525B] text-sm leading-relaxed flex-1 mb-6">{t.quote}</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#3174E0] flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#0B0809]">{t.name}</div>
                    <div className="text-xs text-[#A1A1AA]">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="bg-[#0B0809] py-24">
        <div className="max-w-7xl mx-auto px-6 md:px-10 text-center">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase text-[#3174E0] bg-[#3174E0]/10 border border-[#3174E0]/20 rounded-full px-3 py-1 mb-6">
            ✈ Free · No spam · Unsubscribe anytime
          </span>

          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-5 max-w-2xl mx-auto leading-[1.1]">
            Your next weekend trip starts with one email
          </h2>

          <p className="text-[#A1A1AA] text-lg mb-10 max-w-sm mx-auto">
            Join thousands of Zagreb travelers who never overpay for weekend flights.
          </p>

          <div className="flex justify-center">
            <SubscribeForm
              email={email}
              setEmail={setEmail}
              gdprConsent={gdprConsent}
              setGdprConsent={setGdprConsent}
              loading={loading}
              status={status}
              errorMessage={errorMessage}
              onSubmit={handleSubmit}
              dark
            />
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#0B0809] border-t border-[#1A1A1A] py-8">
        <div className="max-w-7xl mx-auto px-6 md:px-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <Image src="/logo.svg" alt="Flajko" width={80} height={22} className="brightness-0 invert opacity-60" />
          <p className="text-xs text-[#444]">© {new Date().getFullYear()} Flajko. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-xs text-[#444] hover:text-[#888] transition-colors">
              Privacy policy
            </a>
            <a href="/unsubscribed" className="text-xs text-[#444] hover:text-[#888] transition-colors">
              Unsubscribe
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
