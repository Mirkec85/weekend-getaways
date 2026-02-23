/**
 * Verifies that all 3 tables are reachable via lib/db.ts.
 * Run: npm run verify:db
 */
import { createClient } from '@supabase/supabase-js'

// Load .env.local manually (Node 20 supports --env-file but ts-node doesn't forward it easily)
import * as fs from 'fs'
import * as path from 'path'

const envPath = path.resolve(__dirname, '../.env.local')
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const match = line.match(/^([^#=\s]+)\s*=\s*(.*)$/)
    if (match) process.env[match[1]] = match[2].trim()
  }
}

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const TABLES = ['subscribers', 'deals_cache', 'send_log'] as const

async function main() {
  console.log(`Connecting to ${url}\n`)
  let allOk = true

  for (const table of TABLES) {
    const { error } = await supabase.from(table).select('id').limit(0)
    if (error) {
      console.error(`  ✗  ${table} — ${error.message}`)
      allOk = false
    } else {
      console.log(`  ✓  ${table}`)
    }
  }

  console.log()
  if (!allOk) {
    console.error('One or more tables not reachable. Check schema was applied.')
    process.exit(1)
  }
  console.log('All 3 tables reachable. DB verified.')
}

main()
