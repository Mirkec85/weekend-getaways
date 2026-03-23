# CLAUDE.md — Frontend Website Rules

## Always Do First
- **Invoke the `frontend-design` skill** before writing any frontend code, every session, no exceptions.
- **Invoke the `ui-ux-pro-max` skill** after invoking the 'frontend-design' skill before writing any frontend code, every session, no exceptions.

## What This Project Is

**Flajko** (flajko.com) is a weekly automated email newsletter that finds the cheapest weekend flights from Zagreb, Croatia and sends them to subscribers every Thursday at ~08:00 CET. Users sign up on the landing page and receive 3 curated flight deals automatically — no manual work required once deployed.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Web app | Next.js 16 + React 19 on Vercel |
| Database | Supabase (eu-west-1) |
| Email sending | Resend (from: hello@flajko.com) |
| Email templates | React Email (`@react-email/components`) |
| Flight data | Kiwi Tequila API (Amadeus test env currently) |
| Scheduling | GitHub Actions cron (Thursday 08:00 CET) |
| Monitoring | Healthchecks.io (dead man's switch) |
| Styling | Tailwind CSS v4 |

---

## Project Structure

```
/                         ← Next.js web app (landing page, API routes)
  app/
    api/
      subscribe/          ← POST: add subscriber
      confirm/            ← GET: double-opt-in confirmation
      unsubscribe/        ← GET: unsubscribe flow
      webhooks/resend/    ← POST: bounce/complaint handler
    confirm/              ← confirmation success page
    privacy/              ← privacy policy page
    unsubscribed/         ← unsubscribe success page
  lib/
    db.ts                 ← Supabase client
    resend.ts             ← Resend client
  data/
    blurbs.json           ← city description strings (46 entries)
    city-images.json      ← IATA code → Unsplash image URLs (65 entries)
    hotel-estimates.json  ← IATA code → hotel cost estimate

pipeline/                 ← standalone flight + email pipeline (NOT Next.js)
  index.ts                ← fetches deals from Kiwi, caches in Supabase
  send.ts                 ← reads cache, renders email, sends to subscribers
  fetcher.ts              ← Kiwi Tequila API call
  enricher.ts             ← adds blurb, hotel estimate, image to each deal
  selector.ts             ← picks the 3 best deals
  cache.ts                ← Supabase read/write for cached deals
  emails/
    WeeklyDeals.tsx       ← React Email template
  tsconfig.json           ← separate tsconfig (rootDir: '..') for pipeline

scripts/                  ← dev/debug utilities (ts-node)
  test-email.ts           ← send a test email manually
  verify-db.ts            ← check Supabase subscriber state
  reset-test-subscriber.ts ← reset a test subscriber back to pending
```

---

## Key Commands

```bash
npm run dev               # Start local Next.js dev server
npm run build             # Production build (run before deploying)
npm run lint              # ESLint check

# Pipeline dev tools (run standalone via ts-node)
npm run test:email        # Send a test email to your address
npm run verify:db         # Show subscribers table state
npm run reset:subscriber  # Reset a subscriber back to pending (for re-testing)
```

---

## Important Architecture Rules

### Pipeline ≠ Next.js App
The `pipeline/` folder is a separate Node.js context, not part of the Next.js app. It has its own `tsconfig.json`. Rules that apply here:
- Use **relative imports** (`../lib/db`, `../data/blurbs.json`) — the `@/` path alias does NOT work in pipeline
- Use **`require()`** (not `import`) for pipeline modules in `pipeline/index.ts` and `pipeline/send.ts` — this prevents TypeScript from hoisting requires above the `.env.local` loading step

### React Email Import
`render()` and `toPlainText()` must be imported from `@react-email/components`, not from `@react-email/render`. The standalone `@react-email/render` package is a nested dep but not installed at the top level.

### Supabase Subscriber Logic
- `insert` + catch error `23505` (not upsert) — gives precise control over duplicate subscriber states
- `unsubscribe_token` doubles as the confirm token — safe because status guards (`pending`/`active`) prevent cross-flow misuse
- Check `data.length === 0` (not `.single()`) on unsubscribe queries — avoids PostgREST errors on no-match

### Idempotency
Both pipeline scripts check a `week_key` (ISO year + week number) before doing work. Safe to re-run at any time — subscribers will never receive duplicate emails.

---

## Environment Variables

The app needs a `.env.local` file in the project root (not committed to git). Required variables:

```
NEXT_PUBLIC_BASE_URL=          # e.g. https://flajko.com (or http://localhost:3000 locally)
SUPABASE_URL=                  # Supabase project URL
SUPABASE_ANON_KEY=             # Supabase anon/public key
SUPABASE_SERVICE_ROLE_KEY=     # Supabase service role key (used in pipeline steps)
KIWI_API_KEY=                  # Kiwi Tequila API key
RESEND_API_KEY=                # Resend API key
RESEND_FROM_ADDRESS=           # e.g. hello@flajko.com
RESEND_WEBHOOK_SECRET=         # From Resend dashboard → Webhooks
```

Pipeline scripts load `.env.local` themselves at startup (see `pipeline/index.ts`).

---

## Deployment

- **Web app:** Vercel — deploys automatically from `main` branch. All env vars above must be set in Vercel project settings.
- **Pipeline:** GitHub Actions — cron runs every Thursday. All env vars above must be set as **GitHub repository secrets** (except `SEND_ENABLED` which is a **repository variable**).

**Kill-switch:** Set the GitHub repository variable `SEND_ENABLED` to `false` to suppress the next Thursday send without touching any code. Delete the variable (or set to `true`) to re-enable.

**Full operations guide:** See `OPERATIONS.md` — covers secrets setup, kill-switch, monitoring, manual triggering, and troubleshooting table.

---

## Current State

Project is complete and live. All 5 phases shipped:
1. Foundation (Next.js + Supabase + Resend setup)
2. Subscriber subsystem (signup / confirm / unsubscribe flows)
3. Flight pipeline (Kiwi Tequila fetch + caching)
4. Email assembly (React Email template + per-subscriber rendering)
5. Scheduling & automation (GitHub Actions cron + healthchecks.io)

**One pending item:** Kiwi Tequila is on test environment (`api.tequila.kiwi.com`). Switch to production endpoint when ready to scale — estimated ~$0.05/month. See `STATE.md` for details.

---

## Conventions

- This is a **product designer's project** — avoid over-engineering. Keep changes minimal and focused.
- Prefer editing existing files over creating new ones.
- When modifying `pipeline/`, test with `npm run test:email` before finishing.
- Do not commit without the user asking — always show what changed first.
