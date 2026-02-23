export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/db'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(new URL('/confirm?status=invalid', req.url))
  }

  const { data, error } = await supabase
    .from('subscribers')
    .update({ status: 'active', confirmed_at: new Date().toISOString() })
    .eq('unsubscribe_token', token)
    .eq('status', 'pending')
    .select('id')
    .single()

  if (error || !data) {
    return NextResponse.redirect(new URL('/confirm?status=invalid', req.url))
  }

  return NextResponse.redirect(new URL('/confirm?status=success', req.url))
}
