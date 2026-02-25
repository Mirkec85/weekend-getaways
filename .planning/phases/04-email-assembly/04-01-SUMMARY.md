---
phase: 04-email-assembly
plan: 01
subsystem: ui
tags: [react-email, email, tsx, blurbs, tsconfig]

# Dependency graph
requires:
  - phase: 03-flight-pipeline
    provides: EnrichedDeal type, pipeline/enricher.ts, pipeline/tsconfig.json
  - phase: 01-foundation
    provides: data/hotel-estimates.json with IATA codes

provides:
  - pipeline/emails/WeeklyDeals.tsx — React Email template component with DealCard/WeeklyDealsProps types
  - data/blurbs.json — 46-entry IATA-to-trip-blurb mapping for all known destinations
  - pipeline/tsconfig.json updated with .tsx glob for email template compilation

affects: [04-02-send-script, phase-5-scheduling]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "React Email component with all inline styles — no className, no external CSS (Gmail compatibility)"
    - "DealCard interface as self-contained props type — component accepts pre-formatted display strings, not raw DB rows"
    - "Named type exports (DealCard, WeeklyDealsProps) alongside default component export for consumer typing"

key-files:
  created:
    - pipeline/emails/WeeklyDeals.tsx
    - data/blurbs.json
  modified:
    - pipeline/tsconfig.json

key-decisions:
  - "WeeklyDeals component uses self-contained DealCard interface (pre-formatted strings) rather than extending EnrichedDeal — keeps template decoupled from pipeline DB types"
  - "render() imported from @react-email/components (not @react-email/render directly) — render is re-exported from components package; standalone @react-email/render not installed at top level"
  - "data/blurbs.json uses flat Record<string, string> matching hotel-estimates.json pattern — 46 entries covering all IATA codes"

patterns-established:
  - "Pattern: React Email template lives at pipeline/emails/*.tsx — separate subdirectory from pipeline orchestration scripts"
  - "Pattern: All email styles defined as React.CSSProperties const objects at module bottom — keeps JSX clean, satisfies TypeScript strict mode"

# Metrics
duration: 3min
completed: 2026-02-25
---

# Phase 4 Plan 01: Email Template Assembly Summary

**React Email WeeklyDeals template with 3-field deal cards (price, dates, blurb, hotel est., observed timestamp, CTA) and 46-destination static blurbs data file**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-02-25T11:13:29Z
- **Completed:** 2026-02-25T11:16:05Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Created `pipeline/emails/WeeklyDeals.tsx` — single-column 600px React Email component with inline styles only, renders deal cards with all EMAIL-01/02/03 required fields
- Created `data/blurbs.json` with 46 IATA-to-blurb entries covering every destination in `hotel-estimates.json`
- Updated `pipeline/tsconfig.json` to include `./**/*.tsx` glob, enabling TSX compilation for the email template
- TypeScript compilation passes with zero errors; `render()` produces 3948-byte valid HTML with all deal fields verified

## Task Commits

Each task was committed atomically:

1. **Task 1: Create trip blurbs data file and fix pipeline tsconfig for TSX** - `3d70da5` (feat)
2. **Task 2: Create WeeklyDeals React Email template component** - `41478d1` (feat)

**Plan metadata:** (see final commit below)

## Files Created/Modified

- `pipeline/emails/WeeklyDeals.tsx` — React Email component; exports `DealCard` and `WeeklyDealsProps` types + default `WeeklyDeals` component; single-column 600px layout with all inline styles
- `data/blurbs.json` — Flat `Record<string, string>` mapping 46 IATA codes to 1-sentence destination blurbs
- `pipeline/tsconfig.json` — Added `./**/*.tsx"` to include array (was `["./**/*.ts", "../lib/**/*.ts"]`)

## Decisions Made

- **DealCard uses pre-formatted display strings** — `departLabel`, `returnLabel`, `observedLabel`, `bookingUrl` are all pre-formatted strings rather than raw Date objects or DB fields. This keeps the template stateless and purely presentational; the caller (send script) handles all formatting.
- **`render` imported from `@react-email/components`** — The standalone `@react-email/render` package is not installed at the top level; it lives as a nested dependency of `@react-email/components`, which re-exports `render` and `toPlainText`. All consumers should import from `@react-email/components`.
- **`import * as React from 'react'` pattern** — Used over bare `React` to satisfy pipeline tsconfig strict mode and ensure JSX runtime compatibility.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- The plan's verification command used `import { render } from '@react-email/render'` which fails in this project because `@react-email/render` is only installed as a nested dep of `@react-email/components`. Fixed in the temporary verify script by importing from `@react-email/components` instead. The actual `WeeklyDeals.tsx` template was unaffected (it only imports from `@react-email/components` and `react`). Documented as a decision for the send script in plan 04-02.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `pipeline/emails/WeeklyDeals.tsx` is ready to be imported by `pipeline/send.ts` (plan 04-02)
- `data/blurbs.json` ready to be loaded with `require('../data/blurbs.json')` in the send script
- `render` and `toPlainText` must be imported from `@react-email/components` (not `@react-email/render`) in any `.ts` files
- Template accepts pre-formatted `DealCard[]` props — the send script must format `depart_at`, `return_at`, `observed_at`, append UTM params, and look up blurbs before passing to the component

---
*Phase: 04-email-assembly*
*Completed: 2026-02-25*
