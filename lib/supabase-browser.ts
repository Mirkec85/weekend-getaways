import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | undefined

// Deeply-nested no-op proxy for use when env vars are absent (build/SSR only)
function makeNoopProxy(): unknown {
  return new Proxy(
    (() => Promise.resolve({ data: null, error: null })) as unknown as object,
    {
      get() {
        return makeNoopProxy()
      },
      apply() {
        return Promise.resolve({ data: null, error: null })
      },
    }
  )
}

export function getSupabaseBrowser(): SupabaseClient {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) {
      return makeNoopProxy() as SupabaseClient
    }
    _client = createClient(url, key)
  }
  return _client
}

// Lazy proxy — defers client creation to first use, works during SSR/build
export const supabaseBrowser = new Proxy({} as SupabaseClient, {
  get(_, prop: string | symbol) {
    return (getSupabaseBrowser() as unknown as Record<string | symbol, unknown>)[prop]
  },
})
