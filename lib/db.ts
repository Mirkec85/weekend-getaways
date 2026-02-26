import { createClient } from '@supabase/supabase-js'

type Client = ReturnType<typeof createClient>

let _client: Client | undefined

function getClient(): Client {
  if (!_client) {
    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url) throw new Error('Missing env var: SUPABASE_URL')
    if (!key) throw new Error('Missing env var: SUPABASE_SERVICE_ROLE_KEY')
    _client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }
  return _client
}

// Lazy proxy — client is created on first use, not at module load time.
// This prevents Next.js build from throwing during static analysis.
export const supabase = new Proxy({} as Client, {
  get(_, prop: string | symbol) {
    return (getClient() as Record<string | symbol, unknown>)[prop]
  },
})
