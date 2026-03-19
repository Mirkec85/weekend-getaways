import * as fs from 'fs'
import * as path from 'path'

// Load .env.local before anything else
const envPath = path.resolve(__dirname, '../.env.local')
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const match = line.match(/^([^#=\s]+)\s*=\s*(.*)$/)
    if (match) process.env[match[1]] = match[2].trim()
  }
}

import { Resend } from 'resend'
import { render } from '@react-email/components'
import * as React from 'react'
import WeeklyDeals from '../pipeline/emails/WeeklyDeals'

const apiKey = process.env.RESEND_API_KEY
if (!apiKey) {
  console.error('Missing RESEND_API_KEY — set it in your shell or .env.local')
  process.exit(1)
}

const resend = new Resend(apiKey)

async function main() {
  console.log('Rendering WeeklyDeals email template...')

  const html = await render(
    React.createElement(WeeklyDeals, {
      weekLabel: 'Thu 20 Mar – Sun 23 Mar 2025',
      logoUrl: 'https://raw.githubusercontent.com/Mirkec85/weekend-getaways/claude/adoring-gould/public/logo-email.png',
      unsubscribeUrl: 'https://flajko.com/unsubscribe?token=test',
      deals: [
        {
          destinationName: 'Barcelona',
          flightPriceEur: 49,
          departLabel: 'Fri 21 Mar',
          returnLabel: 'Sun 23 Mar',
          blurb: 'Sun-soaked tapas bars and Gaudí architecture on the Mediterranean.',
          hotelEstimateEur: 85,
          observedLabel: 'Thu 19 Mar 08:12 CET',
          bookingUrl: 'https://flajko.com',
          imageUrl: 'https://loremflickr.com/360/240/barcelona,sagrada,familia?lock=1',
        },
        {
          destinationName: 'Prague',
          flightPriceEur: 35,
          departLabel: 'Fri 21 Mar',
          returnLabel: 'Mon 24 Mar',
          blurb: 'Gothic spires, Czech beer, and cobblestone streets in one of Europe\'s most beautiful cities.',
          hotelEstimateEur: 60,
          observedLabel: 'Thu 19 Mar 09:45 CET',
          bookingUrl: 'https://flajko.com',
          imageUrl: 'https://loremflickr.com/360/240/prague,castle,charles?lock=1',
        },
        {
          destinationName: 'Lisbon',
          flightPriceEur: 59,
          departLabel: 'Sat 22 Mar',
          returnLabel: 'Mon 24 Mar',
          blurb: 'Seven hills, tram rides, pastel de nata, and Fado music echoing through Alfama.',
          hotelEstimateEur: 90,
          observedLabel: 'Thu 19 Mar 11:20 CET',
          bookingUrl: 'https://flajko.com',
          imageUrl: 'https://loremflickr.com/360/240/lisbon,tram,alfama?lock=1',
        },
      ],
    })
  )

  console.log('Sending test email to mirkomartic1@gmail.com...')

  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM ?? 'hello@flajko.com',
    to: 'mirkomartic1@gmail.com',
    subject: '✈ Flajko — Weekly Deals (template test)',
    html,
  })

  if (error) {
    console.error('Send failed:', error)
    process.exit(1)
  }

  console.log('Sent! Message ID:', data?.id)
  console.log('Check mirkomartic1@gmail.com for the rendered email.')
}

main()
