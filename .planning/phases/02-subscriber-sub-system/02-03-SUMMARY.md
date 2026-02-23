---
phase: 02-subscriber-sub-system
plan: 03
subsystem: api
tags: [resend, webhooks, svix, supabase, next-js, bounce-handling]

# Dependency graph
requires:
  - phase: 02-subscriber-sub-system
    provides: subscribers table with status column and service-role Supabase client in lib/db.ts

provides:
  - POST /api/webhooks/resend — Svix-signed webhook handler for Resend bounce and complaint events
  - Automatic subscriber status updates on hard bounce (-> bounced) and spam complaint (-> unsubscribed)

affects:
  - 04-email-assembly
  - 05-scheduling-automation

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Raw body read first (req.text()) before signature verification — required for Svix HMAC integrity"
    - "Always return 200 for valid-signature webhook events even if DB processing fails"
    - "Status guard (.eq('status', 'active')) prevents re-processing already-transitioned subscribers"

key-files:
  created:
    - app/api/webhooks/resend/route.ts
    - .planning/phases/02-subscriber-sub-system/02-USER-SETUP.md
  modified: []

key-decisions:
  - "Return 200 on DB failure (not 500) to prevent Resend retry floods — DB errors logged via console.error"
  - "Complaints map to 'unsubscribed' status (not a separate 'complained' status) — consistent with plan spec"
  - "No separate RESEND_WEBHOOK_SECRET validation beyond passing empty string — invalid/missing secret causes verify() to throw, caught by try/catch returning 400"

patterns-established:
  - "Webhook pattern: req.text() -> verify() in try/catch -> process event -> always return 200 for valid signature"

# Metrics
duration: 1min
completed: 2026-02-23
---

# Phase 2 Plan 3: Resend Webhook Handler Summary

**Resend webhook route using resend.webhooks.verify() with raw body priority, mapping email.bounced to 'bounced' and email.complained to 'unsubscribed' subscriber statuses**

## Performance

- **Duration:** 1 min
- **Started:** 2026-02-23T21:26:18Z
- **Completed:** 2026-02-23T21:27:35Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- POST /api/webhooks/resend handler created with correct raw-body-first read order
- Invalid Svix signatures rejected with 400 (verified via curl test)
- email.bounced marks active subscribers as 'bounced'; email.complained marks as 'unsubscribed'
- DB errors swallowed with logging — valid signatures always get 200 to prevent Resend retry floods
- Build passes clean — route listed as Dynamic in Next.js output

## Task Commits

Each task was committed atomically:

1. **Task 1: Resend webhook handler for bounces and complaints** - `56ac327` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified

- `app/api/webhooks/resend/route.ts` - POST handler for Resend webhook events (email.bounced + email.complained)
- `.planning/phases/02-subscriber-sub-system/02-USER-SETUP.md` - Human setup instructions for RESEND_WEBHOOK_SECRET and Resend dashboard configuration

## Decisions Made

- **Return 200 on DB failure:** A broken DB should not trigger Resend retry floods (retry schedule: 5s, 5m, 30m, 2h, 5h, 10h). Errors are logged via console.error for observability.
- **Complaints -> 'unsubscribed' not a new status:** Consistent with plan spec; user marked email as spam so treating as unsubscribed is correct semantics.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

**External services require manual configuration.** See [02-USER-SETUP.md](./02-USER-SETUP.md) for:
- `RESEND_WEBHOOK_SECRET` environment variable (from Resend Dashboard -> Webhooks -> Signing secret)
- Dashboard: create webhook endpoint pointing to `https://YOUR_DOMAIN/api/webhooks/resend` with events `email.bounced` and `email.complained`
- Local dev: ngrok tunnel required for testing real webhook delivery

## Next Phase Readiness

- Subscriber sub-system complete (plans 01, 02, 03 done): subscribe, confirm, unsubscribe, and bounce/complaint handling all implemented
- Phase 2 is complete — ready for Phase 3 (Flight Pipeline) or Phase 4 (Email Assembly)
- Blocker before real traffic: `RESEND_WEBHOOK_SECRET` must be set in Vercel and Resend webhook endpoint must be configured (see 02-USER-SETUP.md)
- Existing concern: custom sending domain DNS (SPF/DKIM/DMARC) still needed before Phase 2 goes live for real users

## Self-Check: PASSED

- FOUND: `app/api/webhooks/resend/route.ts`
- FOUND: `.planning/phases/02-subscriber-sub-system/02-03-SUMMARY.md`
- FOUND: `.planning/phases/02-subscriber-sub-system/02-USER-SETUP.md`
- FOUND: commit `56ac327` feat(02-03): Resend webhook handler for bounce and complaint events

---
*Phase: 02-subscriber-sub-system*
*Completed: 2026-02-23*
