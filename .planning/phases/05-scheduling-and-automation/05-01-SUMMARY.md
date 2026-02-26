---
phase: 05-scheduling-and-automation
plan: 01
subsystem: infra
tags: [github-actions, cron, healthchecks, keepalive, kill-switch, yaml]

# Dependency graph
requires:
  - phase: 04-email-assembly
    provides: pipeline/index.ts and pipeline/send.ts — the scripts being automated
  - phase: 03-flight-pipeline
    provides: pipeline/tsconfig.json — tsconfig used in npx ts-node invocation
provides:
  - GitHub Actions cron workflow firing every Thursday 08:00 CET/CEST via dual UTC entries
  - Kill-switch via vars.SEND_ENABLED repository variable (not secrets)
  - Healthchecks.io dead man's switch via ping-success/ping-failure jobs
  - Monthly keepalive workflow preventing 60-day schedule suspension
affects: [deployment, operations, monitoring]

# Tech tracking
tech-stack:
  added: [gautamkrishnar/keepalive-workflow@v2, healthchecks.io (external service)]
  patterns:
    - Dual-cron DST handling — two cron entries (07 UTC winter, 06 UTC summer) with idempotency guards absorbing double-fires
    - Step-level env blocks — secrets scoped to only the steps that need them
    - vars context for kill-switch — non-sensitive flags use vars (not secrets) so they are readable in if: conditions
    - Separate dependent jobs for monitoring — ping-success and ping-failure jobs with needs: [run-pipeline]

key-files:
  created:
    - .github/workflows/weekly-pipeline.yml
    - .github/workflows/keepalive.yml
  modified: []

key-decisions:
  - "Dual cron (0 7 * * 4 + 0 6 * * 4) targets Thursday 08:00 CET/CEST — idempotency guards in index.ts and send.ts handle DST transition double-fires safely"
  - "vars.SEND_ENABLED != 'false' for kill-switch — vars context readable in if: conditions; unset variable returns '' (not 'false') so default is enabled"
  - "Step-level env: blocks (not workflow or job level) — limits secret exposure to only the steps that consume them"
  - "KIWI_API_KEY excluded from send.ts step env, RESEND_API_KEY excluded from index.ts step env — least-privilege secret access"
  - "gautamkrishnar/keepalive-workflow@v2 uses GitHub API for activity (not commits) — no git history pollution"

patterns-established:
  - "Dual-cron DST pattern: two schedule entries with idempotency guards — standard for UTC-only schedulers targeting local wall-clock times"
  - "Kill-switch via vars: SEND_ENABLED != 'false' default-on pattern — deletion/unset means enabled, explicit 'false' means disabled"
  - "Monitoring via dependent jobs: ping-success/ping-failure jobs with needs: and success()/failure() conditions"

# Metrics
duration: 2min
completed: 2026-02-26
---

# Phase 5 Plan 01: Scheduling and Automation Summary

**Thursday 08:00 CET/CEST dual-cron GitHub Actions workflow with kill-switch, Healthchecks.io dead man's switch, and monthly keepalive preventing 60-day schedule suspension**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-26T09:24:53Z
- **Completed:** 2026-02-26T09:26:xx Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Weekly pipeline workflow fires every Thursday at approximately 08:00 CET/CEST via dual UTC cron entries, wiring the existing index.ts and send.ts scripts into automated execution
- Kill-switch implemented via repository variable vars.SEND_ENABLED — operator can suppress any Thursday's send via the GitHub UI without code changes
- Healthchecks.io receives a success or failure ping after every run via separate dependent jobs, enabling dead man's switch alerting if no ping arrives within configured grace period
- Monthly keepalive workflow prevents GitHub's 60-day inactivity schedule suspension for this low-commit-frequency newsletter repo

## Task Commits

Each task was committed atomically:

1. **Task 1: weekly-pipeline.yml with dual cron, kill-switch, sequential steps, HC pings** - `aa279ff` (feat)
2. **Task 2: keepalive.yml to prevent 60-day schedule suspension** - `e1a1509` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified

- `.github/workflows/weekly-pipeline.yml` — Main cron workflow: dual DST crons, kill-switch, index.ts then send.ts steps with step-level secrets, ping-success and ping-failure HC jobs
- `.github/workflows/keepalive.yml` — Monthly keepalive to prevent 60-day schedule suspension via gautamkrishnar/keepalive-workflow@v2

## Decisions Made

- **Dual cron for DST:** Two schedule entries (0 7 * * 4 for CET winter, 0 6 * * 4 for CEST summer) rather than a single UTC cron. The existing idempotency guards in index.ts (hasCachedDeals) and send.ts (send_log pre-check) handle the rare DST transition week double-fire safely.
- **vars.SEND_ENABLED for kill-switch:** GitHub secrets are inaccessible in job-level if: conditions. Repository variables (vars context) are readable in if: conditions. SEND_ENABLED is not sensitive — using vars is correct.
- **Step-level env blocks:** Secrets scoped to only the steps that need them. KIWI_API_KEY only on the index.ts step; RESEND_API_KEY only on the send.ts step.
- **keepalive-workflow@v2 API mode:** Uses the GitHub API to register activity rather than making commits, avoiding git history pollution for a newsletter repo.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

**External services require manual configuration before the workflow will function:**

### GitHub Secrets (7 required)

Navigate to: `https://github.com/{owner}/{repo}/settings/secrets/actions`

| Secret Name | Source |
|-------------|--------|
| `SUPABASE_URL` | Supabase project → Settings → API → Project URL |
| `SUPABASE_ANON_KEY` | Supabase project → Settings → API → anon/public key |
| `KIWI_API_KEY` | Kiwi Tequila dashboard → API keys |
| `RESEND_API_KEY` | Resend dashboard → API Keys |
| `RESEND_FROM_ADDRESS` | Verified sender email (e.g. hello@yourdomain.com) |
| `NEXT_PUBLIC_BASE_URL` | Production Vercel URL (e.g. https://your-app.vercel.app) |
| `HEALTHCHECKS_PING_URL` | Healthchecks.io → New Check → copy ping URL |

### GitHub Variables (optional kill-switch)

Navigate to: `https://github.com/{owner}/{repo}/settings/variables/actions`

- Create variable `SEND_ENABLED` with value `true` (or leave unset — unset defaults to enabled)
- To suppress a Thursday send: set `SEND_ENABLED` to `false`
- To re-enable: set back to `true` or delete the variable

### Healthchecks.io Check Setup

Navigate to: `https://healthchecks.io/checks/add/`

- Create a new check: Name = "Weekly Pipeline", Schedule type = "Simple", Period = 1 week, Grace = 4 hours
- Copy the ping URL and add it as the `HEALTHCHECKS_PING_URL` GitHub secret above

## Next Phase Readiness

Phase 5 Plan 01 completes the scheduling infrastructure. The pipeline is now fully automated:
- Runs every Thursday at approximately 08:00 CET/CEST without manual intervention
- Monitored via Healthchecks.io dead man's switch
- Protected against 60-day inactivity suspension
- Operator can suppress any individual Thursday send via the GitHub UI kill-switch

The only remaining item for Phase 5 is Plan 02 (if planned). Once secrets are configured in GitHub, the first automated run will execute on the next Thursday.

---
*Phase: 05-scheduling-and-automation*
*Completed: 2026-02-26*

## Self-Check: PASSED

- FOUND: .github/workflows/weekly-pipeline.yml
- FOUND: .github/workflows/keepalive.yml
- FOUND: .planning/phases/05-scheduling-and-automation/05-01-SUMMARY.md
- FOUND: aa279ff (Task 1 commit)
- FOUND: e1a1509 (Task 2 commit)
