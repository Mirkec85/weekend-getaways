# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-19)

**Core value:** Find and deliver the cheapest weekend flights from Zagreb so budget-conscious travelers can make spontaneous decisions without doing the research themselves.
**Current focus:** Phase 2 — Subscriber Sub-System

## Current Position

Phase: 2 of 5 (Subscriber Sub-System)
Plan: 3 of 3 in current phase
Status: Phase complete
Last activity: 2026-02-23 — Plan 02-03 complete (Resend webhook handler for bounces + complaints)

Progress: [████░░░░░░] 40%

## Performance Metrics

**Velocity:**
- Total plans completed: 4
- Average duration: —
- Total execution time: —

**By Phase:**

| Phase | Plans | Status |
|-------|-------|--------|
| 1. Foundation | 3/3 | Complete |
| 2. Subscriber Sub-System | 3/3 | Complete |
| 3. Flight Pipeline | 0/3 | Not started |
| 4. Email Assembly | 0/2 | Not started |
| 5. Scheduling & Automation | 0/2 | Not started |

*Updated after each plan completion*

## Accumulated Context

### Decisions

- [Phase 1]: Monorepo — Next.js at root, /pipeline subfolder (NOT Turborepo)
- [Phase 1]: Resend for email, onboarding@resend.dev for dev testing; custom domain DNS needed before launch
- [Phase 1]: Supabase project `olalbfyvdmlvhtislvjf` in eu-west-1 (Ireland); 3 tables live
- [Phase 1]: Kiwi Tequila for flights, GitHub Actions cron, Vercel for hosting
- [Roadmap]: Phase 3 depends only on Phase 1 — can run in parallel with Phase 2 if desired
- [Phase 2 Plan 01]: Use insert + handle error code 23505 (not upsert) for subscriber creation — gives precise control over each duplicate state
- [Phase 2 Plan 01]: unsubscribe_token doubles as confirm token — safe because status guards (pending/active) prevent cross-flow
- [Phase 2 Plan 01]: No token expiry for MVP — pending subscribers stay pending and are excluded from sends
- [Phase 2 Plan 02]: Check data.length === 0 (not .single()) on unsubscribe update — avoids PostgREST error on no-match, correctly handles invalid/already-unsubscribed tokens
- [Phase 2 Plan 02]: Same invalid message for non-existent and already-unsubscribed tokens — no information leakage
- [Phase 2 Plan 03]: Return 200 on DB failure for webhook handler — prevents Resend retry floods; errors logged via console.error
- [Phase 2 Plan 03]: Spam complaints map to 'unsubscribed' status (not a separate status) — consistent semantics with unsubscribe flow

### Pending Todos

- DNS: SPF/DKIM/DMARC still needed on a real sending domain before launch (01-02 deferred)
- Privacy policy draft needed before subscriber #1

### Blockers/Concerns

- [Phase 3]: Kiwi Tequila API flexible date search shape needs hands-on validation; ToS cache duration limits must be confirmed before building the fetcher

## Session Continuity

Last session: 2026-02-23
Stopped at: Completed 02-02-PLAN.md — human verification approved, SUMMARY.md committed
Resume file: None
