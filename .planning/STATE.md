# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-19)

**Core value:** Find and deliver the cheapest weekend flights from Zagreb so budget-conscious travelers can make spontaneous decisions without doing the research themselves.
**Current focus:** Project complete and live

## Current Position

Phase: 5 of 5 complete
Plan: 05-02 complete
Status: ✅ All phases complete — pipeline live and fully verified
Last activity: 2026-02-26 — All 4 pipeline tests passed (manual trigger, idempotency, kill-switch, keepalive)

Progress: [██████████] 100%

## Performance Metrics

**Velocity:**
- Total plans completed: 9
- Average duration: —
- Total execution time: —

**By Phase:**

| Phase | Plans | Status |
|-------|-------|--------|
| 1. Foundation | 3/3 | ✅ Complete |
| 2. Subscriber Sub-System | 3/3 | ✅ Complete |
| 3. Flight Pipeline | 3/3 | ✅ Complete |
| 4. Email Assembly | 2/2 | ✅ Complete |
| 5. Scheduling & Automation | 2/2 | ✅ Complete |

| Plan | Duration | Tasks | Files |
|------|----------|-------|-------|
| 03-02 | 12min | 2 | 3 |
| 03-03 | — | 2 | 3 |
| 04-01 | 3min | 2 | 3 |
| 04-02 | — | 3 | 4 |
| 05-01 | 2min | 2 | 2 |

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
- [Phase 4 Plan 01]: WeeklyDeals component uses self-contained DealCard interface (pre-formatted strings) — template decoupled from pipeline DB types; send script handles all date/URL formatting
- [Phase 4 Plan 01]: render() and toPlainText() must be imported from @react-email/components (not @react-email/render) — standalone @react-email/render is only a nested dep, not top-level installed
- [Phase 4 Plan 01]: data/blurbs.json flat Record<string, string> mirrors hotel-estimates.json pattern — 46 entries, loaded via require('../data/blurbs.json')
- [Phase 4 Plan 02]: Per-subscriber HTML render inside batch loop — O(n) renders so each gets personalised unsubscribeUrl; ~10ms/call is acceptable
- [Phase 4 Plan 02]: data/city-images.json — 65 IATA codes → Unsplash source URLs; imageUrl optional in DealCard (falls back to single-column card)
- [Phase 4 Plan 02]: send.ts uses resend.batch.send(chunk, { idempotencyKey }) — key format: weekly-send/{weekKey}/batch-{n}; send_log upsert with ignoreDuplicates:true for retry safety
- [Phase 5 Plan 01]: Dual cron (0 7 * * 4 + 0 6 * * 4) targets Thursday 08:00 CET/CEST — idempotency guards in index.ts and send.ts handle DST transition double-fires safely
- [Phase 5 Plan 01]: vars.SEND_ENABLED != 'false' for kill-switch — vars context readable in if: conditions; unset variable returns '' (not 'false') so default is enabled; secrets context NOT usable in if: conditions
- [Phase 5 Plan 01]: Step-level env: blocks (not workflow/job level) — limits secret exposure to only the steps that consume them; KIWI_API_KEY only on index.ts step, RESEND_API_KEY only on send.ts step
- [Phase 5 Plan 01]: gautamkrishnar/keepalive-workflow@v2 blocked by GitHub Actions policy — replaced with inline empty-commit approach using only actions/checkout@v4; requires contents: write permission
- [Phase 5 Plan 02]: Vercel was missing app/layout.tsx, globals.css, postcss.config.js — files were never committed; also postcss.config.mjs (ESM) replaced with postcss.config.js (CJS) for Turbopack compatibility

### Pending Todos (pre-public-launch)

- DNS: SPF/DKIM/DMARC needed on a real sending domain before going public (01-02 deferred)
- Privacy policy draft needed before subscriber #1
- RESEND_WEBHOOK_SECRET: add to .env.local and Vercel after creating webhook in Resend dashboard
- Switch Amadeus from test (test.api.amadeus.com) to production (api.amadeus.com) before public launch

### Blockers/Concerns

- None — pipeline is fully operational on Amadeus test environment

## Session Continuity

Last session: 2026-02-26
Stopped at: Project complete. All tests passed. Pipeline runs weekly on Thursday via GitHub Actions cron.
Resume file: None
