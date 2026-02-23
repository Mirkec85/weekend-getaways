# Phase 2: Subscriber Sub-System - Research

**Researched:** 2026-02-23
**Domain:** Next.js App Router API routes, Resend email SDK, Supabase PostgreSQL, GDPR consent, webhook signature verification
**Confidence:** HIGH

---

## Summary

Phase 2 implements the complete subscriber lifecycle: sign-up form on the landing page, double opt-in confirmation via email, one-click unsubscribe via token link, and automatic hard-bounce/spam-complaint handling via Resend webhooks. No new packages are required — the stack from Phase 1 (`next@16.1.6`, `resend@6.9.2`, `@supabase/supabase-js@2.97.0`, `zod@4.3.6`, `tailwindcss@4`) covers everything. Zod is already present as a transitive dependency.

The database schema is already live with all required columns (`status`, `unsubscribe_token`, `confirmed_at`, etc.), and the service-role Supabase client in `lib/db.ts` bypasses RLS, making server-side subscriber mutations straightforward. The implementation is four Route Handlers plus a landing page form overhaul — no new infrastructure is needed.

The key architectural decisions are: (1) use Route Handlers (not Server Actions) for all subscriber mutations so the webhook endpoint follows the same pattern; (2) store a separate `confirm_token` for double opt-in distinct from `unsubscribe_token`; (3) verify webhook signatures using `resend.webhooks.verify()` on the raw request body; (4) during development with `onboarding@resend.dev`, emails can only be sent to the developer's own verified Resend account email — real subscribers require a verified domain.

**Primary recommendation:** Implement four Route Handlers (`/api/subscribe`, `/api/confirm`, `/api/unsubscribe`, `/api/webhooks/resend`), update `app/page.tsx` to a real landing page with a subscription form, and rely entirely on the existing stack — no new npm packages needed.

---

## Standard Stack

### Core (already installed — no new installs needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `next` | 16.1.6 | App Router Route Handlers for all API endpoints | Already in project; Route Handlers are the App Router API pattern |
| `resend` | 6.9.2 | Send confirmation emails; verify webhook signatures | Already in project; provides `resend.webhooks.verify()` and typed payloads |
| `@supabase/supabase-js` | 2.97.0 | All DB reads/writes for subscriber table | Already in project; service-role client bypasses RLS |
| `zod` | 4.3.6 | Validate incoming form data (email field) | Already installed as transitive dependency; TypeScript-first validation |
| `tailwindcss` | 4 | Landing page and confirmation/unsubscribe page styling | Already in project |

### No New Packages Required

The full Phase 2 implementation uses only what is already installed. Do not add additional email libraries, token libraries, or validation frameworks.

**Verification:** All packages confirmed present in `node_modules/` on 2026-02-23.

---

## Architecture Patterns

### Recommended File Structure

```
app/
├── page.tsx                          ← Replace placeholder with real landing page + form
├── confirm/
│   └── page.tsx                      ← Success/failure page after clicking confirm link
├── unsubscribed/
│   └── page.tsx                      ← Confirmation page after unsubscribing
├── api/
│   ├── subscribe/
│   │   └── route.ts                  ← POST: insert pending subscriber, send confirmation email
│   ├── confirm/
│   │   └── route.ts                  ← GET: validate token, set status=active
│   ├── unsubscribe/
│   │   └── route.ts                  ← GET: validate unsubscribe_token, set status=unsubscribed
│   └── webhooks/
│       └── resend/
│           └── route.ts              ← POST: handle email.bounced + email.complained
lib/
└── db.ts                             ← Already exists; shared Supabase service-role client
```

### Pattern 1: POST Route Handler for Subscribe

**What:** Accepts form submission, inserts subscriber as `pending`, sends double opt-in email.
**When to use:** SUB-01 and SUB-02 — the signup form submission.

```typescript
// Source: Next.js official docs (nextjs.org/docs/app/api-reference/file-conventions/route) + verified Resend SDK types
// app/api/subscribe/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { supabase } from '@/lib/db'
import { z } from 'zod'

const resend = new Resend(process.env.RESEND_API_KEY)

const BodySchema = z.object({
  email: z.string().email(),
  gdpr_consent: z.literal(true),  // must be explicitly true — GDPR requirement
})

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const { email } = parsed.data

  // Upsert: if email exists and is pending, overwrite. If active/unsubscribed, reject gracefully.
  const { data: subscriber, error } = await supabase
    .from('subscribers')
    .upsert({ email }, { onConflict: 'email', ignoreDuplicates: true })
    .select('id, unsubscribe_token, status')
    .single()

  if (error) {
    // email already exists and ignoreDuplicates=true means we need to fetch it
    const { data: existing } = await supabase
      .from('subscribers')
      .select('id, unsubscribe_token, status')
      .eq('email', email)
      .single()
    // Handle already-active or unsubscribed states gracefully
  }

  // Send confirmation email with token link
  const confirmUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/confirm?token=${subscriber.unsubscribe_token}`
  await resend.emails.send({
    from: process.env.RESEND_FROM!,
    to: email,
    subject: 'Confirm your subscription',
    html: `<p>Click <a href="${confirmUrl}">here</a> to confirm.</p>`,
  })

  return NextResponse.json({ success: true }, { status: 201 })
}
```

### Pattern 2: GET Route Handler for Confirm

**What:** User clicks confirmation link, token is validated, subscriber moves to `active`.
**When to use:** SUB-02 — double opt-in confirmation.

```typescript
// Source: Next.js official docs (nextjs.org/docs/app/api-reference/file-conventions/route)
// app/api/confirm/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/db'
import { redirect } from 'next/navigation'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')

  if (!token) {
    redirect('/confirm?status=invalid')
  }

  const { data, error } = await supabase
    .from('subscribers')
    .update({ status: 'active', confirmed_at: new Date().toISOString() })
    .eq('unsubscribe_token', token)
    .eq('status', 'pending')   // only confirm if still pending
    .select('id')
    .single()

  if (error || !data) {
    redirect('/confirm?status=invalid')
  }

  redirect('/confirm?status=success')
}
```

### Pattern 3: GET Route Handler for Unsubscribe

**What:** User clicks unsubscribe link (token in URL), status set to `unsubscribed` immediately.
**When to use:** SUB-03 — one-click unsubscribe, no login required.

```typescript
// Source: Next.js official docs + verified Supabase SDK
// app/api/unsubscribe/route.ts
import { NextRequest } from 'next/server'
import { supabase } from '@/lib/db'
import { redirect } from 'next/navigation'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')

  if (!token) redirect('/unsubscribed?status=invalid')

  await supabase
    .from('subscribers')
    .update({ status: 'unsubscribed', unsubscribed_at: new Date().toISOString() })
    .eq('unsubscribe_token', token)
    .eq('status', 'active')   // only unsubscribe if currently active

  redirect('/unsubscribed?status=success')
}
```

### Pattern 4: Webhook Route Handler for Resend Events

**What:** Receives `email.bounced` and `email.complained` events from Resend, updates subscriber status.
**When to use:** SUB-04 — automatic bounce/complaint handling.

```typescript
// Source: resend@6.9.2 type definitions (node_modules/resend/dist/index.d.mts) + Resend docs
// app/api/webhooks/resend/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { supabase } from '@/lib/db'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  // CRITICAL: use req.text() not req.json() — signature is sensitive to body changes
  const payload = await req.text()

  let event
  try {
    event = resend.webhooks.verify({
      payload,
      headers: {
        id: req.headers.get('svix-id') ?? '',
        timestamp: req.headers.get('svix-timestamp') ?? '',
        signature: req.headers.get('svix-signature') ?? '',
      },
      webhookSecret: process.env.RESEND_WEBHOOK_SECRET ?? '',
    })
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // event.type is narrowed by TypeScript union — WebhookEventPayload
  if (event.type === 'email.bounced' || event.type === 'email.complained') {
    const recipientEmail = event.data.to[0]  // to is string[] per SDK types
    const newStatus = event.type === 'email.bounced' ? 'bounced' : 'unsubscribed'

    await supabase
      .from('subscribers')
      .update({ status: newStatus })
      .eq('email', recipientEmail)
      .eq('status', 'active')
  }

  // Must return 200 or Resend will retry (retry schedule: 5s, 5m, 30m, 2h, 5h, 10h)
  return NextResponse.json({ received: true }, { status: 200 })
}
```

### Pattern 5: GDPR-Compliant Subscription Form

**What:** Landing page form with unchecked-by-default consent checkbox.
**When to use:** SUB-01 — the visible UI for sign-up.

```typescript
// Source: GDPR requirements (verified via TermsFeed, MailerLite) + Next.js App Router
// app/page.tsx (excerpt — the form section)
// Form must use client-side JS or a Route Handler POST; Server Actions also valid
'use client'

export default function SubscribeForm() {
  // State management for form (useActionState or useState + fetch)
  return (
    <form action="/api/subscribe" method="POST">
      <input type="email" name="email" required placeholder="your@email.com" />
      <label>
        {/* GDPR: checkbox MUST be unchecked by default — never pre-checked */}
        <input type="checkbox" name="gdpr_consent" required />
        I agree to receive weekly flight deal emails. I can unsubscribe at any time.
      </label>
      <button type="submit">Subscribe</button>
    </form>
  )
}
```

### Anti-Patterns to Avoid

- **Pre-checked consent checkbox:** Violates GDPR Article 7. Consent must be affirmative. The checkbox MUST default to unchecked.
- **Parsing webhook body as JSON before signature verification:** The `resend.webhooks.verify()` call requires the raw string body. Calling `req.json()` first will corrupt the signature check — always call `req.text()`.
- **Using `unsubscribe_token` as the confirmation token:** The schema uses a single UUID per subscriber. This works but means confirming the subscription and the unsubscribe link share the same token value. This is acceptable for MVP but means a link clicked later acts as an unsubscribe even if intended as confirm. See Open Questions.
- **Sending confirmation emails to real subscribers during dev:** With `onboarding@resend.dev` as sender, Resend only delivers to the developer's own verified email. Using real user emails during testing will silently fail or bounce.
- **Exposing service role key in client components:** `lib/db.ts` uses `SUPABASE_SERVICE_ROLE_KEY` (no `NEXT_PUBLIC_` prefix), which means it is never included in client bundles. Keep all subscriber mutations in Route Handlers.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Webhook signature verification | Custom HMAC implementation | `resend.webhooks.verify()` from resend@6.9.2 | Built into SDK; handles Svix HMAC-SHA256 and timestamp replay protection |
| Email input validation | Custom regex | `z.string().email()` from zod@4.3.6 | Zod is already installed; regex-based email validation is notoriously error-prone |
| Token generation | Custom random string | Use existing `unsubscribe_token UUID` from DB (auto-generated via `gen_random_uuid()`) | UUID v4 is cryptographically random; already in schema |
| Duplicate subscriber handling | Custom dedup logic | Supabase `upsert` with `onConflict: 'email'` | The `UNIQUE` constraint on email + upsert handles the race condition |

**Key insight:** The Resend SDK at version 6.9.2 exposes `resend.webhooks.verify()` as a synchronous method returning a typed `WebhookEventPayload` — use it directly rather than bringing in the raw `svix` npm package.

---

## Common Pitfalls

### Pitfall 1: Webhook Body Read Order

**What goes wrong:** Calling `await req.json()` before verification causes signature mismatch and all webhooks are rejected.
**Why it happens:** `req.json()` parses and re-serializes the body. Svix HMAC signatures are computed over the exact raw bytes. Even adding a space breaks it.
**How to avoid:** Always `const payload = await req.text()` as the first body read. Pass this string directly to `resend.webhooks.verify()`. Parse JSON from `payload` afterwards with `JSON.parse(payload)` only if needed (the SDK returns a typed object already).
**Warning signs:** All webhooks returning 400 "Invalid signature" even with correct `RESEND_WEBHOOK_SECRET`.

### Pitfall 2: Missing RESEND_WEBHOOK_SECRET in Vercel

**What goes wrong:** Webhook verification throws because `webhookSecret` is an empty string.
**Why it happens:** `RESEND_WEBHOOK_SECRET` must be set in Vercel environment variables separately from the Resend API key. It is found in the Resend dashboard under the specific webhook's details page after creation.
**How to avoid:** Add `RESEND_WEBHOOK_SECRET` to both `.env.local` for development (using ngrok to test) and Vercel dashboard for production. Add to `.env.example` as a documented variable.
**Warning signs:** `resend.webhooks.verify()` throwing immediately; no signature headers present (ngrok not set up).

### Pitfall 3: onboarding@resend.dev Delivery Restriction

**What goes wrong:** Confirmation emails do not arrive for real user email addresses during testing.
**Why it happens:** Resend's `onboarding@resend.dev` sender can only deliver to the developer's own verified Resend account email. All other recipients are silently suppressed.
**How to avoid:** During development, test the full flow with your own email address only. Custom domain must be verified in Resend before Phase 2 goes live for real users. `RESEND_FROM` env var controls the sender — once a custom domain is verified, update this variable.
**Warning signs:** `resend.emails.send()` returns success but emails don't arrive; Resend dashboard shows emails "sent" but not "delivered."

### Pitfall 4: Token Reuse — Confirm Link After Unsubscribe

**What goes wrong:** Because `unsubscribe_token` serves as both the confirm token and the unsubscribe token, a user who (1) signs up, (2) confirms, and (3) later clicks the confirm link again from an old email will hit `/api/confirm` with a valid token but `status='active'` — the `status='pending'` guard prevents double-activation, so this is actually safe. However, a `pending` user who never confirms and later has their token used in an unsubscribe link would incorrectly be set to `unsubscribed` without ever being `active`.
**Why it happens:** Single token per subscriber for both flows.
**How to avoid:** For MVP this is acceptable — unsubscribe links only appear in sent emails, and emails only go to `active` subscribers. The confirm link goes to `pending` subscribers who haven't received any sent emails yet. Gate the confirm endpoint on `status='pending'` and the unsubscribe endpoint on `status='active'` to prevent cross-contamination.
**Warning signs:** Subscriber status toggling unexpectedly.

### Pitfall 5: Race Condition on Double Submit

**What goes wrong:** User submits the form twice quickly, creating duplicate pending subscribers.
**Why it happens:** No server-side dedup on the subscribe endpoint.
**How to avoid:** The database `UNIQUE` constraint on `email` handles this — the second insert will fail. Use `upsert` with `ignoreDuplicates: true` to return 201 without error on re-submit of the same email. Return a consistent "check your email" message regardless of whether it was a new or duplicate submission (avoid email enumeration).
**Warning signs:** Database unique constraint errors appearing in logs.

### Pitfall 6: GDPR Non-Compliance — Pre-Checked Checkbox

**What goes wrong:** Regulator finds the consent checkbox pre-checked, consent is considered invalid, potential fine.
**Why it happens:** Developer sets `defaultChecked` on the checkbox input as a UX convenience.
**How to avoid:** Never set `defaultChecked` or `checked` without user interaction. Validate server-side that `gdpr_consent === true` was explicitly submitted. Log the consent timestamp (`subscribed_at` already captures this).
**Warning signs:** Checkbox appears checked when the page loads.

### Pitfall 7: Caching on Confirm/Unsubscribe GET Routes

**What goes wrong:** Next.js caches GET Route Handler responses; user clicks confirm link and gets a cached redirect to "already confirmed" even on first click.
**Why it happens:** Next.js 15+ changed GET Route Handler caching default to dynamic, but explicit `export const dynamic = 'force-dynamic'` is safer to include.
**How to avoid:** Add `export const dynamic = 'force-dynamic'` to any GET route handler that reads from the database.
**Warning signs:** Token lookups return stale data; multiple users share confirmation responses.

---

## Code Examples

### Verified Resend SDK Types (from installed node_modules)

```typescript
// Source: node_modules/resend/dist/index.d.mts — verified 2026-02-23

// email.bounced payload structure:
interface EmailBouncedEvent {
  type: 'email.bounced'
  created_at: string
  data: {
    broadcast_id?: string
    created_at: string
    email_id: string
    from: string
    to: string[]          // array — always use to[0] for single recipient
    subject: string
    template_id?: string
    tags?: Record<string, string>
    bounce: {
      message: string
      subType: string
      type: string        // e.g. 'Permanent'
    }
  }
}

// email.complained payload structure:
interface EmailComplainedEvent {
  type: 'email.complained'
  created_at: string
  data: {                 // BaseEmailEventData — no extra fields vs bounced
    broadcast_id?: string
    created_at: string
    email_id: string
    from: string
    to: string[]
    subject: string
    template_id?: string
    tags?: Record<string, string>
  }
}

// Webhook verify method signature:
// resend.webhooks.verify(options: VerifyWebhookOptions): WebhookEventPayload
interface VerifyWebhookOptions {
  payload: string           // raw request body as text
  headers: {
    id: string              // svix-id header
    timestamp: string       // svix-timestamp header
    signature: string       // svix-signature header
  }
  webhookSecret: string     // from RESEND_WEBHOOK_SECRET env var
}
```

### Supabase Subscriber Query Patterns

```typescript
// Source: @supabase/supabase-js@2.97.0 + existing lib/db.ts

import { supabase } from '@/lib/db'

// Insert new pending subscriber (UNIQUE on email prevents duplicates)
const { data, error } = await supabase
  .from('subscribers')
  .insert({ email })
  .select('id, unsubscribe_token')
  .single()

// If email already exists, error.code === '23505' (unique violation)

// Confirm subscriber (token + status guard)
await supabase
  .from('subscribers')
  .update({ status: 'active', confirmed_at: new Date().toISOString() })
  .eq('unsubscribe_token', token)
  .eq('status', 'pending')

// Unsubscribe (token + status guard)
await supabase
  .from('subscribers')
  .update({ status: 'unsubscribed', unsubscribed_at: new Date().toISOString() })
  .eq('unsubscribe_token', token)
  .eq('status', 'active')

// Mark bounced by email address (from webhook)
await supabase
  .from('subscribers')
  .update({ status: 'bounced' })
  .eq('email', recipientEmail)
  .eq('status', 'active')
```

### Next.js Route Handler — Reading Query Params

```typescript
// Source: Next.js official docs (nextjs.org/docs/app/api-reference/file-conventions/route)
// Verified against Next.js 16.1.6 docs last updated 2026-02-20

import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  // token is string | null
}
```

### Resend Send Email

```typescript
// Source: resend@6.9.2 SDK types + resend.com/docs/send-with-nextjs

import { Resend } from 'resend'
const resend = new Resend(process.env.RESEND_API_KEY)

const { data, error } = await resend.emails.send({
  from: process.env.RESEND_FROM!,   // e.g. "Getaways <deals@mail.yourdomain.com>"
  to: [email],
  subject: 'Confirm your subscription to Weekend Getaways',
  html: '<p>Click the link to confirm...</p>',
  // text: 'Plain text fallback',     // add for EMAIL-03 (Phase 4)
})

// data: { id: string } | null
// error: { name: string, message: string, statusCode: number } | null
```

### Zod Email Validation

```typescript
// Source: zod@4.3.6 (installed)

import { z } from 'zod'

const SubscribeSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  gdpr_consent: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the terms to subscribe' })
  }),
})

const result = SubscribeSchema.safeParse(await req.json())
if (!result.success) {
  return NextResponse.json(
    { error: result.error.issues[0].message },
    { status: 422 }
  )
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Pages Router API routes (`pages/api/`) | App Router Route Handlers (`app/api/*/route.ts`) | Next.js 13.2 | Route Handlers use Web Request/Response APIs; no Express-style req/res |
| Manual Svix package for webhook verification | `resend.webhooks.verify()` built into Resend SDK | Resend SDK v3+ | No separate `svix` package needed |
| `context.params` synchronous access | `context.params` is a Promise (must `await params`) | Next.js 15.0 RC | Dynamic route params require `await` — applies to Route Handlers with path segments |
| GET Route Handlers cached by default | GET Route Handlers dynamic by default | Next.js 15.0 RC | Breaking change — safer to explicitly add `export const dynamic = 'force-dynamic'` on data routes |

**Deprecated/outdated:**
- `resend.audiences`: Replaced by `resend.segments` in current SDK. The `audiences` property still exists but is marked `@deprecated`. Not relevant to this phase (we manage our own subscriber table).

---

## Environment Variables Required

Add these to `.env.local` and Vercel dashboard:

```bash
# Already required (from Phase 1):
RESEND_API_KEY=re_...
RESEND_FROM=onboarding@resend.dev          # dev only; update to custom domain for production
NEXT_PUBLIC_APP_URL=http://localhost:3000  # production: https://yourdomain.com

# New for Phase 2:
RESEND_WEBHOOK_SECRET=whsec_...            # from Resend dashboard → Webhooks → signing secret
```

Add `RESEND_WEBHOOK_SECRET` to `.env.example`.

---

## Open Questions

1. **Confirmation token separate from unsubscribe token**
   - What we know: The current schema uses a single `unsubscribe_token` UUID that serves both as the confirm-link token and the unsubscribe-link token.
   - What's unclear: Whether a separate `confirm_token` column should be added to the subscribers table to avoid any potential cross-flow confusion.
   - Recommendation: For MVP, the single token is safe because confirm links only go to `pending` subscribers (who receive no sent emails) and unsubscribe links only appear in emails sent to `active` subscribers. The guards `eq('status', 'pending')` and `eq('status', 'active')` prevent cross-contamination. Do not add a new DB column unless testing reveals an actual issue.

2. **Token expiry for confirmation emails**
   - What we know: The current schema has no expiry field for confirmation tokens. Industry standard is 24–72 hours for opt-in tokens.
   - What's unclear: Whether a `confirm_expires_at` column should be added to the schema.
   - Recommendation: For MVP list-building, omit token expiry. `pending` subscribers who never confirm simply stay `pending` and are excluded from sends. If expiry is desired in future, add a `confirm_expires_at` column and check it in the confirm route handler.

3. **Custom domain for Resend before launch**
   - What we know: Using `onboarding@resend.dev` only delivers to the developer's verified email. Real subscribers need a custom verified domain.
   - What's unclear: Whether Phase 1 DNS setup was completed before Phase 2 deployment.
   - Recommendation: Phase 2 should be deployed with real subscriber capacity. Verify the custom domain in Resend and update `RESEND_FROM` in Vercel environment variables before directing real traffic to the landing page. This is a deployment pre-requisite, not a code change.

4. **Rate limiting on the subscribe endpoint**
   - What we know: No rate limiting is currently implemented. Vercel's free tier provides some protection. The `UNIQUE` constraint prevents duplicate email insertion.
   - What's unclear: Whether the subscribe endpoint is at risk from form submission bots.
   - Recommendation: For MVP, rely on Supabase unique constraint (dedup protection) and Vercel's built-in rate limiting. If abuse occurs, `Upstash Redis` with sliding window is the standard Next.js solution, but adds a new dependency. Defer unless there is evidence of abuse.

5. **Webhook endpoint URL during local development**
   - What we know: Resend webhooks require a publicly accessible HTTPS endpoint. Local `localhost:3000` is not accessible.
   - What's unclear: Whether the developer has ngrok or a similar tunnel set up.
   - Recommendation: Use `ngrok http 3000` during development to expose the webhook endpoint. The URL to register in Resend dashboard will be `https://<ngrok-subdomain>.ngrok.io/api/webhooks/resend`. In production on Vercel this is not needed.

---

## Sources

### Primary (HIGH confidence)

- `node_modules/resend/dist/index.d.mts` (resend@6.9.2) — verified webhook event type definitions, `VerifyWebhookOptions`, `EmailBouncedEvent`, `EmailComplainedEvent`, `BaseEmailEventData`, `Webhooks.verify()` signature
- Next.js official docs (nextjs.org/docs/app/api-reference/file-conventions/route) — Route Handler patterns, `NextRequest.nextUrl.searchParams`, body reading, version history (v15.0.0-RC params-as-Promise change)
- `node_modules/zod/package.json` — confirmed zod@4.3.6 installed
- `C:/Users/User/Desktop/my-project-1/supabase/schema.sql` — confirmed subscribers table columns and indexes
- `C:/Users/User/Desktop/my-project-1/lib/db.ts` — confirmed service-role Supabase client pattern

### Secondary (MEDIUM confidence)

- Resend docs (resend.com/docs/dashboard/webhooks/introduction) — webhook at-least-once delivery, retry schedule (5s, 5m, 30m, 2h, 5h, 10h), IP allowlist, `svix-id` dedup header
- Resend docs (resend.com/docs/dashboard/webhooks/verify-webhooks-requests) — `req.text()` requirement, header names (`svix-id`, `svix-timestamp`, `svix-signature`)
- Resend docs (resend.com/docs/dashboard/emails/send-test-emails) — `bounced@resend.dev`, `complained@resend.dev`, `delivered@resend.dev` test addresses
- Resend docs (resend.com/docs/knowledge-base/account-quotas-and-limits) — free tier: 100/day, 3,000/month
- GDPR analysis via TermsFeed, iubenda, MailerLite — pre-checked checkbox is invalid consent; double opt-in is best practice not mandatory under GDPR but strongly recommended for EU/DE

### Tertiary (LOW confidence — verify before implementing)

- `onboarding@resend.dev` restriction to developer-only email: Multiple community sources confirm this but official Resend docs did not explicitly state it in fetched pages. Treat as likely-true; test immediately.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified via `node_modules/` inspection on installed project
- Architecture: HIGH — Route Handler patterns verified against Next.js 16.1.6 official docs
- Webhook types: HIGH — verified directly from Resend SDK type definitions in installed `node_modules`
- GDPR requirements: MEDIUM — verified via multiple authoritative legal/compliance sources; not a technical claim
- Pitfalls: HIGH for code-level pitfalls (body parsing, caching); MEDIUM for operational (onboarding@resend.dev restriction)

**Research date:** 2026-02-23
**Valid until:** 2026-03-25 (stable stack; no fast-moving APIs involved)
