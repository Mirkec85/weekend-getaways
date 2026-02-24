---
phase: 03-flight-pipeline
plan: 03
status: complete
completed: 2026-02-24
commits:
  - a0c0882  # type consolidation: selector.ts + cache.ts
  - d474456  # pipeline orchestrator: index.ts
---

# Summary: 03-03 — Pipeline Orchestrator

## What was built

`pipeline/index.ts` — the main entry point that wires all pipeline modules into a runnable script:

1. **Env loading** — Manually reads `.env.local` at file scope (before any pipeline `require()`) so `lib/db.ts` has `SUPABASE_URL`/`SUPABASE_ANON_KEY` when it creates the Supabase client.
2. **Module loading** — Uses `require()` calls (not static `import` declarations) for pipeline modules to guarantee they execute AFTER the env loading step. TypeScript cannot hoist `require()` function calls the way it hoists `import` declarations.
3. **Orchestration flow**: `weekKey()` → `hasCachedDeals()` → `fetchWeekendFlights()` → `selectTopDeals()` → `enrichWithHotelEstimate()` → `saveDealsToCache()`
4. **PIPE-04 zero-results fallback** — returns cleanly (exit 0) when Tequila returns no qualifying flights.
5. **Idempotency guard** — checks `hasCachedDeals()` first; if data already exists for the week, exits without hitting the API.

Also resolved type duplication from parallel Wave 1 execution:
- `pipeline/selector.ts`: removed local `TequilaFlight` interface; now imports/re-exports from `./fetcher`
- `pipeline/cache.ts`: removed local `EnrichedDeal` interface; now imports/re-exports from `./enricher`

## Deviations from plan

**Wave 2 subagent tool permissions denied** — The gsd-executor subagent reported Read and Bash tools were being denied. Plan 03-03 was executed directly in the orchestrator context instead.

**env loading approach** — Plan suggested inline `loadEnv()` function + static imports below it. Final implementation uses file-scope `require()` calls (after inline env loading) rather than static `import` declarations, which is more reliable because `require()` function calls are never hoisted regardless of TypeScript version or settings.

## Verification results

- `tsc --noEmit` — clean, no errors
- `ts-node pipeline/index.ts` (no KIWI_API_KEY) — exits with `Error: KIWI_API_KEY is not set` as expected (confirms env loading and module initialization succeeded)

## Files modified

| File | Change |
|------|--------|
| `pipeline/index.ts` | Full orchestrator (new content) |
| `pipeline/selector.ts` | Removed local TequilaFlight, import from ./fetcher |
| `pipeline/cache.ts` | Removed local EnrichedDeal, import from ./enricher |
