import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { supabase } from '@/lib/db'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  // CRITICAL: req.text() MUST be first body read.
  // Svix HMAC signatures are computed over exact raw bytes.
  // Calling req.json() before this would break signature verification.
  const payload = await req.text()

  let event
  try {
    event = resend.webhooks.verify({
      payload,
      headers: {
        id: req.headers.get('svix-id') ?? '',
        timestamp: req.headers.get('svix-timestamp') ?? '',
        signature: req.headers.get('svix-signature') ?? '',
      },
      webhookSecret: process.env.RESEND_WEBHOOK_SECRET ?? '',
    })
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    if (event.type === 'email.bounced') {
      const recipientEmail = event.data.to[0]
      await supabase
        .from('subscribers')
        .update({ status: 'bounced' })
        .eq('email', recipientEmail)
        .eq('status', 'active')
    } else if (event.type === 'email.complained') {
      const recipientEmail = event.data.to[0]
      await supabase
        .from('subscribers')
        .update({ status: 'unsubscribed' })
        .eq('email', recipientEmail)
        .eq('status', 'active')
    }
    // All other event types: no action, fall through to 200
  } catch (err) {
    // DB update failed — still return 200 to prevent Resend retries.
    // Resend retry schedule: 5s, 5m, 30m, 2h, 5h, 10h.
    // A broken DB should not cause webhook floods.
    console.error('[webhook] DB update failed for event', event.type, err)
  }

  // Always return 200 for valid signatures — Resend retries on non-2xx.
  return NextResponse.json({ received: true }, { status: 200 })
}
