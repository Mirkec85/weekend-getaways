# Phase 3: Flight Pipeline - Research

**Researched:** 2026-02-24
**Domain:** Kiwi Tequila API, pipeline orchestration, Supabase idempotency
**Confidence:** MEDIUM (Kiwi Tequila portal requires auth; API shape confirmed via community sources and TypeScript SDK analysis)

---

## Summary

Phase 3 builds the data backbone of the application: fetching real weekend flight deals from the Kiwi Tequila API, selecting the top 3 by price, enriching them with a static hotel cost lookup, and persisting them to Supabase with full idempotency. The pipeline runs as a Node.js script (`ts-node`) under GitHub Actions on a Thursday cron, consuming the already-live `deals_cache` and `send_log` tables.

The Kiwi Tequila `v2/search` endpoint is a standard REST GET with query parameters. Authentication is an `apikey` header. Weekend searches require `fly_from=ZAG`, a `date_from/date_to` window spanning the next Friday–Monday range, `nights_in_dst_from=2`/`nights_in_dst_to=3` to constrain to weekend-length stays, `flight_type=round`, `curr=EUR`, and `sort=price`/`asc=1` to get cheapest-first. The response wraps results in a `data` array; each element contains `price`, `cityTo`, `countryTo`, `flyTo`, `local_departure`, `local_arrival`, `deep_link`, and a `route` array for per-leg details.

Idempotency is handled at two layers: (1) a week_key check against `deals_cache` before calling the API at all, and (2) Supabase upsert with `onConflict: 'week_key,rank'` to prevent duplicate rows if the pipeline re-runs. The existing schema has `UNIQUE(week_key, rank)` which is exactly the right constraint for this.

**Primary recommendation:** Use native Node.js `fetch` (available since Node 18, no extra package) for the Kiwi API call. Use `date-fns` for ISO week key generation. Use Supabase `.upsert()` with `onConflict` for idempotent cache writes.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Native `fetch` | Node 18+ built-in | HTTP GET to Tequila API | Zero dependencies; already on Node 20 in this project |
| `@supabase/supabase-js` | ^2.97.0 (already installed) | Read cache / write deals_cache | Already wired in `lib/db.ts` |
| `date-fns` | ^3.x | ISO week key (`YYYY-WNN`) generation, date arithmetic | Lightweight, tree-shakeable, 100% TypeScript, standard in Node pipelines |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `dotenv` pattern (manual) | N/A (existing pattern in scripts/) | Load `.env.local` in ts-node context | Already established in `scripts/verify-db.ts` — copy this pattern |

### Not Needed
| Instead of | Why Skip |
|------------|----------|
| `@ohm-vision/kiwi-tequila-api` SDK | Thin wrapper over fetch, adds a dependency for a single endpoint; native fetch is cleaner for one search call |
| `axios` | Native fetch is sufficient; axios adds bundle weight |
| `node-schedule` | Scheduling is handled by GitHub Actions cron, not the script itself |

**Installation:**
```bash
npm install date-fns
```
(`@supabase/supabase-js` already installed)

---

## Architecture Patterns

### Recommended Pipeline File Structure
```
pipeline/
├── index.ts              # main() orchestrator — already exists with TODO stubs
├── tsconfig.json         # CommonJS config — already exists
├── fetcher.ts            # fetchWeekendFlights() — calls Tequila v2/search
├── selector.ts           # selectTopDeals() — sorts, filters, picks top 3
├── enricher.ts           # enrichWithHotelEstimate() — static JSON lookup
└── cache.ts              # weekKey(), hasCachedDeals(), saveDealsToCache()

data/
└── hotel-estimates.json  # Static lookup: IATA code → avg nightly EUR
```

### Pattern 1: Week Key Generation
**What:** Derive a deterministic string key for the current ISO week, e.g. `"2026-W09"`, used as idempotency key in `deals_cache`.
**When to use:** At pipeline start; also used to check whether cache already has results for this week.

```typescript
// Source: date-fns docs (date-fns.org)
import { getISOWeek, getISOWeekYear } from 'date-fns'

export function weekKey(date: Date = new Date()): string {
  const year = getISOWeekYear(date)
  const week = getISOWeek(date).toString().padStart(2, '0')
  return `${year}-W${week}`
}
// Produces: "2026-W09"
```

### Pattern 2: Weekend Date Window Calculation
**What:** Given "this Thursday", compute the next Friday departure and Sunday/Monday return dates to pass to `date_from/date_to/return_from/return_to`.
**When to use:** Inside `fetchWeekendFlights()` before building the Tequila query.

```typescript
// Source: date-fns docs (date-fns.org) — addDays
import { addDays, format } from 'date-fns'

// Called on Thursday; next Friday = +1 day, Sunday = +3 days
export function getWeekendWindow(thursday: Date = new Date()) {
  const friday = addDays(thursday, 1)
  const sunday = addDays(thursday, 3)
  // Tequila date format: DD/MM/YYYY
  return {
    date_from: format(friday, 'dd/MM/yyyy'),
    date_to: format(friday, 'dd/MM/yyyy'),     // depart only on Friday
    return_from: format(sunday, 'dd/MM/yyyy'),
    return_to: format(sunday, 'dd/MM/yyyy'),   // return only on Sunday
  }
}
```

**Note:** `nights_in_dst_from: 2` / `nights_in_dst_to: 3` provides the stay-length window, while the date range window controls which Fridays are eligible. Setting both `date_from=date_to` and `return_from=return_to` to a single Friday/Sunday pins to one specific weekend.

### Pattern 3: Tequila v2/search Request
**What:** Perform the live flight search using native fetch with `apikey` header.
**When to use:** Inside `fetcher.ts`, after confirming no cached deals for the week.

```typescript
// Source: Community-verified against official endpoint https://tequila-api.kiwi.com/v2/search
// Auth: header { apikey: KIWI_API_KEY }

interface TequilaFlight {
  id: string
  price: number
  cityTo: string
  cityCodeTo: string   // IATA of destination city
  flyTo: string        // IATA of destination airport
  countryTo: { name: string; code: string }
  local_departure: string  // ISO timestamp
  local_arrival: string
  deep_link: string        // booking URL — use this as booking_url
  route: Array<{
    flyFrom: string
    flyTo: string
    cityFrom: string
    cityTo: string
    local_departure: string
    local_arrival: string
  }>
}

interface TequilaResponse {
  data: TequilaFlight[]
  _results: number
}

export async function fetchWeekendFlights(apiKey: string): Promise<TequilaFlight[]> {
  const window = getWeekendWindow()
  const params = new URLSearchParams({
    fly_from: 'ZAG',
    date_from: window.date_from,
    date_to: window.date_to,
    return_from: window.return_from,
    return_to: window.return_to,
    nights_in_dst_from: '2',
    nights_in_dst_to: '3',
    flight_type: 'round',
    curr: 'EUR',
    sort: 'price',
    asc: '1',
    limit: '20',
    max_stopovers: '2',
  })

  const url = `https://tequila-api.kiwi.com/v2/search?${params}`
  const res = await fetch(url, {
    headers: { apikey: apiKey },
  })

  if (!res.ok) {
    throw new Error(`Tequila API error: ${res.status} ${res.statusText}`)
  }

  const json = (await res.json()) as TequilaResponse
  return json.data ?? []
}
```

### Pattern 4: Deal Selection (Top 3 Cheapest)
**What:** Sort ascending by price, take first 3, filtering out duplicates to same destination.
**When to use:** `selector.ts`, after `fetchWeekendFlights()` returns results.

```typescript
export interface Deal {
  destination_iata: string
  destination_name: string
  price_eur: number
  depart_at: string        // ISO
  return_at: string        // ISO
  booking_url: string
}

export function selectTopDeals(flights: TequilaFlight[], count = 3): Deal[] {
  // API already returns price-sorted, but re-sort defensively
  const sorted = [...flights].sort((a, b) => a.price - b.price)

  const seen = new Set<string>()
  const selected: Deal[] = []

  for (const f of sorted) {
    if (selected.length >= count) break
    if (seen.has(f.flyTo)) continue   // deduplicate same destination
    seen.add(f.flyTo)

    selected.push({
      destination_iata: f.flyTo,
      destination_name: f.cityTo,
      price_eur: f.price,
      depart_at: f.local_departure,
      return_at: f.route[f.route.length - 1]?.local_departure ?? f.local_arrival,
      booking_url: f.deep_link,
    })
  }

  return selected
}
```

### Pattern 5: Hotel Estimate Enrichment (Static JSON Lookup)
**What:** Read a bundled JSON file mapping destination IATA code to average nightly EUR estimate; fall back to a default if not found.
**When to use:** After `selectTopDeals()`.

```typescript
// data/hotel-estimates.json — committed to repo
// { "LHR": 120, "BCN": 90, "VIE": 95, ... }

import estimates from '../data/hotel-estimates.json'

export function enrichWithHotelEstimate(deals: Deal[]): EnrichedDeal[] {
  return deals.map(deal => ({
    ...deal,
    hotel_estimate_eur: (estimates as Record<string, number>)[deal.destination_iata] ?? 80,
  }))
}
```

### Pattern 6: Supabase Idempotent Cache Write
**What:** Check if `deals_cache` already has rows for this week_key before writing; if yes, skip API call entirely. On write, upsert with `onConflict` to handle race conditions.
**When to use:** `cache.ts`, called from `main()` in `index.ts`.

```typescript
// Source: Supabase JS docs — https://supabase.com/docs/reference/javascript/upsert
import { supabase } from '../lib/db'

export async function hasCachedDeals(weekKey: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('deals_cache')
    .select('id')
    .eq('week_key', weekKey)
    .limit(1)

  if (error) throw error
  return (data?.length ?? 0) > 0
}

export async function saveDealsToCache(weekKey: string, deals: EnrichedDeal[]): Promise<void> {
  const rows = deals.map((deal, i) => ({
    week_key: weekKey,
    rank: i + 1,
    destination_iata: deal.destination_iata,
    destination_name: deal.destination_name,
    flight_price: deal.price_eur,
    currency: 'EUR',
    depart_at: deal.depart_at,
    return_at: deal.return_at,
    booking_url: deal.booking_url,
    hotel_estimate: deal.hotel_estimate_eur ?? null,
    observed_at: new Date().toISOString(),
  }))

  const { error } = await supabase
    .from('deals_cache')
    .upsert(rows, { onConflict: 'week_key,rank', ignoreDuplicates: true })

  if (error) throw error
}
```

**Critical schema note:** The `deals_cache` table has `UNIQUE(week_key, rank)` — this is already in `supabase/schema.sql`. This constraint is what makes `.upsert({ onConflict: 'week_key,rank' })` work correctly.

### Pattern 7: Pipeline Orchestrator (main())
**What:** Top-level flow in `pipeline/index.ts` — week key, cache check, fetch, select, enrich, save.

```typescript
// pipeline/index.ts
async function main() {
  // 1. Load env (copy pattern from scripts/verify-db.ts)
  loadEnv()

  const key = weekKey()
  console.log(`Pipeline running for week: ${key}`)

  // 2. Idempotency guard
  if (await hasCachedDeals(key)) {
    console.log(`Deals already cached for ${key}. Exiting.`)
    return
  }

  // 3. Fetch
  const flights = await fetchWeekendFlights(process.env.KIWI_API_KEY!)
  if (flights.length === 0) {
    console.log('No qualifying flights found for this week. Exiting cleanly.')
    return   // PIPE-04: zero-results fallback — no throw, no error
  }

  // 4. Select + Enrich
  const deals = enrichWithHotelEstimate(selectTopDeals(flights))

  // 5. Persist
  await saveDealsToCache(key, deals)
  console.log(`Cached ${deals.length} deals for ${key}.`)
}
```

### Anti-Patterns to Avoid

- **Calling Tequila without the week_key guard:** If the guard is missing and the cron fires twice (GitHub Actions does this under load), you'll double-call the API and potentially overwrite a valid cache row. Always check `hasCachedDeals()` first.
- **Using `insert` instead of `upsert`:** A plain insert will throw a unique constraint violation if deals were already written this week. Use `.upsert()` with `ignoreDuplicates: true`.
- **Accessing `data[0]` without length check:** If the Tequila API returns zero results, `data` is an empty array. Always check `flights.length === 0` before proceeding.
- **Hardcoding flight_type without return dates:** Setting `flight_type: 'round'` without providing `return_from`/`return_to` causes the API to return no results. Both are required for round trips.
- **Storing booking_url from deep_link without validation:** The `deep_link` field is the canonical booking URL in Tequila responses. It is always present on search results. Do not attempt to construct it manually.
- **Using `.env` instead of `.env.local`:** The project pattern (established in `scripts/verify-db.ts`) reads `.env.local`. Replicate this pattern exactly in `pipeline/index.ts`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| ISO week number calculation | Custom week arithmetic | `date-fns` `getISOWeek` + `getISOWeekYear` | ISO 8601 week edge cases at year boundaries are non-trivial |
| Date formatting for Tequila API | `toLocaleDateString` or manual string concat | `date-fns` `format(date, 'dd/MM/yyyy')` | Zero-padding, locale-safety, tested |
| Idempotency via database | Custom week lock table | Supabase upsert with `onConflict` on existing `UNIQUE(week_key, rank)` | Already modelled in the schema; one line |
| HTTP client with query params | Manual URL string building | `new URLSearchParams()` + native fetch | Handles encoding, clean API |
| Hotel cost data | Live hotel API | Static `hotel-estimates.json` JSON lookup | PIPE-03 explicitly calls for "static JSON lookup file" — don't over-engineer |

**Key insight:** The idempotency problem is already solved at the schema level with `UNIQUE(week_key, rank)`. The pipeline just needs to use `.upsert()` correctly — there is no need for a separate lock table or Redis-style locking.

---

## Common Pitfalls

### Pitfall 1: Tequila API Date Format (DD/MM/YYYY not YYYY-MM-DD)
**What goes wrong:** Passing ISO dates (`2026-03-06`) returns HTTP 400 or empty results.
**Why it happens:** The Tequila API uses `DD/MM/YYYY` format, not ISO 8601.
**How to avoid:** Always use `format(date, 'dd/MM/yyyy')` from date-fns for all date parameters.
**Warning signs:** API returns HTTP 400 or `_results: 0` with no error message.

### Pitfall 2: Missing return_from/return_to with flight_type=round
**What goes wrong:** Zero results despite flights existing.
**Why it happens:** `flight_type=round` requires explicit return date parameters. Without them the API doesn't know when to search for the return leg.
**How to avoid:** Always set `return_from` and `return_to` alongside `date_from` / `date_to`.
**Warning signs:** API returns 200 with empty `data` array.

### Pitfall 3: data[] Empty = Not an Error
**What goes wrong:** `data[0]` throws `TypeError: Cannot read properties of undefined` when API returns zero results.
**Why it happens:** Developers assume the API always returns at least one result.
**How to avoid:** Check `if (flights.length === 0)` explicitly before any array access. The pipeline exit path (PIPE-04) must be a clean `return`, not a throw.
**Warning signs:** Unhandled promise rejection in pipeline, process exits with code 1.

### Pitfall 4: ts-node Can't Resolve lib/db.ts Path Aliases
**What goes wrong:** `Cannot find module '@/lib/db'` when importing from the pipeline.
**Why it happens:** The root `tsconfig.json` defines `paths: { "@/*": ["./*"] }` for Next.js, but `pipeline/tsconfig.json` uses `moduleResolution: node` which doesn't process path aliases by default.
**How to avoid:** Import `lib/db` using a relative path (`../lib/db`) from within `pipeline/`, not via the `@/` alias.
**Warning signs:** ts-node compile error referencing module resolution; works in Next.js but not in pipeline.

### Pitfall 5: week_key Mismatch Between Pipeline and Schema
**What goes wrong:** `hasCachedDeals()` always returns false even after rows exist.
**Why it happens:** The week key format must match exactly. Schema comment says `'YYYY-WNN'` (e.g. `'2026-W08'`) — the `W` must be capital and the week number must be zero-padded to 2 digits.
**How to avoid:** Use `padStart(2, '0')` when constructing the week number string. Write a unit test for `weekKey()` covering week 1 and week 8.
**Warning signs:** Pipeline runs successfully every time but cache table stays empty (or builds duplicate rows).

### Pitfall 6: Supabase onConflict Requires Matching Column Names
**What goes wrong:** Upsert throws `"there is no unique or exclusion constraint matching the ON CONFLICT specification"`.
**Why it happens:** The `onConflict` value must exactly match the column names in the Postgres `UNIQUE` constraint. The schema defines `UNIQUE(week_key, rank)` — the `onConflict` string must be `'week_key,rank'` (no spaces).
**How to avoid:** Compare the `.upsert({ onConflict: '...' })` value against the actual constraint in `supabase/schema.sql`.
**Warning signs:** Supabase returns a PostgreSQL error at runtime, not a compile error.

### Pitfall 7: Tequila API Rate Limits / ToS Caching Requirements (UNVERIFIED)
**What goes wrong:** ToS may restrict caching results for longer than a defined window (e.g., 24 hours) or mandate attribution.
**Why it happens:** The official portal requires authentication to view full ToS; rate limits are not publicly documented.
**How to avoid:** Confirm with the actual Kiwi Tequila portal once you have API key access. The week-level cache (7 days) likely exceeds the permitted cache window — **validate before shipping**.
**Warning signs:** API key suspended; legal notice from Kiwi.

---

## Code Examples

### Loading .env.local in ts-node (established project pattern)
```typescript
// Source: scripts/verify-db.ts in this codebase
import * as fs from 'fs'
import * as path from 'path'

function loadEnv() {
  const envPath = path.resolve(__dirname, '../.env.local')
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
      const match = line.match(/^([^#=\s]+)\s*=\s*(.*)$/)
      if (match) process.env[match[1]] = match[2].trim()
    }
  }
}
```

### Building Tequila Query String with URLSearchParams
```typescript
// Source: MDN URLSearchParams (built-in Node 18+)
const params = new URLSearchParams({
  fly_from: 'ZAG',
  date_from: '07/03/2026',
  date_to: '07/03/2026',
  return_from: '08/03/2026',
  return_to: '08/03/2026',
  nights_in_dst_from: '2',
  nights_in_dst_to: '3',
  flight_type: 'round',
  curr: 'EUR',
  sort: 'price',
  asc: '1',
  limit: '20',
  max_stopovers: '2',
})
// Result: fly_from=ZAG&date_from=07%2F03%2F2026&...
```

### Supabase Select Check for Existing Cache
```typescript
// Source: Supabase JS docs — https://supabase.com/docs/reference/javascript/select
const { data, error } = await supabase
  .from('deals_cache')
  .select('id')
  .eq('week_key', '2026-W09')
  .limit(1)
// data.length === 0 → no cache, run pipeline
// data.length > 0  → already cached, skip
```

### Supabase Upsert with Conflict Guard
```typescript
// Source: Supabase JS docs — https://supabase.com/docs/reference/javascript/upsert
const { error } = await supabase
  .from('deals_cache')
  .upsert(rows, { onConflict: 'week_key,rank', ignoreDuplicates: true })
// ignoreDuplicates: true → silently skip if row already exists
// ignoreDuplicates: false → update existing row (not desired here)
```

### date-fns ISO Week Key (verified against library docs)
```typescript
// Source: date-fns docs (https://date-fns.org)
import { getISOWeek, getISOWeekYear } from 'date-fns'

function weekKey(d: Date = new Date()): string {
  return `${getISOWeekYear(d)}-W${getISOWeek(d).toString().padStart(2, '0')}`
}
// new Date('2026-02-24') → "2026-W09"
// new Date('2026-01-01') → "2026-W01"  (note: getISOWeekYear handles year boundary)
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `node-fetch` npm package | Native `fetch` in Node 18+ | Node 18 (2022) | Remove dependency entirely |
| Moment.js for date math | `date-fns` per-function imports | ~2019 onwards | Tree-shakeable, typed, maintained |
| Global `process.env` only | `.env.local` manual load in ts-node | N/A (ts-node doesn't auto-load) | Must replicate verify-db.ts pattern |
| Supabase `insert` with manual try/catch on unique violation | `.upsert()` with `onConflict` + `ignoreDuplicates` | supabase-js v2 | Idiomatic, one-liner idempotency |

**Deprecated/outdated:**
- `node-fetch`: No longer needed in Node 18+. The project runs Node 20 (inferred from `@types/node: ^20`).
- Moment.js: Not in this project, but worth noting — use `date-fns` exclusively.

---

## Open Questions

1. **Kiwi Tequila API cache window in ToS**
   - What we know: The API is gated behind auth; community sources confirm live search works as documented; no rate limits were publicly verifiable.
   - What's unclear: Whether caching results for a full week (7 days) is permitted under the ToS; whether there are per-day/per-hour request limits for free tier.
   - Recommendation: Log into tequila.kiwi.com with the project's API key before building the fetcher, read the ToS/rate limit docs, and add a comment in `fetcher.ts` noting the permitted cache window. If 7-day caching is not permitted, the pipeline will need to re-fetch but still use `ignoreDuplicates: true` to avoid duplicate email sends.

2. **`fly_to` — any restriction or open-ended?**
   - What we know: Omitting `fly_to` or setting it to `'anywhere'` allows the API to return flights to all destinations from ZAG. This is the correct mode for "cheapest flights from Zagreb".
   - What's unclear: Whether the free tier allows open-destination searches, and what the typical result count is for ZAG on a Friday.
   - Recommendation: Test with a manual API call after key registration; if result count is very high, reduce `limit` to `20`. If result count is 0, the fetcher should log the raw API params for debugging.

3. **`return_at` field mapping from Tequila response**
   - What we know: The `local_arrival` field on the top-level flight object is the arrival time of the outbound leg. The return leg's departure time is in `route[last].local_departure`.
   - What's unclear: Whether `route` always contains exactly 2 legs for `flight_type=round`, or can have more (with stopovers).
   - Recommendation: Use `route[route.length - 1].local_departure` as `return_at` (last leg's departure = start of return journey). Add defensive check for `route.length >= 2`.

4. **Hotel estimates coverage for ZAG-reachable destinations**
   - What we know: PIPE-03 specifies a "static JSON lookup file" — this file needs to be created as part of Phase 3 implementation.
   - What's unclear: Which destinations ZAG commonly routes to; what a reasonable fallback EUR nightly estimate should be.
   - Recommendation: Seed the JSON file with 30–50 common European short-break destinations reachable from ZAG (Vienna, Budapest, London, Amsterdam, Barcelona, Rome, Prague, Warsaw, etc.) with approximate nightly hotel estimates (range €60–€150). Default fallback of €80/night for unknown destinations.

---

## Sources

### Primary (HIGH confidence)
- `@supabase/supabase-js` docs — https://supabase.com/docs/reference/javascript/upsert — upsert, onConflict, ignoreDuplicates API
- `date-fns` library — https://date-fns.org — getISOWeek, getISOWeekYear, format, addDays
- Project codebase — `supabase/schema.sql`, `lib/db.ts`, `pipeline/tsconfig.json`, `scripts/verify-db.ts` — direct read

### Secondary (MEDIUM confidence)
- DeepWiki analysis of `kiwi-tequila-api-js` SDK — https://deepwiki.com/omnichronous/kiwi-tequila-api-js — TypeScript interface shapes, SearchFlight fields, request serialization pattern
- GitHub gist (TheMuellenator) — https://gist.github.com/TheMuellenator/4d730d38818d935a9ce4ad9d7a817138 — Python reference implementation showing `nights_in_dst_from`, `curr`, `max_stopovers`, response parsing
- LogRocket axios-vs-fetch 2025 — https://blog.logrocket.com/axios-vs-fetch-2025/ — confirmed native fetch in Node 18+

### Tertiary (LOW confidence — flag for validation)
- WebSearch aggregate: Tequila sort=price, asc=1 parameter names — multiple community sources agree, not from official portal docs (portal requires auth login to view)
- WebSearch aggregate: `deep_link` field as booking URL — consistent across multiple community implementations, but not directly verified against official docs
- Tequila API rate limits / ToS caching window — **not found** in any public source; must be verified after key registration

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — native fetch, supabase-js, date-fns all verified via official docs/codebase
- Architecture patterns: HIGH — based on actual schema, established project conventions, and Supabase JS docs
- Kiwi Tequila API shape: MEDIUM — confirmed via TypeScript SDK analysis and multiple community implementations; official portal docs not accessible without auth
- Pitfalls: MEDIUM-HIGH — most derived from direct schema analysis + library docs; Pitfall 7 (ToS) is LOW

**Research date:** 2026-02-24
**Valid until:** 2026-03-24 (stable libraries); Tequila API shape — re-verify after first live test call
