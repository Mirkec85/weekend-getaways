'use client'

import { useState } from 'react'
import Link from 'next/link'

// ── Figma asset URLs (valid 7 days from extraction) ──────────────────────────
const LOGO_NAV         = 'https://www.figma.com/api/mcp/asset/1f48afff-1c0c-4426-85d6-39ce9e27b65c'
const LOGO_FOOTER      = 'https://www.figma.com/api/mcp/asset/620150d4-9035-4f15-8d26-150cded3cc0e'

const HERO_1           = 'https://www.figma.com/api/mcp/asset/a1d55729-a427-4858-aff2-adc71af4acc9'
const HERO_2           = 'https://www.figma.com/api/mcp/asset/761710ca-83e7-4e5a-8231-0521c0b8ebc8'
const HERO_3           = 'https://www.figma.com/api/mcp/asset/a49b39d5-78f6-49e6-aa2c-a1be98b9d1d7'
const HERO_4           = 'https://www.figma.com/api/mcp/asset/7078d1f1-e4fc-4fff-9324-737d83f77cda'

// Mobile-specific assets (from Figma node 201:891)
const HAMBURGER_ICON   = 'https://www.figma.com/api/mcp/asset/6339a7bd-5e33-4074-ac54-992efe08ffde'
const CLOSE_ICON       = 'https://www.figma.com/api/mcp/asset/87b699d4-3478-4bf6-ad68-25370851f506'
const HERO_MOBILE      = 'https://www.figma.com/api/mcp/asset/2bce29e5-d228-4cb9-9048-f02106272ee0'
const VISUAL_FLOW_MOBILE = 'https://www.figma.com/api/mcp/asset/057d2568-ef24-4389-bd08-77bc14753a3e'

const LOGO_KIWI        = 'https://www.figma.com/api/mcp/asset/0b120ba1-bf6e-45f0-8eac-d65e7b902ca4'
const LOGO_LASTMINUTE  = 'https://www.figma.com/api/mcp/asset/683a753c-dbc0-42a0-b596-a0e7f7f29a6b'
const LOGO_KAYAK       = 'https://www.figma.com/api/mcp/asset/6aaf0819-2ba4-4c66-be37-335c65db8847'
const LOGO_GOOGLE      = 'https://www.figma.com/api/mcp/asset/06e32288-1a0c-4ac4-9dff-52dbd348f2bf'

const VISUAL_FLOW      = 'https://www.figma.com/api/mcp/asset/ea6470a1-8ccb-4311-a804-dc0566f615c7'

const ICON_AIRPLANE    = 'https://www.figma.com/api/mcp/asset/45d06eb5-cd54-4b7c-9be9-feb72431d06a'
const ICON_BED         = 'https://www.figma.com/api/mcp/asset/87ec5208-845a-4175-8bb6-4c3e6518daa9'
const ICON_CLOCK       = 'https://www.figma.com/api/mcp/asset/588f231c-a8bb-47d6-90a8-3fe54dcf94f3'
const ICON_ARROW       = 'https://www.figma.com/api/mcp/asset/ccde18c5-3b77-42a7-bca1-610e464e2dea'
const ICON_QUOTES      = 'https://www.figma.com/api/mcp/asset/ac82fac2-0f3a-4c4d-a360-91b39b0c32df'

const AVATAR_1         = 'https://www.figma.com/api/mcp/asset/5aac638c-0598-488e-99cf-a5739c7043b4'
const AVATAR_2         = 'https://www.figma.com/api/mcp/asset/feaa14ff-65ca-4445-bb8f-5d8620233b24'
const AVATAR_3         = 'https://www.figma.com/api/mcp/asset/94bb5db3-95ca-428d-a3d1-2fc4c2e9c30e'

// ── Data ─────────────────────────────────────────────────────────────────────
const deals = [
  {
    city: 'Rome',
    price: 'from €89',
    blurb: "Ancient ruins, Renaissance art, and the world's best pasta just steps from every corner.",
    dates: 'Fri, 21 Mar → Sun, 23 Mar',
    hotel: 'Est. €110/night',
    observed: 'Observed: Thu 19 Mar 07:42 CET',
    image: 'https://www.figma.com/api/mcp/asset/9f24e73b-b37c-401c-86d0-1e95004f2e85',
  },
  {
    city: 'Vienna',
    price: 'from €112',
    blurb: 'Imperial palaces, classical music, and café culture with elegant streets at every turn.',
    dates: 'Fri, 21 Mar → Sun, 23 Mar',
    hotel: 'Est. €110/night',
    observed: 'Observed: Thu 19 Mar 07:42 CET',
    image: 'https://www.figma.com/api/mcp/asset/04af820c-4f4b-485e-946d-484ff4479e9c',
  },
  {
    city: 'Amsterdam',
    price: 'from €118',
    blurb: 'Canal-lined streets, nice museums, and vibrant neighborhoods connected by bike and water.',
    dates: 'Fri, 21 Mar → Sun, 23 Mar',
    hotel: 'Est. €110/night',
    observed: 'Observed: Thu 19 Mar 07:42 CET',
    image: 'https://www.figma.com/api/mcp/asset/db388b54-dabe-4c5d-b8c2-182996ba03d0',
  },
  {
    city: 'Paris',
    price: 'from €172',
    blurb: 'From the Eiffel Tower to hidden cafés, beauty and culture everywhere you look.',
    dates: 'Fri, 21 Mar → Sun, 23 Mar',
    hotel: 'Est. €110/night',
    observed: 'Observed: Thu 19 Mar 07:42 CET',
    image: 'https://www.figma.com/api/mcp/asset/c447543e-ebb0-4455-8e3b-db2059b8a8ea',
  },
]

const reviews = [
  {
    text: "I booked a weekend in Rome for €29 last month. I had no idea prices like that existed. Flajko found it before I even thought to look.",
    name: 'Maja Kovač',
    role: 'Travel blogger',
    avatar: AVATAR_1,
  },
  {
    text: 'Week 3, I got Budapest for €15 return. Booked it in 5 minutes. Now I open Flajko emails before I even have my morning coffee.',
    name: 'Tomislav Babić',
    role: 'Student',
    avatar: AVATAR_2,
  },
  {
    text: 'Finally a newsletter that respects my time. Three deals. Every Thursday. No ads, no filler. Just flights I can actually afford.',
    name: 'Ana Perić',
    role: 'Software engineer',
    avatar: AVATAR_3,
  },
]

const steps = [
  {
    n: '1',
    title: 'Subscribe to Get Started',
    desc: 'Enter your email to get started. No account, no credit card, and no setup required.',
  },
  {
    n: '2',
    title: 'Get Your Deals',
    desc: 'Every Thursday morning, 3 hand-picked weekend flights from Zagreb land in your inbox.',
  },
  {
    n: '3',
    title: 'Book & Fly',
    desc: 'Click through to book directly with the airline. We never mark up prices. What you see is what you pay.',
  },
]

const NAV_LINKS = [
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Deals',        href: '#deals' },
  { label: 'Reviews',      href: '#reviews' },
]

// ── Shared subscribe form ─────────────────────────────────────────────────────
// Always vertical stack: input full-width, button full-width below.
// Wired to /api/subscribe — handles validation, success, and errors inline.
function SubscribeForm({
  dark = false,
  centered = false,
}: {
  dark?: boolean
  centered?: boolean
}) {
  const [email, setEmail]     = useState('')
  const [agreed, setAgreed]   = useState(false)
  const [status, setStatus]   = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setMessage('')

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, gdpr_consent: agreed }),
      })
      const data = await res.json()

      if (!res.ok) {
        setStatus('error')
        setMessage(data.error ?? 'Something went wrong. Please try again.')
        return
      }

      setStatus('success')
      setMessage("You're in! Check your inbox Thursday.")
      setEmail('')
      setAgreed(false)
    } catch {
      setStatus('error')
      setMessage('Something went wrong. Please try again.')
    }
  }

  if (status === 'success') {
    return (
      <p className={`text-sm font-semibold ${dark ? 'text-[#7dd3fc]' : 'text-[#0284c7]'}`}>
        {message}
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={`flex flex-col gap-2 w-full ${centered ? 'items-center' : 'items-start'}`}>
      {/* Input + Button: stacked on mobile, inline on desktop */}
      <div className="flex flex-col md:flex-row gap-2 w-full">
        <input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setMessage('') }}
          placeholder="your@email.com"
          required
          disabled={status === 'loading'}
          className={[
            'h-10 px-4 text-sm rounded-lg border outline-none transition-colors',
            'shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]',
            'w-full md:flex-1 md:max-w-[400px]',
            dark
              ? 'bg-transparent border-[#d1d5db] text-white placeholder-[#9ca3af] focus:border-[#0284c7]'
              : 'bg-white border-[#d1d5db] text-[#111827] placeholder-[#9ca3af] focus:border-[#0284c7]',
          ].join(' ')}
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="h-10 w-full md:w-auto md:shrink-0 px-5 bg-[#0284c7] text-white text-sm font-semibold rounded-md whitespace-nowrap hover:bg-[#0369a1] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284c7] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {status === 'loading' ? 'Subscribing…' : 'Subscribe'}
        </button>
      </div>

      {/* Inline error */}
      {status === 'error' && (
        <p className="text-xs text-red-400">{message}</p>
      )}

      {/* Checkbox + privacy */}
      <label className={`flex items-center gap-2 text-xs cursor-pointer mt-2 ${centered ? 'justify-center' : ''}`}>
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="w-4 h-4 rounded-[4px] border border-[#9ca3af] accent-[#0284c7] cursor-pointer shrink-0"
        />
        <span className={dark ? 'text-[#9ca3af]' : 'text-[#6b7280]'}>
          I agree to receive weekly flight deal emails. I can unsubscribe at any time.{' '}
          <Link href="/privacy" className="underline hover:text-[#0284c7] transition-colors">
            Privacy policy.
          </Link>
        </span>
      </label>
    </form>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-white font-[Inter,sans-serif]">

      {/* ─── MOBILE SIDEBAR ──────────────────────────────────────────────────
          Structural change: new full-screen overlay component.
          Slides in from left, fades in on open; reverses on close.
          Only visible on mobile — hidden on md+ via pointer-events and opacity.
      ──────────────────────────────────────────────────────────────────────── */}
      {/* Backdrop */}
      <div
        className={[
          'fixed inset-0 z-[55] bg-black/40 md:hidden',
          'transition-opacity duration-300',
          sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        ].join(' ')}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar panel — slides from left */}
      <div
        className={[
          'fixed inset-0 z-[60] flex flex-col bg-white md:hidden',
          'transition-transform duration-300 ease-in-out',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        {/* Sidebar top bar with close icon */}
        <div className="sticky top-0 h-[64.8px] flex items-center justify-end px-6 shrink-0">
          <button
            onClick={() => setSidebarOpen(false)}
            className="w-6 h-6 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284c7] rounded-full"
            aria-label="Close menu"
          >
            <img src={CLOSE_ICON} alt="" width={24} height={24} />
          </button>
        </div>

        {/* Nav links — centered, large text */}
        <div className="flex flex-col items-center justify-center gap-12 flex-1 px-6">
          {NAV_LINKS.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              onClick={() => setSidebarOpen(false)}
              className="text-xl font-normal text-[#6b7280] leading-8 hover:text-[#0284c7] transition-colors"
            >
              {label}
            </a>
          ))}
        </div>

        {/* CTA buttons at bottom */}
        <div className="flex flex-col gap-3 px-6 pb-6 shrink-0">
          <button className="w-full px-5 py-2.5 bg-[#0284c7] text-white text-base font-semibold rounded-md hover:bg-[#0369a1] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284c7] active:scale-[0.98]">
            Register
          </button>
          <button className="w-full px-5 py-2.5 text-[#111827] text-base font-semibold border border-[#0284c7] rounded-md hover:bg-[#f0f9ff] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284c7] active:scale-[0.98]">
            Log In
          </button>
        </div>
      </div>

      {/* ─── 1. NAV ─────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white border-b border-[#e5e7eb] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
        <div className="max-w-[1240px] mx-auto px-6 lg:px-0 h-16 flex items-center justify-between">
          {/* Logo — always visible */}
          <a href="#" className="shrink-0">
            <img src={LOGO_NAV} alt="Flajko" width={100} height={30} className="block" />
          </a>

          {/* Nav links — hidden on mobile, visible md+ */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                className="text-sm font-normal text-[#6b7280] hover:text-[#0284c7] transition-colors"
              >
                {label}
              </a>
            ))}
          </div>

          {/* Desktop: Log In + Register buttons — hidden on mobile */}
          <div className="hidden md:flex items-center gap-2">
            <button className="px-3 py-2 text-sm font-semibold text-[#1f2937] rounded-md hover:bg-[#f9fafb] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284c7] active:scale-[0.98]">
              Log In
            </button>
            <button className="px-3 py-2 text-sm font-semibold text-[#1f2937] border border-[#0284c7] rounded-md hover:bg-[#f0f9ff] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284c7] active:scale-[0.98]">
              Register
            </button>
          </div>

          {/* Mobile: hamburger icon — hidden on md+ */}
          {/* Structural change: new button for mobile nav trigger */}
          <button
            className="md:hidden w-6 h-6 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284c7] rounded"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
            aria-expanded={sidebarOpen}
          >
            <img src={HAMBURGER_ICON} alt="" width={24} height={24} />
          </button>
        </div>
      </nav>

      {/* ─── 2. HERO ────────────────────────────────────────────────────────── */}
      <section className="bg-white py-16 md:py-[160px] overflow-hidden">
        <div className="max-w-[1440px] mx-auto px-6 md:pl-[100px] md:pr-0 flex flex-col md:flex-row items-center justify-between gap-10 md:gap-12">
          {/* Left — full width on mobile */}
          <div className="flex flex-col gap-6 md:gap-8 w-full max-w-full md:max-w-[715px] shrink-0 pr-0 lg:pr-0">
            {/* Tag pill */}
            <div className="inline-flex items-center self-start px-3 py-[5px] bg-[#f0f9ff] border border-[#7dd3fc] rounded-full">
              <span className="text-xs font-semibold text-[#0284c7] leading-4 tracking-normal">
                ✈ EVERY THURSDAY · FREE NEWSLETTER
              </span>
            </div>

            {/* Heading + subheading */}
            <div className="flex flex-col gap-4">
              <h1 className="text-[48px] leading-[48px] md:text-[60px] md:leading-[60px] font-bold text-[#1f2937]">
                Cheapest Weekend<br />Flights from Zagreb
              </h1>
              <p className="text-base md:text-lg leading-6 md:leading-7 font-normal text-[#6b7280]">
                3 budget destinations land in your inbox every Thursday.<br className="hidden lg:block" />
                Hand-picked, genuinely cheap, ready to book.
              </p>
            </div>

            <SubscribeForm />

            {/* Mobile hero image — shown below form, hidden on desktop */}
            {/* Structural change: mobile-only image block */}
            <div className="md:hidden w-full h-[300px] rounded-xl overflow-hidden shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)]">
              <img
                src={HERO_MOBILE}
                alt="Weekend travel destinations"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          </div>

          {/* Right – 3-column image collage — desktop only */}
          <div className="hidden lg:flex items-center h-[600px] w-[605px] shrink-0 gap-[22.5px]">
            {/* Col 1: vertically centered, 300px tall */}
            <div className="flex items-center h-full">
              <div className="w-[220px] h-[300px] rounded-xl shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)] overflow-hidden shrink-0">
                <img src={HERO_1} alt="Travel" className="w-full h-full object-cover" loading="lazy" />
              </div>
            </div>
            {/* Col 2: full 600px */}
            <div className="flex items-center h-full">
              <div className="w-[220px] h-[600px] rounded-xl shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)] overflow-hidden shrink-0">
                <img src={HERO_2} alt="Travel" className="w-full h-full object-cover" loading="lazy" />
              </div>
            </div>
            {/* Col 3: two stacked images, left-rounded only */}
            <div className="flex flex-col justify-center gap-4 h-full">
              <div className="w-[120px] h-[220px] rounded-l-xl shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)] overflow-hidden shrink-0">
                <img src={HERO_3} alt="Travel" className="w-full h-full object-cover" loading="lazy" />
              </div>
              <div className="w-[120px] h-[220px] rounded-l-xl shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)] overflow-hidden shrink-0">
                <img src={HERO_4} alt="Travel" className="w-full h-full object-cover" loading="lazy" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 3. PARTNERS BAR ────────────────────────────────────────────────── */}
      <section className="bg-[#f9fafb] py-16 md:py-20">
        <div className="max-w-[1240px] mx-auto px-6 lg:px-0 flex flex-col gap-8 items-center">
          <p className="text-xs font-semibold text-[#9ca3af] leading-4 tracking-normal text-center">
            FLIGHT DATA POWERED BY
          </p>
          {/* Mobile: 2-row grid (Kiwi+Lastminute / Kayak+Google). Desktop: single row. */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-10">
            {/* Row 1 on mobile */}
            <div className="flex items-center justify-center gap-10">
              <img src={LOGO_KIWI}       alt="Kiwi.com"       width={64}  height={32} />
              <img src={LOGO_LASTMINUTE} alt="Lastminute.com" width={205} height={24} loading="lazy" />
            </div>
            {/* Row 2 on mobile */}
            <div className="flex items-center justify-center gap-10">
              <img src={LOGO_KAYAK}  alt="Kayak"         width={126} height={24} loading="lazy" />
              <img src={LOGO_GOOGLE} alt="Google Flights" width={148} height={24} loading="lazy" />
            </div>
          </div>
        </div>
      </section>

      {/* ─── 4. HOW IT WORKS ────────────────────────────────────────────────── */}
      <section id="how-it-works" className="bg-white py-16 md:py-[160px]">
        <div className="max-w-[1240px] mx-auto px-6 lg:px-0 flex flex-col gap-12 md:gap-28">

          {/* Heading + steps */}
          <div className="flex flex-col gap-10 md:gap-16">
            <div className="flex flex-col gap-3">
              <span className="text-xs font-semibold text-[#0284c7] leading-4">HOW IT WORKS</span>
              <h2 className="text-[36px] leading-[48px] md:text-[48px] md:leading-[48px] font-bold text-[#1f2937]">It&apos;s This Easy</h2>
            </div>

            {/* Steps: single column on mobile, 3 columns on md+ */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {steps.map(({ n, title, desc }) => (
                <div key={n} className="flex flex-col gap-4">
                  {/* Numbered badge */}
                  <div className="w-14 h-14 rounded-full border border-[#7dd3fc] flex items-center justify-center shrink-0">
                    <div className="w-8 h-8 rounded-full bg-[#0284c7] flex items-center justify-center">
                      <span className="text-xl font-bold text-white leading-8">{n}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <h3 className="text-xl font-bold text-[#1f2937] leading-8">{title}</h3>
                    <p className="text-sm font-normal text-[#6b7280] leading-5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Flow diagram — conditional mobile vs desktop illustration */}
          {/* Structural change: two sibling divs with conditional visibility */}
          <div className="hidden md:block w-full h-[337px] rounded-2xl overflow-hidden">
            <img
              src={VISUAL_FLOW}
              alt="Subscribe → Get deal email → Airplane → Book"
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
          <div className="block md:hidden w-full rounded-2xl overflow-hidden">
            <img
              src={VISUAL_FLOW_MOBILE}
              alt="Subscribe → Get deal email → Airplane → Book"
              className="w-full h-auto object-cover"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* ─── 5. LATEST DEALS ────────────────────────────────────────────────── */}
      <section id="deals" className="bg-[#f9fafb] py-16 md:py-[160px]">
        <div className="max-w-[1240px] mx-auto px-6 lg:px-0 flex flex-col gap-6 md:gap-12">

          {/* Header */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-semibold text-[#0284c7] leading-4">THIS WEEK</span>
            <h2 className="text-[36px] leading-[48px] md:text-[48px] md:leading-[48px] font-bold text-[#1f2937]">Latest Deals</h2>
            <p className="text-sm font-normal text-[#6b7280] leading-5">
              Round-trip from Zagreb. Updated every Thursday morning.
            </p>
          </div>

          {/* Deal cards: 2×2 grid on desktop, single column on mobile */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {deals.map((deal) => (
              <div
                key={deal.city}
                className="bg-white border border-[#d1d5db] rounded-2xl p-5 flex flex-col md:flex-row gap-5 items-start"
              >
                {/* Destination image — full width on mobile, fixed size on desktop */}
                {/* Structural change: w-full on mobile → w-[218px] on md+ */}
                <div className="w-full h-[226px] md:w-[218px] md:h-[226px] md:shrink-0 rounded-lg overflow-hidden">
                  <img
                    src={deal.image}
                    alt={deal.city}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>

                {/* Card content */}
                <div className="flex flex-col justify-between flex-1 self-stretch min-w-0 w-full">
                  <div className="flex flex-col gap-5">
                    {/* City + price */}
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-xl font-bold text-[#1f2937] leading-8">{deal.city}</h3>
                        <span className="text-2xl font-bold text-[#0284c7] leading-9 whitespace-nowrap">
                          {deal.price}
                        </span>
                      </div>
                      <p className="text-sm font-normal text-[#6b7280] leading-5">{deal.blurb}</p>
                    </div>

                    {/* Meta rows */}
                    <div className="flex flex-col gap-3">
                      {[
                        { icon: ICON_AIRPLANE, text: deal.dates },
                        { icon: ICON_BED,      text: deal.hotel },
                        { icon: ICON_CLOCK,    text: deal.observed },
                      ].map(({ icon, text }) => (
                        <div key={text} className="flex items-center gap-2">
                          <img src={icon} alt="" width={12} height={12} className="shrink-0" />
                          <span className="text-xs font-semibold text-[#6b7280] leading-4">{text}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* View button */}
                  <div className="flex justify-end mt-3">
                    <button className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-[#0284c7] rounded-md hover:bg-[#f0f9ff] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284c7] active:scale-[0.98]">
                      View
                      <img src={ICON_ARROW} alt="" width={16} height={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Below-grid CTA */}
          <div className="flex flex-col items-center gap-4 pt-4">
            <p className="text-sm font-normal text-[#6b7280] leading-5 text-center">
              Want deals like these in your inbox every Thursday?
            </p>
            <button className="flex items-center gap-2 px-5 py-2.5 bg-[#0284c7] text-white text-sm font-semibold rounded-md hover:bg-[#0369a1] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284c7] active:scale-[0.98]">
              Subscribe for Free
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path d="M3.75 9H14.25M14.25 9L9.75 4.5M14.25 9L9.75 13.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* ─── 6. REVIEWS ─────────────────────────────────────────────────────── */}
      <section id="reviews" className="bg-white py-16 md:py-[160px]">
        <div className="max-w-[1240px] mx-auto px-6 lg:px-0 flex flex-col gap-6 md:gap-12">

          <div className="flex flex-col gap-3">
            <span className="text-xs font-semibold text-[#0284c7] leading-4">WHAT SUBSCRIBERS SAY</span>
            <h2 className="text-[36px] leading-[48px] md:text-[48px] md:leading-[48px] font-bold text-[#1f2937]">They Booked. You Can Too.</h2>
          </div>

          {/* Single column on mobile, 3 columns on md+ */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {reviews.map((r) => (
              <div
                key={r.name}
                className="bg-[#f9fafb] border border-[#d1d5db] rounded-2xl p-6 flex flex-col gap-4"
              >
                <img src={ICON_QUOTES} alt="" width={24} height={24} />
                <p className="text-sm font-normal text-[#1f2937] leading-5 flex-1">{r.text}</p>
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full overflow-hidden shrink-0">
                    <img src={r.avatar} alt={r.name} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-semibold text-[#1f2937] leading-5">{r.name}</span>
                    <span className="text-xs font-normal text-[#9ca3af] leading-4">{r.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 7. FINAL CTA ───────────────────────────────────────────────────── */}
      <section className="bg-[#111827] py-16 md:py-[160px]">
        <div className="max-w-[1240px] mx-auto px-6 lg:px-0 flex flex-col gap-8 items-center">

          {/* Tag pill */}
          <div className="inline-flex items-center px-[12.8px] py-[4.8px] bg-[rgba(49,116,224,0.1)] border border-[#0369a1] rounded-full">
            <span className="text-xs font-semibold text-[#0284c7] leading-4 tracking-[0.3px] uppercase">
              ✈ Free · No spam · Unsubscribe anytime
            </span>
          </div>

          {/* Heading + sub */}
          <div className="flex flex-col gap-4 items-center max-w-[672px] text-center">
            <h2 className="text-[36px] leading-[48px] md:text-[48px] md:leading-[48px] font-bold text-white">
              Your Next Weekend Trip Starts With One Email
            </h2>
            <p className="text-base md:text-lg font-normal text-[#9ca3af] leading-6 md:leading-7">
              3 budget destinations land in your inbox every Thursday.<br />
              Hand-picked, genuinely cheap, ready to book.
            </p>
          </div>

          <SubscribeForm dark centered />
        </div>
      </section>

      {/* ─── 8. FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="bg-[#111827] border-t border-[#0c4a6e] py-8">
        {/* Mobile: stacked, centered. Desktop: row, space-between. */}
        <div className="max-w-[1240px] mx-auto px-6 lg:px-0 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <img src={LOGO_FOOTER} alt="Flajko" width={100} height={30} />

          <p className="text-xs font-normal text-[#9ca3af] leading-4">
            © 2026 Flajko. All rights reserved.
          </p>

          <div className="flex items-center gap-5">
            <Link href="/privacy" className="text-xs font-normal text-[#9ca3af] leading-4 hover:text-white transition-colors">
              Privacy policy
            </Link>
            <a href="#" className="text-xs font-normal text-[#9ca3af] leading-4 hover:text-white transition-colors">
              Terms of Use
            </a>
          </div>
        </div>
      </footer>

    </div>
  )
}
