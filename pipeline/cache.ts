import { getISOWeek, getISOWeekYear } from 'date-fns'
import { supabase } from '../lib/db'

/**
 * Shape of an enriched deal as it flows from selector+enricher into the cache.
 */
export interface EnrichedDeal {
  destination_iata: string
  destination_name: string
  price_eur: number
  depart_at: string
  return_at: string
  booking_url: string
  hotel_estimate_eur: number | null
}

/**
 * Produces an ISO week key string in 'YYYY-WNN' format (e.g. '2026-W09').
 * Week number is zero-padded to 2 digits.
 *
 * @param date - Reference date (defaults to today)
 */
export function weekKey(date?: Date): string {
  const d = date ?? new Date()
  const week = getISOWeek(d).toString().padStart(2, '0')
  const year = getISOWeekYear(d)
  return `${year}-W${week}`
}

/**
 * Returns true if the deals_cache table already has rows for the given week_key.
 * Throws on database error.
 *
 * @param wk - Week key in 'YYYY-WNN' format
 */
export async function hasCachedDeals(wk: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('deals_cache')
    .select('id')
    .eq('week_key', wk)
    .limit(1)

  if (error) throw error

  return (data?.length ?? 0) > 0
}

/**
 * Upserts enriched deals into the deals_cache table with idempotency.
 * Maps interface field names to actual DB column names:
 *   price_eur -> flight_price
 *   hotel_estimate_eur -> hotel_estimate
 *
 * @param wk - Week key in 'YYYY-WNN' format
 * @param deals - Array of enriched deals to persist
 */
export async function saveDealsToCache(
  wk: string,
  deals: EnrichedDeal[],
): Promise<void> {
  const rows = deals.map((deal, i) => ({
    week_key: wk,
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
