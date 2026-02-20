/**
 * Weekend Getaways — weekly pipeline
 *
 * Runs on GitHub Actions every Thursday at 06:00 UTC.
 * Steps: fetch deals → select top 3 → enrich with hotel estimate → compose email → send to subscribers
 */

async function main() {
  console.log('Pipeline starting...')
  // TODO: Phase 3 — implement flight fetcher, deal selector, hotel estimator
  // TODO: Phase 4 — implement email composer and sender
  console.log('Pipeline complete.')
}

main().catch((err) => {
  console.error('Pipeline failed:', err)
  process.exit(1)
})
