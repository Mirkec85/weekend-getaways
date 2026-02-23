---
phase: 02-subscriber-sub-system
plan: 01
subsystem: api
tags: [next.js, resend, supabase, zod, tailwind, gdpr, double-opt-in]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: lib/db.ts Supabase service-role client, Resend installed, schema with subscribers table

provides:
  - Landing page with GDPR-compliant subscription form (app/page.tsx)
  - POST /api/subscribe — insert pending subscriber + send confirmation email
  - GET /api/confirm — validate token, activate subscriber, redirect to result page
  - /confirm result page — success or invalid message

affects:
  - 02-02 (unsubscribe flow — uses same token, same subscribers table)
  - 02-03 (webhook bounce handling — uses same subscribers table and status values)
  - 04-email-assembly (confirmation email template — currently inline HTML)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Route Handlers for all subscriber mutations (not Server Actions)"
    - "Zod safeParse with literal(true) for GDPR consent enforcement"
    - "Insert-then-handle-23505 pattern for idempotent subscriber upserts"
    - "NextResponse.redirect with new URL() for Route Handler redirects"
    - "force-dynamic on GET Route Handlers that read from DB"

key-files:
  created:
    - app/api/subscribe/route.ts
    - app/api/confirm/route.ts
    - app/confirm/page.tsx
  modified:
    - app/page.tsx
    - .env.example

key-decisions:
  - "Use insert + handle error code 23505 (not upsert) for subscriber creation — gives precise control over each duplicate state"
  - "unsubscribe_token doubles as confirm token — safe because status guards (pending/active) prevent cross-flow"
  - "No token expiry for MVP — pending subscribers who never confirm stay pending and are excluded from sends"

patterns-established:
  - "Subscriber status machine: pending -> active (via confirm), active -> unsubscribed (via unsubscribe), active -> bounced (via webhook)"
  - "Duplicate email handling: 409 for active, re-send for pending, re-subscribe for unsubscribed/bounced"

# Metrics
duration: 12min
completed: 2026-02-23
---

# Phase 2 Plan 01: Subscriber Sign-up and Double Opt-in Summary

**GDPR-compliant subscription form, POST /api/subscribe with Resend double opt-in email, GET /api/confirm token activation, and /confirm result page — complete sign-up-to-active flow**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-02-23T21:21:48Z
- **Completed:** 2026-02-23T21:23:53Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Landing page replaces Next.js placeholder with real Weekend Getaways form: email input + unchecked GDPR consent checkbox + submit button, client-side fetch to /api/subscribe
- POST /api/subscribe validates with Zod (email format + gdpr_consent must be literal true), inserts pending subscriber, sends HTML confirmation email with clickable link via Resend, handles all duplicate states gracefully
- GET /api/confirm validates token against pending subscriber, updates status to active with confirmed_at timestamp, redirects to /confirm result page; force-dynamic prevents caching
- /confirm server component shows success or invalid message based on searchParams.status

## Task Commits

Each task was committed atomically:

1. **Task 1: Landing page with subscription form** - `2feeb61` (feat)
2. **Task 2: Subscribe and Confirm API routes** - `808a01b` (feat)
3. **Chore: document RESEND_WEBHOOK_SECRET** - `74bb35d` (chore)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `app/page.tsx` - Landing page with GDPR form, client-side state, success/error/already-subscribed messages
- `app/api/subscribe/route.ts` - POST handler: Zod validation, insert pending, Resend email, duplicate handling
- `app/api/confirm/route.ts` - GET handler: token lookup, activate subscriber, redirect to result page
- `app/confirm/page.tsx` - Server component result page: success or invalid message + homepage link
- `.env.example` - Added RESEND_WEBHOOK_SECRET documentation for Phase 2 webhook handler

## Decisions Made

- **Insert + 23505 error handling over upsert**: The plan specifies `insert` + check error code `23505` (not upsert). This gives precise handling of each duplicate state (active → 409, pending → re-send, unsubscribed/bounced → re-subscribe) rather than a coarser upsert approach.
- **Single confirm/unsubscribe token**: The `unsubscribe_token` UUID from the schema serves both flows. Status guards (`eq('status', 'pending')` on confirm, `eq('status', 'active')` on unsubscribe) prevent cross-contamination. No additional DB column needed for MVP.
- **No token expiry**: Pending subscribers who never confirm stay pending and are excluded from campaign sends. Acceptable for MVP.

## Deviations from Plan

None — plan executed exactly as written.

The only addition was updating `.env.example` to document `RESEND_WEBHOOK_SECRET`, which the research explicitly called out as needed for Phase 2. This is a documentation-only change with no behavioral impact.

## Issues Encountered

None. The Zod v4 `z.literal()` API uses `error` instead of `errorMap` (the research example showed `errorMap`, but Zod v4 uses `error` for custom error messages on literals). Used the correct v4 API.

## User Setup Required

None — no external service configuration required for these code changes. Existing `.env.local` from Phase 1 (`RESEND_API_KEY`, `RESEND_FROM`, `NEXT_PUBLIC_APP_URL`, Supabase variables) is sufficient to run the full flow in development.

Note: `RESEND_FROM=onboarding@resend.dev` (dev only) restricts email delivery to the developer's own verified Resend email address. Real subscribers require a custom domain in Resend — this is a deployment pre-requisite documented in Phase 1.

## Next Phase Readiness

- Sign-up → pending → confirmed → active flow is complete and verified to compile
- `unsubscribe_token` is available in the subscribe route output, ready for Plan 02-02 (unsubscribe endpoint)
- Subscribers table status machine is established: pending/active/unsubscribed/bounced
- Plan 02-02 (unsubscribe) and 02-03 (webhooks) can proceed against the same schema with no schema changes needed

---
*Phase: 02-subscriber-sub-system*
*Completed: 2026-02-23*

## Self-Check: PASSED

- app/page.tsx: FOUND
- app/api/subscribe/route.ts: FOUND
- app/api/confirm/route.ts: FOUND
- app/confirm/page.tsx: FOUND
- .planning/phases/02-subscriber-sub-system/02-01-SUMMARY.md: FOUND
- Commit 2feeb61 (Task 1): FOUND
- Commit 808a01b (Task 2): FOUND
- Commit 74bb35d (chore): FOUND
