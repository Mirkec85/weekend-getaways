# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-19)

**Core value:** Find and deliver the cheapest weekend flights from Zagreb so budget-conscious travelers can make spontaneous decisions without doing the research themselves.
**Current focus:** Phase 3 — Flight Pipeline

## Current Position

Phase: 3 of 5 (Flight Pipeline)
Plan: 3 of 3 in current phase
Status: Complete (pending verification)
Last activity: 2026-02-24 — Phase 3 Plan 03 complete (pipeline orchestrator, type consolidation)

Progress: [██████░░░░] 60%

## Performance Metrics

**Velocity:**
- Total plans completed: 8
- Average duration: —
- Total execution time: —

**By Phase:**

| Phase | Plans | Status |
|-------|-------|--------|
| 1. Foundation | 3/3 | ✅ Complete |
| 2. Subscriber Sub-System | 3/3 | ✅ Complete |
| 3. Flight Pipeline | 3/3 | ✅ Complete |
| 4. Email Assembly | 0/2 | Not started |
| 5. Scheduling & Automation | 0/2 | Not started |

| Plan | Duration | Tasks | Files |
|------|----------|-------|-------|
| 03-02 | 12min | 2 | 3 |
| 03-03 | — | 2 | 3 |

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
- [Phase 2 Plan 02]: Check data.length === 0 (not .single()) on unsubscribe update — avoids PostgREST error on no-match
- [Phase 2 Plan 02]: Same invalid message for non-existent and already-unsubscribed tokens — no information leakage
- [Phase 2 Plan 03]: Return 200 on DB failure for webhook handler — prevents Resend retry floods
- [Phase 2 Plan 03]: Spam complaints map to 'unsubscribed' status (not a separate status)
- [Phase 3 Plan 01]: date-fns installed as dependency (was missing) — required for addDays/format/getISOWeek
- [Phase 3 Plan 01]: pipeline/tsconfig.json rootDir widened to '..' to allow ../lib/db relative import — original rootDir '.' blocked cross-directory imports
- [Phase 3 Plan 01]: getWeekendWindow takes thursday?: Date param — enables testing without mocking global Date
- [Phase 3 Plan 01]: Pipeline modules use relative imports (../lib/db) not @/ aliases — tsconfig paths not available in pipeline context
- [Phase 3 Plan 03]: pipeline/index.ts uses require() (not import declarations) for pipeline modules — prevents TypeScript hoisting requires above the inline .env.local loading step
- [Phase 3 Plan 03]: TequilaFlight single source of truth in pipeline/fetcher.ts; EnrichedDeal single source of truth in pipeline/enricher.ts (selector.ts and cache.ts re-export)

### Pending Todos

- DNS: SPF/DKIM/DMARC still needed on a real sending domain before launch (01-02 deferred)
- Privacy policy draft needed before subscriber #1
- RESEND_WEBHOOK_SECRET: add to .env.local and Vercel after creating webhook in Resend dashboard

### Blockers/Concerns

- [Phase 3]: Kiwi Tequila API ToS cache duration limits must be confirmed before first live run (validation partially addressed — fetcher built with correct parameters)

## Session Continuity

Last session: 2026-02-24
Stopped at: Phase 3 complete — all 3 plans executed, pipeline orchestrator wired and committed
Resume file: None
