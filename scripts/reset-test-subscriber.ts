/**
 * Resets mirkomartic1@gmail.com back to active for unsubscribe flow testing.
 * Run: npm run reset:subscriber
 */
import * as fs from 'fs'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'

const envPath = path.resolve(__dirname, '../.env.local')
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const match = line.match(/^([^#=\s]+)\s*=\s*(.*)$/)
    if (match) process.env[match[1]] = match[2].trim()
  }
}

const url = process.env.SUPABASE_URL!
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })

async function main() {
  const email = 'mirkomartic1@gmail.com'

  const { data, error } = await supabase
    .from('subscribers')
    .update({ status: 'active', confirmed_at: new Date().toISOString(), unsubscribed_at: null })
    .eq('email', email)
    .select('unsubscribe_token, status')
    .single()

  if (error || !data) {
    console.error('No subscriber found or DB error:', error?.message)
    process.exit(1)
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  console.log(`Reset to: ${data.status}`)
  console.log(`\nUnsubscribe URL (click or paste in browser):`)
  console.log(`${appUrl}/api/unsubscribe?token=${data.unsubscribe_token}`)
}

main()
