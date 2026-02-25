# Phase 4: Email Assembly - Research

**Researched:** 2026-02-25
**Domain:** React Email + Resend SDK (HTML email assembly, batch send, idempotency, mobile layout)
**Confidence:** HIGH

---

## Summary

Phase 4 assembles the pipeline into a complete email delivery system: read cached deals from Supabase, render a React Email template, and send to all active subscribers via Resend. The technology stack is already installed and pinned (`resend@6.9.2`, `@react-email/components@1.0.8`, `react-email@5.2.8`). No new dependencies are needed unless `date-fns-tz` is added for explicit CET timezone labelling (it is not installed; see Open Questions).

The critical architectural decision is **where the email template file lives**. React Email `.tsx` components need JSX transpilation. The pipeline `tsconfig.json` extends the root `tsconfig.json` which already has `"jsx": "react-jsx"`, so `.tsx` files compiled under `pipeline/tsconfig.json` will emit valid JSX. The send script (`pipeline/send.ts`) should live alongside `pipeline/index.ts` and use the same `require()` pattern for env loading. The email template file (`pipeline/emails/WeeklyDeals.tsx`) can be imported with a normal TypeScript import because it contains JSX.

The idempotency model is **layered**: Resend batch idempotency key (24-hour window, covers provider-level deduplication) + Supabase `send_log` table (`UNIQUE(subscriber_id, week_key)` — already in schema). The send script inserts into `send_log` before calling Resend; a constraint violation on retry means "already sent". Plain-text fallback is handled **automatically** by Resend as of August 2025 (converts HTML to text if `text` is omitted), but the success criteria say "plain-text fallback is present in the raw MIME structure" — the safest approach is to generate it explicitly using `toPlainText()` from `@react-email/render`.

**Primary recommendation:** Build `pipeline/emails/WeeklyDeals.tsx` (React Email component) + `pipeline/send.ts` (orchestrator script). Pre-render HTML and plain text with `render()` + `toPlainText()`, then call `resend.batch.send()` with up to 100 subscribers per call, guarded by a `send_log` pre-check per subscriber.

---

## Standard Stack

### Core (already installed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@react-email/components` | 1.0.8 | HTML email component primitives | Official React Email kit; includes all layout components needed |
| `@react-email/render` | 2.0.4 (transitive via components) | Render React → HTML string + plain text | Only officially-supported renderer for react-email components |
| `resend` | 6.9.2 | Email delivery via Resend API | Already wired (Phase 1), TypeScript types bundled |
| `@supabase/supabase-js` | 2.97.0 | Query subscribers, insert send_log | Already used in pipeline |
| `date-fns` | 4.1.0 | Format `depart_at`, `return_at`, `observed_at` for display | Already used in pipeline |

### Supporting (already installed)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `react` | 19.2.3 | JSX runtime for email components | Required by @react-email/components |
| `react-email` | 5.2.8 | Dev server for previewing email templates locally | Development only — `npx react-email dev` in email folder |
| `ts-node` | ^10.9.2 | Run .ts/.tsx files directly | Send script execution: `npx ts-node --project pipeline/tsconfig.json pipeline/send.ts` |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `resend.batch.send()` | `resend.emails.send()` in a loop | Batch is 1 API call per 100 emails; loop is N calls. Batch preferred for < 100 subscribers. |
| `toPlainText()` explicit | Resend's automatic plain text | Automatic plain text (Aug 2025) is convenient but the success criteria require the fallback to be verifiable in MIME — explicit `text:` param guarantees it regardless of Resend feature rollout to batch endpoint. |
| static `data/blurbs.json` map | DB column `trip_blurb` | `trip_blurb` column already exists in `deals_cache` schema but will be NULL for this phase. Static JSON map (IATA → blurb) is the scoped solution for Phase 4. |

### Installation

No new packages required. All dependencies are already in `package.json`.

---

## Architecture Patterns

### Recommended Project Structure

```
pipeline/
├── emails/
│   └── WeeklyDeals.tsx      # React Email template component
├── send.ts                   # Send script (mirrors index.ts pattern)
├── cache.ts                  # (existing) weekKey, hasCachedDeals
├── enricher.ts               # (existing) EnrichedDeal type
├── fetcher.ts                # (existing)
├── index.ts                  # (existing) pipeline orchestrator
├── selector.ts               # (existing)
└── tsconfig.json             # (existing) CommonJS, extends root

data/
├── hotel-estimates.json      # (existing)
└── blurbs.json               # NEW: IATA → 1-sentence trip blurb
```

### Pattern 1: Send Script Structure (mirrors pipeline/index.ts)

**What:** The send script loads env vars first using inline code, then requires pipeline modules, then runs main().
**When to use:** Always — this is the established pattern in this project to avoid Supabase client init before env is ready.

```typescript
// pipeline/send.ts
// Source: mirrors pipeline/index.ts pattern (Phase 3 Plan 03 decision)
import * as fs from 'fs'
import * as path from 'path'

// ── Load .env.local BEFORE requiring pipeline modules ──────────────────────
const envPath = path.resolve(__dirname, '../.env.local')
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const match = line.match(/^([^#=\s]+)\s*=\s*(.*)$/)
    if (match) process.env[match[1]] = match[2].trim()
  }
}

// ── Pipeline modules (required after env is loaded) ─────────────────────────
/* eslint-disable @typescript-eslint/no-require-imports */
const { weekKey } = require('./cache') as typeof import('./cache')
/* eslint-enable @typescript-eslint/no-require-imports */

// React Email imports are normal ES-style imports in .tsx files, but
// in .ts files use React.createElement or import from .tsx module.
// Best approach: put all JSX in WeeklyDeals.tsx, import it here.
import { sendWeeklyDeals } from './emailer'

async function main() {
  // ...
}

main().catch((err) => {
  console.error('Send failed:', err)
  process.exit(1)
})
```

### Pattern 2: React Email Template Component

**What:** A `.tsx` file exporting a React component that renders the full email.
**When to use:** All JSX must live in `.tsx` files so the pipeline tsconfig (which inherits `"jsx": "react-jsx"` from root) can transpile it.

```tsx
// pipeline/emails/WeeklyDeals.tsx
// Source: @react-email/components v1.0.8 (installed)
import {
  Html, Head, Body, Preview, Container,
  Section, Row, Column, Text, Heading, Hr, Link, Img
} from '@react-email/components'

// ── Types ────────────────────────────────────────────────────────────────────
// Import from pipeline/cache which re-exports from enricher
import type { EnrichedDeal } from '../enricher'

interface WeeklyDealsProps {
  deals: DealWithMeta[]
  weekLabel: string     // e.g. "Weekend of 21–23 Feb 2026"
}

interface DealWithMeta extends EnrichedDeal {
  blurb: string
  bookingUrlWithUtm: string
  observedLabel: string   // e.g. "Thu 19 Feb 08:12 CET"
  departLabel: string     // e.g. "Fri 21 Feb"
  returnLabel: string     // e.g. "Sun 23 Feb"
  flightPrice: number     // same as price_eur, renamed for template clarity
  hotelEstimate: number   // same as hotel_estimate_eur ?? 80
}

export default function WeeklyDeals({ deals, weekLabel }: WeeklyDealsProps) {
  return (
    <Html>
      <Head />
      <Preview>Weekend deals from Zagreb — from €{deals[0]?.flightPrice}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          {/* Header */}
          <Section>
            <Heading as="h1" style={headingStyle}>
              Weekend Getaways ✈️
            </Heading>
            <Text style={subheadStyle}>{weekLabel}</Text>
          </Section>
          <Hr />
          {/* Deal Cards — single column, stacks naturally on mobile */}
          {deals.map((deal, i) => (
            <Section key={i} style={cardStyle}>
              <Heading as="h2" style={destinationStyle}>
                {deal.destination_name}
              </Heading>
              <Text style={priceStyle}>Flight from €{deal.flightPrice}</Text>
              <Text style={metaStyle}>
                {deal.departLabel} → {deal.returnLabel}
              </Text>
              <Text style={blurbStyle}>{deal.blurb}</Text>
              <Text style={metaStyle}>
                Hotel est. ~€{deal.hotelEstimate}/night
              </Text>
              <Text style={observedStyle}>
                Observed: {deal.observedLabel}
              </Text>
              <Link href={deal.bookingUrlWithUtm} style={ctaStyle}>
                Book now →
              </Link>
            </Section>
          ))}
          <Hr />
          {/* Footer */}
          <Text style={footerStyle}>
            You're receiving this because you subscribed to Weekend Getaways.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

// ── Inline styles (required for email clients — no external CSS) ──────────
const bodyStyle = { backgroundColor: '#f6f9fc', fontFamily: 'sans-serif' }
const containerStyle = { maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff', padding: '24px' }
const headingStyle = { fontSize: '24px', color: '#1a1a1a' }
const subheadStyle = { fontSize: '14px', color: '#666666' }
const cardStyle = { marginBottom: '24px', padding: '16px', borderRadius: '8px', backgroundColor: '#f8f8f8' }
const destinationStyle = { fontSize: '20px', color: '#1a1a1a', margin: '0 0 8px 0' }
const priceStyle = { fontSize: '24px', fontWeight: 'bold', color: '#0070f3', margin: '0 0 8px 0' }
const metaStyle = { fontSize: '14px', color: '#444444', margin: '0 0 4px 0' }
const blurbStyle = { fontSize: '14px', color: '#333333', margin: '8px 0' }
const observedStyle = { fontSize: '12px', color: '#999999', margin: '4px 0' }
const ctaStyle = { display: 'inline-block', backgroundColor: '#0070f3', color: '#ffffff', padding: '12px 24px', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold' }
const footerStyle = { fontSize: '12px', color: '#999999', textAlign: 'center' as const }
```

### Pattern 3: Render HTML + Plain Text

**What:** Pre-render the React component to HTML and plain text strings before passing to Resend.
**When to use:** Always pre-render. Passing `react:` prop directly to Resend also works but pre-rendering gives you the `text:` field for explicit MIME plain-text attachment, which the success criteria require.

```typescript
// Source: @react-email/render v2.0.4 installed API (verified from node_modules types)
// render() is async. toPlainText() is synchronous and takes an HTML string.
import { render, toPlainText } from '@react-email/render'
import WeeklyDeals from './emails/WeeklyDeals'
import React from 'react'

const html = await render(React.createElement(WeeklyDeals, props))
const text = toPlainText(html)
```

**Note on JSX in .ts vs .tsx:** In `.ts` files (non-JSX), use `React.createElement(Component, props)`. In `.tsx` files, use `<Component {...props} />`. The email template lives in a `.tsx` file and is imported into the `.ts` send script.

### Pattern 4: Batch Send with Idempotency + send_log Guard

**What:** Two-layer duplicate prevention: (1) check `send_log` before building batch, (2) use Resend idempotency key for the batch call.
**When to use:** Always — weekly cron jobs can re-trigger if Actions fails and retries.

```typescript
// Source: resend v6.9.2 SDK types (verified from node_modules)
import { Resend } from 'resend'
import { supabase } from '../lib/db'

const resend = new Resend(process.env.RESEND_API_KEY)

// 1. Fetch active subscribers
const { data: subscribers, error: subErr } = await supabase
  .from('subscribers')
  .select('id, email')
  .eq('status', 'active')

if (subErr) throw subErr
if (!subscribers?.length) { console.log('No active subscribers.'); return }

const key = weekKey()

// 2. Filter out already-sent subscribers (send_log pre-check)
const { data: alreadySent } = await supabase
  .from('send_log')
  .select('subscriber_id')
  .eq('week_key', key)

const sentIds = new Set((alreadySent ?? []).map(r => r.subscriber_id))
const pending = subscribers.filter(s => !sentIds.has(s.id))

if (!pending.length) { console.log('All subscribers already received this week.'); return }

// 3. Build email payload (render once, reuse HTML/text for all subscribers)
const html = await render(React.createElement(WeeklyDeals, emailProps))
const text = toPlainText(html)

// 4. Batch send (max 100 per call — Resend limit)
const BATCH_SIZE = 100
for (let i = 0; i < pending.length; i += BATCH_SIZE) {
  const chunk = pending.slice(i, i + BATCH_SIZE)

  const batchPayload = chunk.map(sub => ({
    from: 'Weekend Getaways <noreply@yourdomain.com>',
    to: sub.email,
    subject: `Weekend deals — ${emailProps.weekLabel}`,
    html,
    text,
  }))

  // Idempotency key scoped to the week + batch index (24-hour window)
  const idempotencyKey = `weekly-send/${key}/batch-${Math.floor(i / BATCH_SIZE)}`

  const { data: batchData, error: sendErr } = await resend.batch.send(
    batchPayload,
    { idempotencyKey }
  )

  if (sendErr) {
    console.error('Batch send error:', sendErr)
    // Log failures to send_log with status 'failed'
    await supabase.from('send_log').insert(
      chunk.map(sub => ({
        subscriber_id: sub.id,
        week_key: key,
        status: 'failed',
      }))
    )
    throw sendErr
  }

  // 5. Insert send_log rows for idempotency on future retries
  const ids = batchData?.data ?? []
  await supabase.from('send_log').insert(
    chunk.map((sub, idx) => ({
      subscriber_id: sub.id,
      week_key: key,
      status: 'sent',
      provider_message_id: ids[idx]?.id ?? null,
    }))
  )
}
```

### Pattern 5: Load Deals from deals_cache

**What:** Query the `deals_cache` table for the current week, ordered by rank.
**When to use:** Send script reads from cache; never re-fetches from Tequila API.

```typescript
// Source: @supabase/supabase-js v2 (existing pattern in cache.ts)
const key = weekKey()

const { data: deals, error } = await supabase
  .from('deals_cache')
  .select('*')
  .eq('week_key', key)
  .order('rank', { ascending: true })

if (error) throw error
if (!deals?.length) {
  console.log(`No deals cached for ${key}. Run pipeline/index.ts first.`)
  process.exit(1)
}
```

### Pattern 6: UTM Parameter Construction

**What:** Append standard UTM parameters to each deal's `booking_url`.
**When to use:** Always — success criteria require UTM on every booking link.

```typescript
// Standard email UTM pattern
function addUtmParams(url: string, destination: string): string {
  const u = new URL(url)
  u.searchParams.set('utm_source', 'weekend-getaways')
  u.searchParams.set('utm_medium', 'email')
  u.searchParams.set('utm_campaign', `weekly-${weekKey()}`)
  u.searchParams.set('utm_content', destination.toLowerCase().replace(/\s+/g, '-'))
  return u.toString()
}
```

**Note:** `booking_url` from Kiwi Tequila is a full URL (`deep_link`). `new URL()` is safe here. Some Kiwi deep_link URLs may already contain query params — `searchParams.set()` handles this without duplication.

### Pattern 7: observed_at Formatting

**What:** Format the `observed_at` timestamp from `deals_cache` as "Thu 19 Feb 08:12 CET".
**When to use:** Each deal card shows freshness of the price data.

```typescript
// Source: date-fns v4.1.0 (installed)
// date-fns-tz is NOT installed. Use UTC+1 offset approximation for CET,
// or simply append 'CET' label after formatting in local process time.
// The pipeline runs on GitHub Actions — timezone may be UTC.
// Safest: format as UTC and append static "UTC" label, or format and append "CET"
// if you know the pipeline always runs in CET context.
import { format } from 'date-fns'

// Option A: format as-is, rely on server locale (fragile on CI)
const label = format(new Date(deal.observed_at), "EEE dd MMM HH:mm") + ' CET'

// Option B: parse UTC, add 1 hour offset manually for CET (winter), or 2 for CEST
// This is the safe approach for CI without date-fns-tz
const utcDate = new Date(deal.observed_at)
const cetDate = new Date(utcDate.getTime() + 1 * 60 * 60 * 1000) // CET = UTC+1
const label2 = format(cetDate, "EEE dd MMM HH:mm") + ' CET'
```

**See Open Questions #1 for timezone handling recommendation.**

### Anti-Patterns to Avoid

- **JSX in .ts files:** Never write `<Component />` syntax in a `.ts` file. The pipeline tsconfig handles `.tsx`, not `.ts` for JSX. Use `.tsx` for email template, `React.createElement()` in `.ts` files.
- **Sending `react:` prop directly (without pre-rendering):** Works, but you lose the ability to set explicit `text:` field for plain-text MIME. Pre-render with `render()` + `toPlainText()` and pass both `html:` and `text:`.
- **Skipping send_log pre-check:** Resend idempotency keys expire in 24 hours. On the next week's run, the same key isn't used (different `week_key`). Only `send_log` prevents re-sends if the script is re-run within the same week.
- **Passing `react:` as JSX to `resend.batch.send()`:** The batch payload is a plain array of objects — you cannot pass JSX directly. Pre-render to HTML string first.
- **Using `import` declaration syntax at the top of send.ts for pipeline modules:** Breaks the env-loading guarantee (TypeScript hoists `import` statements). Use `require()` for pipeline modules that depend on env vars. The email template and React Email utilities can use normal `import` since they don't access env at module load time.
- **Using `@/` path aliases:** Not available in pipeline context (Phase 3 decision). Use relative imports only: `'../lib/db'`, `'./cache'`, etc.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HTML email rendering | Custom JSX → HTML string converter | `render()` from `@react-email/render` | Handles DOCTYPE, head structure, inline style validation, React 19 compatibility |
| Plain text extraction | HTML parser + regex stripping | `toPlainText()` from `@react-email/render` | Uses html-to-text under the hood; handles tables, lists, link labels correctly |
| Email client compatibility | Hand-written table HTML | `@react-email/components` (Html, Container, Section, Row, Column) | Components output battle-tested table-based HTML that works in Outlook, Gmail, iOS Mail |
| Mobile responsive email | Custom media query CSS | Single-column layout with `maxWidth: 600px` on Container | Gmail strips `<style>` tags and media queries. Single column is the only fully safe approach. |
| Batch chunking | Custom slice/loop logic | Simple `for` loop with `BATCH_SIZE = 100` — trivial; don't add lodash |  |

**Key insight:** Email client HTML is a different target than browser HTML. React Email's components generate table-based layouts because Outlook (and many mobile clients) ignore flexbox and grid entirely.

---

## Common Pitfalls

### Pitfall 1: Gmail strips `<style>` blocks and class-based CSS

**What goes wrong:** CSS classes or `<style>` blocks in email HTML are stripped by Gmail. Only inline styles survive.
**Why it happens:** Gmail's security policy.
**How to avoid:** All styles in React Email must be passed as `style={{ ... }}` props (inline style objects). Never use className or external CSS. `@react-email/tailwind` works but compiles to inline styles at render time.
**Warning signs:** Email looks fine in Resend preview but renders unstyled in Gmail.

### Pitfall 2: Kiwi deep_link URLs may have existing query parameters

**What goes wrong:** Using string concatenation to add UTM params breaks URLs that already have `?` characters (e.g., Kiwi URLs already contain `affilid=` or other params).
**Why it happens:** Tequila `deep_link` includes URL parameters.
**How to avoid:** Always use `new URL(url)` + `searchParams.set()` to append UTM params. Never use string concatenation.
**Warning signs:** Double `?` in URLs, e.g. `https://...?affilid=xyz?utm_source=...`

### Pitfall 3: TypeScript hoisting of import declarations in send.ts

**What goes wrong:** If you write `import { weekKey } from './cache'` at the top of `send.ts`, TypeScript emits it before the env-loading code block, causing `lib/db.ts` to throw "Missing env var: SUPABASE_URL".
**Why it happens:** ES import declarations are hoisted to the top of the compiled output.
**How to avoid:** Use `require()` for any pipeline modules that transitively use `lib/db.ts`. Follow the exact pattern in `pipeline/index.ts` (Phase 3 Plan 03 decision). React Email utilities (`@react-email/render`, React) do not use env vars, so they can be `import`ed normally at the top.
**Warning signs:** `Error: Missing env var: SUPABASE_URL` even though `.env.local` exists.

### Pitfall 4: Resend from address must match verified sending domain

**What goes wrong:** In production, `from: 'onboarding@resend.dev'` is only usable for testing to a single verified email. For sending to all subscribers, the `from` address must be on a custom verified domain.
**Why it happens:** Resend sandbox mode restricts sending to non-verified recipients.
**How to avoid:** For Phase 4 development/testing use `from: 'onboarding@resend.dev'` with `to:` set to one verified email. The Phase 1 decisions noted custom domain DNS is needed before launch. The send script should read `from` from an env var (`RESEND_FROM_ADDRESS`) so it can be switched without code changes.
**Warning signs:** Resend error `"You can only send testing emails to your own email address"`.

### Pitfall 5: @react-email/render v2.0.4 — `render()` is async; `toPlainText()` is synchronous

**What goes wrong:** Forgetting to `await render(...)` causes the HTML string to be a Promise object.
**Why it happens:** React Email 3.0 made `render()` always async (previously synchronous in v2).
**How to avoid:** Always `const html = await render(...)`. Then `const text = toPlainText(html)` (synchronous, takes the HTML string).
**Warning signs:** `html` is `"[object Promise]"` in the sent email.

### Pitfall 6: send_log unique constraint violation on batch retry

**What goes wrong:** If the Resend batch call succeeds but the subsequent `send_log` insert fails (network issue), a retry will attempt to insert duplicate rows, triggering unique constraint violation.
**Why it happens:** Non-atomic: Resend send + DB insert aren't in a transaction.
**How to avoid:** Use `upsert()` instead of `insert()` for `send_log` rows, with `onConflict: 'subscriber_id,week_key'` and `ignoreDuplicates: true`. This matches the pattern used in `cache.ts`.
**Warning signs:** Unhandled database error on retry runs.

### Pitfall 7: React Email template must not use React Server Components APIs

**What goes wrong:** Using `async` components or `fetch()` inside the React Email component causes render errors in the Node.js `render()` call.
**Why it happens:** React Email rendering uses react-dom's server rendering under the hood, not React Server Components.
**How to avoid:** Pass all data as props to the component. No async components. No fetch() inside the template. Pre-fetch all data in `main()` and pass it as props.
**Warning signs:** `Error: Objects are not valid as a React child` or hanging render.

---

## Code Examples

Verified patterns from official sources:

### Full Resend batch.send() call

```typescript
// Source: resend v6.9.2 installed types (verified from node_modules/resend/dist/index.d.cts)
const { data, error } = await resend.batch.send(
  [
    {
      from: 'Weekend Getaways <noreply@yourdomain.com>',
      to: 'subscriber@example.com',
      subject: 'Weekend deals — Weekend of 21–23 Feb 2026',
      html: '<p>...</p>',
      text: 'Deal: Barcelona...',
    },
    // up to 100 items
  ],
  {
    idempotencyKey: 'weekly-send/2026-W09/batch-0',
  }
)
// data.data = [{ id: 'ae2014de-...' }, ...]
// error = null on success
```

### render() + toPlainText()

```typescript
// Source: @react-email/render v2.0.4 installed API
// (verified from node_modules/@react-email/components/node_modules/@react-email/render/dist/node/index.d.ts)
// Exports: render (async), toPlainText (sync), pretty, plainTextSelectors
import { render, toPlainText } from '@react-email/render'
import React from 'react'
import WeeklyDeals from './emails/WeeklyDeals'

const props = { deals: dealsWithMeta, weekLabel: 'Weekend of 21–23 Feb 2026' }
const html = await render(React.createElement(WeeklyDeals, props))
const text = toPlainText(html)

// Pass both to resend:
// html: html,
// text: text,
```

### Query active subscribers

```typescript
// Source: @supabase/supabase-js v2 — existing pattern in project
const { data: subscribers, error } = await supabase
  .from('subscribers')
  .select('id, email')
  .eq('status', 'active')

if (error) throw error
```

### Query deals_cache for current week

```typescript
// Source: existing cache.ts pattern
const { data: deals, error } = await supabase
  .from('deals_cache')
  .select('id, week_key, rank, destination_iata, destination_name, flight_price, depart_at, return_at, booking_url, hotel_estimate, observed_at')
  .eq('week_key', weekKey())
  .order('rank', { ascending: true })

if (error) throw error
```

### Upsert send_log (idempotent)

```typescript
// Source: @supabase/supabase-js v2 — mirrors cache.ts upsert pattern
await supabase
  .from('send_log')
  .upsert(
    subscribers.map((sub, i) => ({
      subscriber_id: sub.id,
      week_key: key,
      status: 'sent',
      provider_message_id: ids[i]?.id ?? null,
    })),
    { onConflict: 'subscriber_id,week_key', ignoreDuplicates: true }
  )
```

### Idempotency key in resend.emails.send()

```typescript
// Source: resend v6.9.2 — verified from installed types (IdempotentRequest interface)
await resend.emails.send(
  { from: '...', to: '...', subject: '...', html: '...' },
  { idempotencyKey: 'welcome-user/123456789' }
)
// 24-hour key lifetime. For batch: key applies to entire batch call.
```

### @react-email/components — full import

```typescript
// Source: @react-email/components v1.0.8 (installed, all sub-packages confirmed)
// Available components (verified from node_modules/@react-email/ folder):
// body, button, code-block, code-inline, column, container,
// font, head, heading, hr, html, img, link, markdown, preview,
// row, section, tailwind, text
import {
  Html, Head, Body, Preview, Container,
  Section, Row, Column,
  Text, Heading, Hr, Link, Img, Button
} from '@react-email/components'
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `renderAsync()` | `render()` (always async) | React Email 3.0 | Must `await render(...)` |
| `render(component, { plainText: true })` | `toPlainText(html)` | @react-email/render v1.2.0 | `plainText` option deprecated; call `toPlainText(html)` on already-rendered HTML |
| Manual plain text in Resend | Resend auto-generates from HTML if `text` omitted | Aug 21 2025 | Safe fallback exists, but explicit `text:` param is more reliable for batch |
| Loop per subscriber | `resend.batch.send()` array | 2024 (batch API launch) | 100 emails per API call; idempotency key per batch |

**Deprecated/outdated:**
- `renderAsync()`: Replaced by `render()` which is async by default. Do not use `renderAsync`.
- `render(node, { plainText: true })`: Replaced by `toPlainText(htmlString)`. The `plainText` option still exists in types but is deprecated.
- `import` declarations for pipeline modules that depend on env: Use `require()` (Phase 3 constraint, not a library change).

---

## Open Questions

1. **Timezone for "Observed:" timestamp label**
   - What we know: `observed_at` is stored as UTC timestamp in Supabase. `date-fns` is installed. `date-fns-tz` is NOT installed.
   - What's unclear: GitHub Actions uses UTC. The success criteria show "08:12 CET" — is this just a label or must it reflect actual CET?
   - Recommendation: Implement as `format(new Date(observed_at.getTime() + 3600000), "EEE dd MMM HH:mm") + ' CET'` (hardcoded UTC+1 for CET winter offset). During CEST (summer, UTC+2), this will be 1 hour off. If accuracy matters, install `date-fns-tz` and use `formatInTimeZone(date, 'Europe/Berlin', "EEE dd MMM HH:mm")`. The planner should decide whether to add this dependency.

2. **From address for Phase 4 testing vs production**
   - What we know: `onboarding@resend.dev` is the dev testing address (Phase 1 decision). Custom domain DNS is needed before launch.
   - What's unclear: Phase 4 success criterion says "delivers a deal email to all active subscribers" — does this mean production domain must be verified?
   - Recommendation: Use an env var `RESEND_FROM_ADDRESS` that defaults to `'onboarding@resend.dev'` for local testing. The success criteria are achievable with the dev sender if you have a single verified test subscriber. Mark as a launch blocker.

3. **Trip blurb storage: static JSON vs deals_cache.trip_blurb column**
   - What we know: `deals_cache.trip_blurb` column exists in schema (TEXT, nullable). Static `data/blurbs.json` is the scoped solution. The column is NULL for rows written by Phase 3.
   - What's unclear: Should the send script populate `trip_blurb` into the DB (then re-read), or just use in-memory static JSON?
   - Recommendation: Keep it purely in-memory for Phase 4. Load `data/blurbs.json` with `require('../data/blurbs.json')` (already used in `enricher.ts` pattern). No DB write needed.

4. **Email preview / render testing approach**
   - What we know: `react-email@5.2.8` is installed (includes dev preview server). Resend dashboard also shows previews.
   - What's unclear: Does the success criterion "renders correctly in Gmail and iOS Mail" require a paid service (Litmus, Email on Acid) or is manual testing sufficient?
   - Recommendation: Use `npx react-email dev --dir pipeline/emails` locally for visual preview during development. Send a test email to a real Gmail and iOS Mail address for the acceptance check. No paid service needed for Phase 4.

---

## Sources

### Primary (HIGH confidence)

- `node_modules/resend/dist/index.d.cts` — SendEmailOptions, CreateBatchOptions, IdempotentRequest, Batch.send() TypeScript types (verified from installed v6.9.2)
- `node_modules/@react-email/components/node_modules/@react-email/render/dist/node/index.d.ts` — render(), toPlainText() API (verified from installed v2.0.4)
- `node_modules/@react-email/components/package.json` — all 20 component names confirmed
- `C:/Users/User/Desktop/my-project-1/supabase/schema.sql` — send_log, deals_cache, subscribers schema
- `C:/Users/User/Desktop/my-project-1/pipeline/index.ts` — env-loading pattern, require() pattern
- `C:/Users/User/Desktop/my-project-1/tsconfig.json` — root `"jsx": "react-jsx"` confirmed
- `C:/Users/User/Desktop/my-project-1/pipeline/tsconfig.json` — `"extends": "../tsconfig.json"` confirmed

### Secondary (MEDIUM confidence)

- https://resend.com/docs/api-reference/emails/send-email — html/text/react parameters, automatic plain text
- https://resend.com/docs/api-reference/emails/send-batch-emails — batch shape, 100-email limit, response `[{id}]` array
- https://resend.com/changelog/automatic-plain-text-emails — auto plain text from HTML (Aug 21 2025, confirmed for transactional + batch)
- https://resend.com/docs/dashboard/emails/idempotency-keys — 24-hour key lifetime, batch idempotency behavior
- https://github.com/resend/react-email/releases/tag/@react-email/render@1.2.0 — `toPlainText` introduced, `plainText` option deprecated

### Tertiary (LOW confidence)

- WebSearch results on UTM parameter naming conventions — confirmed pattern matches Google Analytics standard, no authoritative source for Resend-specific recommendations

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified from installed `node_modules`, no external dependency additions needed
- Architecture: HIGH — patterns verified from installed SDK types + existing pipeline code
- Resend plain text auto-generation: MEDIUM — documented in Resend changelog but the changelog says "transactional and batch" without confirming exact rollout; explicit `text:` param sidesteps the uncertainty
- Timezone handling: MEDIUM — `date-fns` format confirmed working; CET offset approach is a workaround; `date-fns-tz` approach would be HIGH
- Pitfalls: HIGH — most derived from reading actual installed types, existing project decisions, and email client known constraints

**Research date:** 2026-02-25
**Valid until:** 2026-03-25 (stable library stack; Resend API is stable)
