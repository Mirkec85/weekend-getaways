# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-19)

**Core value:** Find and deliver the cheapest weekend flights from Zagreb so budget-conscious travelers can make spontaneous decisions without doing the research themselves.
**Current focus:** Phase 2 — Subscriber Sub-System

## Current Position

Phase: 2 of 5 (Subscriber Sub-System)
Plan: 0 of 3 in current phase
Status: Ready to plan
Last activity: 2026-02-23 — Phase 1 complete (scaffold, Resend wired, Supabase verified)

Progress: [██░░░░░░░░] 20%

## Performance Metrics

**Velocity:**
- Total plans completed: 3
- Average duration: —
- Total execution time: —

**By Phase:**

| Phase | Plans | Status |
|-------|-------|--------|
| 1. Foundation | 3/3 | ✅ Complete |
| 2. Subscriber Sub-System | 0/3 | In progress |
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

### Pending Todos

- DNS: SPF/DKIM/DMARC still needed on a real sending domain before launch (01-02 deferred)
- Privacy policy draft needed before subscriber #1

### Blockers/Concerns

- [Phase 3]: Kiwi Tequila API flexible date search shape needs hands-on validation; ToS cache duration limits must be confirmed before building the fetcher

## Session Continuity

Last session: 2026-02-23
Stopped at: Phase 1 complete — all 3 plans done, DB verified, Resend smoke test passed
Resume file: None
