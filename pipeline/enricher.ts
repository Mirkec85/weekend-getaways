/**
 * Hotel Estimate Enricher — add nightly hotel cost estimates to selected deals.
 *
 * Uses a static JSON lookup file (data/hotel-estimates.json) mapping IATA airport
 * codes to average EUR/night hotel costs. Defaults to €80/night for unknown codes.
 *
 * NOTE: EnrichedDeal is declared here as the canonical source. cache.ts (Plan 01)
 * also declares this type — the orchestrator (Plan 03) will update cache.ts to
 * import from here instead of maintaining its own copy.
 */

import { Deal } from './selector'

export type EnrichedDeal = Deal & {
  hotel_estimate_eur: number | null
}

/**
 * Enrich each deal with a static hotel cost estimate for its destination.
 *
 * Loads the hotel estimates lookup at call time via require() (CommonJS-safe,
 * no ES import of JSON needed — avoids resolveJsonModule concerns).
 *
 * Falls back to €80/night for any IATA code not present in the lookup file.
 */
export function enrichWithHotelEstimate(deals: Deal[]): EnrichedDeal[] {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const estimates: Record<string, number> = require('../../data/hotel-estimates.json')

  return deals.map((deal) => ({
    ...deal,
    hotel_estimate_eur: estimates[deal.destination_iata] ?? 80,
  }))
}
