import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/db'
import { getResend } from '@/lib/resend'
import { z } from 'zod'

const BodySchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  gdpr_consent: z.literal(true, {
    error: 'You must accept the terms to subscribe',
  }),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const result = BodySchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 422 }
      )
    }

    const { email } = result.data

    // Attempt to insert a new pending subscriber
    const { data: subscriber, error: insertError } = await supabase
      .from('subscribers')
      .insert({ email })
      .select('id, unsubscribe_token')
      .single()

    if (insertError) {
      // Unique violation (error code 23505) — email already exists
      if (insertError.code === '23505') {
        const { data: existing, error: fetchError } = await supabase
          .from('subscribers')
          .select('id, unsubscribe_token, status')
          .eq('email', email)
          .single()

        if (fetchError || !existing) {
          return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
        }

        if (existing.status === 'active') {
          return NextResponse.json({ error: 'Already subscribed' }, { status: 409 })
        }

        if (existing.status === 'pending') {
          // Re-send the confirmation email idempotently
          const confirmUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/confirm?token=${existing.unsubscribe_token}`
          await getResend().emails.send({
            from: process.env.RESEND_FROM!,
            to: email,
            subject: 'Confirm your subscription to Weekend Getaways',
            html: `<div>
  <h2>Confirm your subscription</h2>
  <p>Thanks for signing up for Weekend Getaways! Please confirm your email by clicking the link below:</p>
  <p><a href="${confirmUrl}">Confirm my subscription</a></p>
  <p>If you didn't request this, you can safely ignore this email.</p>
</div>`,
          })
          return NextResponse.json({ success: true }, { status: 201 })
        }

        // status is 'unsubscribed' or 'bounced' — re-subscribe
        const { error: updateError } = await supabase
          .from('subscribers')
          .update({
            status: 'pending',
            confirmed_at: null,
            unsubscribed_at: null,
          })
          .eq('email', email)

        if (updateError) {
          return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
        }

        const confirmUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/confirm?token=${existing.unsubscribe_token}`
        await getResend().emails.send({
          from: process.env.RESEND_FROM!,
          to: email,
          subject: 'Confirm your subscription to Weekend Getaways',
          html: `<div>
  <h2>Confirm your subscription</h2>
  <p>Thanks for signing up for Weekend Getaways! Please confirm your email by clicking the link below:</p>
  <p><a href="${confirmUrl}">Confirm my subscription</a></p>
  <p>If you didn't request this, you can safely ignore this email.</p>
</div>`,
        })
        return NextResponse.json({ success: true }, { status: 201 })
      }

      return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
    }

    if (!subscriber) {
      return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
    }

    // New subscriber inserted — send confirmation email
    const confirmUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/confirm?token=${subscriber.unsubscribe_token}`
    await getResend().emails.send({
      from: process.env.RESEND_FROM!,
      to: email,
      subject: 'Confirm your subscription to Weekend Getaways',
      html: `<div>
  <h2>Confirm your subscription</h2>
  <p>Thanks for signing up for Weekend Getaways! Please confirm your email by clicking the link below:</p>
  <p><a href="${confirmUrl}">Confirm my subscription</a></p>
  <p>If you didn't request this, you can safely ignore this email.</p>
</div>`,
    })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
