export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/db'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(new URL('/unsubscribed?status=invalid', req.url))
  }

  const { data, error } = await supabase
    .from('subscribers')
    .update({ status: 'unsubscribed', unsubscribed_at: new Date().toISOString() })
    .eq('unsubscribe_token', token)
    .eq('status', 'active')
    .select('id')

  if (error || !data || data.length === 0) {
    return NextResponse.redirect(new URL('/unsubscribed?status=invalid', req.url))
  }

  return NextResponse.redirect(new URL('/unsubscribed?status=success', req.url))
}
