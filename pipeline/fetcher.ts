import { addDays, format } from 'date-fns'

/**
 * Typed shape of a single flight result from Tequila v2/search.
 */
export interface TequilaFlight {
  id: string
  price: number
  cityTo: string
  cityCodeTo: string
  flyTo: string
  countryTo: {
    name: string
    code: string
  }
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

/**
 * Top-level response shape from Tequila v2/search.
 */
export interface TequilaResponse {
  data: TequilaFlight[]
  _results: number
}

/**
 * Computes the next Friday (thursday + 1 day) and Sunday (thursday + 3 days).
 * All dates formatted as DD/MM/YYYY as required by the Tequila API.
 *
 * @param thursday - Reference date (defaults to today). Expected to be a Thursday.
 * @returns date_from, date_to (Friday), return_from, return_to (Sunday)
 */
export function getWeekendWindow(thursday?: Date): {
  date_from: string
  date_to: string
  return_from: string
  return_to: string
} {
  const base = thursday ?? new Date()
  const friday = addDays(base, 1)
  const sunday = addDays(base, 3)

  const fridayStr = format(friday, 'dd/MM/yyyy')
  const sundayStr = format(sunday, 'dd/MM/yyyy')

  return {
    date_from: fridayStr,
    date_to: fridayStr,
    return_from: sundayStr,
    return_to: sundayStr,
  }
}

/**
 * Fetches weekend flights from Zagreb (ZAG) via the Kiwi Tequila v2/search API.
 *
 * @param apiKey - Tequila API key (sent via `apikey` header)
 * @param today - Optional reference date for computing the weekend window (enables testing)
 * @returns Array of TequilaFlight results, or empty array if none
 */
export async function fetchWeekendFlights(
  apiKey: string,
  today?: Date,
): Promise<TequilaFlight[]> {
  const window = getWeekendWindow(today)

  const params = new URLSearchParams({
    fly_from: 'ZAG',
    flight_type: 'round',
    nights_in_dst_from: '2',
    nights_in_dst_to: '3',
    curr: 'EUR',
    sort: 'price',
    asc: '1',
    limit: '20',
    max_stopovers: '2',
    date_from: window.date_from,
    date_to: window.date_to,
    return_from: window.return_from,
    return_to: window.return_to,
  })

  const res = await fetch(`https://tequila-api.kiwi.com/v2/search?${params}`, {
    headers: { apikey: apiKey },
  })

  if (!res.ok) {
    throw new Error(`Tequila API error: ${res.status} ${res.statusText}`)
  }

  const json = (await res.json()) as TequilaResponse
  return json.data ?? []
}
