/**
 * Deal Selector — pick the top N cheapest unique-destination flights.
 *
 * NOTE: TequilaFlight is defined here for autonomous compilation (Plan 02 runs
 * in parallel with Plan 01 which creates fetcher.ts). Plan 03 (orchestrator)
 * will consolidate the type — selector.ts will be updated to import from
 * './fetcher' once fetcher.ts exists.
 */

export interface TequilaFlight {
  id: string
  price: number
  cityTo: string
  cityCodeTo: string
  flyTo: string
  countryTo: { name: string; code: string }
  local_departure: string
  local_arrival: string
  deep_link: string
  route: Array<{
    flyFrom: string
    flyTo: string
    cityFrom: string
    cityTo: string
    local_departure: string
    local_arrival: string
  }>
}

export interface Deal {
  destination_iata: string
  destination_name: string
  price_eur: number
  depart_at: string
  return_at: string
  booking_url: string
}

/**
 * Select the top `count` cheapest flights with unique destination IATA codes.
 *
 * - Re-sorts by price ascending (defensive — API claims to sort but don't trust it).
 * - Deduplicates by `flyTo` — only the cheapest flight to each destination is kept.
 * - Returns fewer than `count` items when fewer unique destinations exist (not an error).
 * - `return_at` is derived from the LAST route leg's `local_departure` (start of the
 *   return journey), NOT the top-level `local_arrival` (outbound arrival only).
 */
export function selectTopDeals(flights: TequilaFlight[], count = 3): Deal[] {
  const sorted = [...flights].sort((a, b) => a.price - b.price)

  const seen = new Set<string>()
  const selected: Deal[] = []

  for (const f of sorted) {
    if (selected.length >= count) break
    if (seen.has(f.flyTo)) continue

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
