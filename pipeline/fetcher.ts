import { addDays, format } from 'date-fns'

// ── Destination list ─────────────────────────────────────────────────────────
// Predefined European weekend destinations reachable from Zagreb (ZAG).
// Add or remove IATA codes here to change what the pipeline searches.
const DESTINATIONS: Record<string, string> = {
  VIE: 'Vienna',
  BUD: 'Budapest',
  PRG: 'Prague',
  WAW: 'Warsaw',
  KRK: 'Kraków',
  BCN: 'Barcelona',
  MAD: 'Madrid',
  FCO: 'Rome',
  MXP: 'Milan',
  AMS: 'Amsterdam',
  BRU: 'Brussels',
  LIS: 'Lisbon',
  ATH: 'Athens',
  BER: 'Berlin',
  MUC: 'Munich',
  CDG: 'Paris',
  LGW: 'London',
  CPH: 'Copenhagen',
  SOF: 'Sofia',
  BEG: 'Belgrade',
  LJU: 'Ljubljana',
  BTS: 'Bratislava',
  OTP: 'Bucharest',
  SKP: 'Skopje',
  TIA: 'Tirana',
  DBV: 'Dubrovnik',
  SPU: 'Split',
  VCE: 'Venice',
  NAP: 'Naples',
  SKG: 'Thessaloniki',
}

// ── Base URL ─────────────────────────────────────────────────────────────────
// New Amadeus accounts use the test environment by default.
// Switch to 'https://api.amadeus.com' after requesting production access.
const AMADEUS_BASE = 'https://test.api.amadeus.com'

// ── Types ────────────────────────────────────────────────────────────────────

/**
 * Normalised flight result — same shape as the old TequilaFlight so that
 * selector.ts requires zero changes.
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

// ── Auth ─────────────────────────────────────────────────────────────────────

async function getAmadeusToken(clientId: string, clientSecret: string): Promise<string> {
  const res = await fetch(`${AMADEUS_BASE}/v1/security/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }).toString(),
  })
  if (!res.ok) {
    throw new Error(`Amadeus auth failed: ${res.status} ${res.statusText}`)
  }
  const json = await res.json()
  return json.access_token as string
}

// ── Weekend window ───────────────────────────────────────────────────────────

export function getWeekendWindow(thursday?: Date): {
  departureDate: string
  returnDate: string
} {
  const base = thursday ?? new Date()
  const friday = addDays(base, 1)
  const sunday = addDays(base, 3)
  return {
    departureDate: format(friday, 'yyyy-MM-dd'),
    returnDate: format(sunday, 'yyyy-MM-dd'),
  }
}

// ── Single destination search ────────────────────────────────────────────────

async function fetchFlightOffer(
  token: string,
  iata: string,
  cityName: string,
  departureDate: string,
  returnDate: string,
): Promise<TequilaFlight | null> {
  const params = new URLSearchParams({
    originLocationCode: 'ZAG',
    destinationLocationCode: iata,
    departureDate,
    returnDate,
    adults: '1',
    max: '1',
    currencyCode: 'EUR',
    travelClass: 'ECONOMY',
  })

  let res: Response
  try {
    res = await fetch(`${AMADEUS_BASE}/v2/shopping/flight-offers?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  } catch {
    return null
  }

  if (!res.ok) return null

  const json = await res.json()
  const offer = json.data?.[0]
  if (!offer) return null

  const outbound = offer.itineraries?.[0]
  const inbound = offer.itineraries?.[1]
  if (!outbound || !inbound) return null

  const firstSeg = outbound.segments[0]
  const lastReturnSeg = inbound.segments[inbound.segments.length - 1]
  if (!firstSeg || !lastReturnSeg) return null

  const countryCode =
    (json.dictionaries?.locations?.[iata]?.countryCode as string | undefined) ?? ''

  // Kayak round-trip deep link — reliable, no API key needed
  const bookingUrl = `https://www.kayak.com/flights/ZAG-${iata}/${departureDate}/${returnDate}`

  return {
    id: offer.id as string,
    price: parseFloat(offer.price.total),
    flyTo: iata,
    cityCodeTo: iata,
    cityTo: cityName,
    countryTo: { name: '', code: countryCode },
    local_departure: firstSeg.departure.at as string,
    local_arrival: firstSeg.arrival.at as string,
    deep_link: bookingUrl,
    route: [
      {
        flyFrom: 'ZAG',
        flyTo: iata,
        cityFrom: 'Zagreb',
        cityTo: cityName,
        local_departure: firstSeg.departure.at as string,
        local_arrival: firstSeg.arrival.at as string,
      },
      {
        flyFrom: iata,
        flyTo: 'ZAG',
        cityFrom: cityName,
        cityTo: 'Zagreb',
        local_departure: lastReturnSeg.departure.at as string,
        local_arrival: lastReturnSeg.arrival.at as string,
      },
    ],
  }
}

// ── Main export ──────────────────────────────────────────────────────────────

/**
 * Fetch the cheapest round-trip weekend flights from Zagreb to a predefined
 * list of European destinations using the Amadeus Flight Offers Search API.
 *
 * Searches all destinations in parallel and returns every result that has
 * available flights. The caller (selector.ts) picks the top 3 by price.
 */
export async function fetchWeekendFlights(
  clientId: string,
  clientSecret: string,
  today?: Date,
): Promise<TequilaFlight[]> {
  const token = await getAmadeusToken(clientId, clientSecret)
  const { departureDate, returnDate } = getWeekendWindow(today)

  const results = await Promise.all(
    Object.entries(DESTINATIONS).map(([iata, cityName]) =>
      fetchFlightOffer(token, iata, cityName, departureDate, returnDate),
    ),
  )

  return results.filter((f): f is TequilaFlight => f !== null)
}
