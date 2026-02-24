/**
 * Weekend Getaways — weekly pipeline
 *
 * Runs on GitHub Actions every Thursday at 06:00 UTC.
 * Steps: fetch deals → select top 3 → enrich with hotel estimate → compose email → send to subscribers
 *
 * Run manually: npx ts-node --project pipeline/tsconfig.json pipeline/index.ts
 */
import * as fs from 'fs'
import * as path from 'path'

// ── Load .env.local BEFORE requiring pipeline modules ──────────────────────
// cache.ts imports lib/db.ts which creates the Supabase client at require()
// time using process.env vars. Env must be set before that require() runs.
// Using inline module-level code (not import declarations) so TypeScript
// cannot hoist this above the env loading step.
const envPath = path.resolve(__dirname, '../.env.local')
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const match = line.match(/^([^#=\s]+)\s*=\s*(.*)$/)
    if (match) process.env[match[1]] = match[2].trim()
  }
}

// ── Pipeline modules (required after env is loaded) ─────────────────────────
// require() calls are NOT hoisted by TypeScript — unlike import declarations.
// This guarantees process.env is populated before lib/db.ts creates the
// Supabase client.
/* eslint-disable @typescript-eslint/no-require-imports */
const { weekKey, hasCachedDeals, saveDealsToCache } =
  require('./cache') as typeof import('./cache')
const { fetchWeekendFlights } =
  require('./fetcher') as typeof import('./fetcher')
const { selectTopDeals } =
  require('./selector') as typeof import('./selector')
const { enrichWithHotelEstimate } =
  require('./enricher') as typeof import('./enricher')
/* eslint-enable @typescript-eslint/no-require-imports */

async function main() {
  const apiKey = process.env.KIWI_API_KEY
  if (!apiKey) {
    throw new Error('KIWI_API_KEY is not set — add it to .env.local')
  }

  const key = weekKey()
  console.log(`Pipeline running for week: ${key}`)

  // ── Idempotency guard ────────────────────────────────────────────────────
  if (await hasCachedDeals(key)) {
    console.log(`Deals already cached for ${key}. Exiting.`)
    return
  }

  // ── Fetch ────────────────────────────────────────────────────────────────
  const flights = await fetchWeekendFlights(apiKey)

  // ── Zero-results fallback (PIPE-04) ─────────────────────────────────────
  if (flights.length === 0) {
    console.log('No qualifying flights found this weekend. Exiting cleanly.')
    return
  }

  // ── Select → Enrich → Persist ────────────────────────────────────────────
  const deals = selectTopDeals(flights)
  const enriched = enrichWithHotelEstimate(deals)

  await saveDealsToCache(key, enriched)

  console.log(`Cached ${enriched.length} deal(s) for ${key}:`)
  for (const d of enriched) {
    console.log(
      `  ${d.destination_name} (${d.destination_iata}) — €${d.price_eur} flight + ~€${d.hotel_estimate_eur ?? 80}/night hotel`,
    )
  }
}

main().catch((err) => {
  console.error('Pipeline failed:', err)
  process.exit(1)
})
