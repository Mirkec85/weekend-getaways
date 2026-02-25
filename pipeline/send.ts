/**
 * Weekend Getaways — weekly email send
 *
 * Reads cached deals for the current week, renders the WeeklyDeals email
 * template, and batch-delivers to all active subscribers via Resend.
 *
 * Run manually: npx ts-node --project pipeline/tsconfig.json pipeline/send.ts
 */
import * as fs from 'fs'
import * as path from 'path'

// ── Load .env.local BEFORE requiring pipeline modules ──────────────────────
// lib/db.ts creates the Supabase client at require() time using process.env
// vars. Env must be set before that require() runs.
// Using inline module-level code (not import declarations) so TypeScript
// cannot hoist this above the env loading step.
const envPath = path.resolve(__dirname, '../.env.local')
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const match = line.match(/^([^#=\s]+)\s*=\s*(.*)$/)
    if (match) process.env[match[1]] = match[2].trim()
  }
}

// ── Pipeline modules (required after env is loaded) ─────────────────────────
// require() calls are NOT hoisted by TypeScript — unlike import declarations.
// This guarantees process.env is populated before lib/db.ts creates the
// Supabase client.
/* eslint-disable @typescript-eslint/no-require-imports */
const { weekKey } = require('./cache') as typeof import('./cache')
const { supabase } = require('../lib/db') as typeof import('../lib/db')
/* eslint-enable @typescript-eslint/no-require-imports */

// ── Non-env-dependent imports ────────────────────────────────────────────────
// These packages do NOT read process.env at module load time, so it is safe
// for TypeScript to hoist them above the env-loading block above.
// CRITICAL: render and toPlainText must come from @react-email/components —
// @react-email/render is only a nested dep, not installed at the top level.
import { render, toPlainText } from '@react-email/components'
import React from 'react'
import WeeklyDeals from './emails/WeeklyDeals'
import type { DealCard } from './emails/WeeklyDeals'
import { Resend } from 'resend'
import { format } from 'date-fns'

// ── Helper functions ─────────────────────────────────────────────────────────

/**
 * Appends UTM tracking parameters to a Kiwi deep-link URL.
 * Uses URL API (not string concatenation) because Kiwi URLs already have
 * query params and naive concatenation would produce double `?` characters.
 */
function addUtmParams(url: string, destination: string): string {
  const u = new URL(url)
  u.searchParams.set('utm_source', 'weekend-getaways')
  u.searchParams.set('utm_medium', 'email')
  u.searchParams.set('utm_campaign', `weekly-${weekKey()}`)
  u.searchParams.set('utm_content', destination.toLowerCase().replace(/\s+/g, '-'))
  return u.toString()
}

/**
 * Converts an ISO timestamp to CET (UTC+1) and formats as "EEE dd MMM HH:mm CET".
 * Example output: "Thu 19 Feb 08:12 CET"
 * Matches EMAIL-02 requirement.
 */
function formatObservedCET(observed_at: string): string {
  const utcMs = new Date(observed_at).getTime()
  const cetDate = new Date(utcMs + 3_600_000) // CET = UTC+1
  return format(cetDate, 'EEE dd MMM HH:mm') + ' CET'
}

/**
 * Formats a depart_at or return_at ISO string as "EEE dd MMM".
 * Example output: "Fri 21 Feb"
 */
function formatDateLabel(isoDate: string): string {
  return format(new Date(isoDate), 'EEE dd MMM')
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // ── Step 1: Validate env ───────────────────────────────────────────────────
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not set — add it to .env.local or set as environment variable')
  }
  const fromAddress = process.env.RESEND_FROM_ADDRESS || 'onboarding@resend.dev'
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://your-domain.vercel.app'
  const resend = new Resend(process.env.RESEND_API_KEY)

  // ── Step 2: Load deals from deals_cache ───────────────────────────────────
  const key = weekKey()
  console.log(`Send script running for week: ${key}`)

  const { data: deals, error: dealsErr } = await supabase
    .from('deals_cache')
    .select('*')
    .eq('week_key', key)
    .order('rank', { ascending: true })

  if (dealsErr) throw dealsErr

  if (!deals || deals.length === 0) {
    console.log(`No deals cached for ${key}. Run pipeline/index.ts first.`)
    process.exit(1)
  }

  // ── Step 3: Load blurbs ───────────────────────────────────────────────────
  /* eslint-disable @typescript-eslint/no-require-imports */
  const blurbs: Record<string, string> = require('../data/blurbs.json')
  /* eslint-enable @typescript-eslint/no-require-imports */

  // ── Step 4: Build DealCard[] from deals_cache rows ────────────────────────
  const dealCards: DealCard[] = deals.map((deal: {
    destination_name: string
    flight_price: number
    depart_at: string
    return_at: string
    destination_iata: string
    hotel_estimate: number | null
    observed_at: string
    booking_url: string
  }) => ({
    destinationName: deal.destination_name,
    flightPriceEur: deal.flight_price,
    departLabel: formatDateLabel(deal.depart_at),
    returnLabel: formatDateLabel(deal.return_at),
    blurb: blurbs[deal.destination_iata] ?? 'A perfect weekend escape from Zagreb.',
    hotelEstimateEur: deal.hotel_estimate ?? 80,
    observedLabel: formatObservedCET(deal.observed_at),
    bookingUrl: addUtmParams(deal.booking_url, deal.destination_name),
  }))

  // ── Step 5: Build weekLabel ───────────────────────────────────────────────
  const firstDepart = new Date(deals[0].depart_at)
  const lastReturn = new Date(deals[deals.length - 1].return_at)
  const weekLabel = `Weekend of ${format(firstDepart, 'dd')}-${format(lastReturn, 'dd')} ${format(firstDepart, 'MMM yyyy')}`

  // ── Step 6: Fetch active subscribers ─────────────────────────────────────
  const { data: subscribers, error: subErr } = await supabase
    .from('subscribers')
    .select('id, email, unsubscribe_token')
    .eq('status', 'active')

  if (subErr) throw subErr

  if (!subscribers || subscribers.length === 0) {
    console.log('No active subscribers found.')
    return
  }

  // ── Step 7: Filter already-sent (send_log pre-check) ─────────────────────
  const { data: alreadySent } = await supabase
    .from('send_log')
    .select('subscriber_id')
    .eq('week_key', key)

  const sentIds = new Set((alreadySent ?? []).map((r: { subscriber_id: number }) => r.subscriber_id))
  const pending = subscribers.filter((s: { id: number }) => !sentIds.has(s.id))

  if (pending.length === 0) {
    console.log('All subscribers already received this week.')
    return
  }

  console.log(`Sending to ${pending.length} subscriber(s) (${subscribers.length - pending.length} already sent)...`)

  // ── Step 8: Batch send via Resend (max 100 per call) ─────────────────────
  // HTML/text are re-rendered per subscriber so each gets their personalised
  // unsubscribeUrl in the email footer.
  const BATCH_SIZE = 100
  const subject = `Weekend deals - ${weekLabel}`

  for (let i = 0; i < pending.length; i += BATCH_SIZE) {
    const chunk = pending.slice(i, i + BATCH_SIZE)

    // Build per-subscriber email payloads
    const batchPayload = await Promise.all(chunk.map(async (sub: { id: number; email: string; unsubscribe_token: string }) => {
      const unsubscribeUrl = `${baseUrl}/api/unsubscribe?token=${sub.unsubscribe_token}`
      const html = await render(
        React.createElement(WeeklyDeals, { deals: dealCards, weekLabel, unsubscribeUrl })
      )
      const text = toPlainText(html)
      return {
        from: `Weekend Getaways <${fromAddress}>`,
        to: sub.email,
        subject,
        html,
        text,
      }
    }))

    const idempotencyKey = `weekly-send/${key}/batch-${Math.floor(i / BATCH_SIZE)}`
    const { data: batchData, error: sendErr } = await resend.batch.send(batchPayload, { idempotencyKey })

    if (sendErr) {
      // Log failures to send_log for operator visibility, then rethrow
      await supabase.from('send_log').upsert(
        chunk.map((sub: { id: number }) => ({
          subscriber_id: sub.id,
          week_key: key,
          status: 'failed',
          provider_message_id: null,
        })),
        { onConflict: 'subscriber_id,week_key', ignoreDuplicates: true }
      )
      throw sendErr
    }

    // ── Step 9: Upsert send_log (idempotent) ────────────────────────────────
    // upsert() with ignoreDuplicates prevents failures on retry.
    const ids = batchData?.data ?? []
    await supabase.from('send_log').upsert(
      chunk.map((sub: { id: number }, idx: number) => ({
        subscriber_id: sub.id,
        week_key: key,
        status: 'sent',
        provider_message_id: (ids[idx] as { id?: string } | undefined)?.id ?? null,
      })),
      { onConflict: 'subscriber_id,week_key', ignoreDuplicates: true }
    )

    console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: sent ${chunk.length} email(s).`)
  }

  // ── Step 10: Summary ─────────────────────────────────────────────────────
  console.log(`Sent ${pending.length} email(s) for ${key}.`)
}

main().catch((err) => {
  console.error('Send failed:', err)
  process.exit(1)
})
