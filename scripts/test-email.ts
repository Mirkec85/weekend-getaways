import { Resend } from 'resend'

const apiKey = process.env.RESEND_API_KEY
if (!apiKey) {
  console.error('Missing RESEND_API_KEY — set it in your shell or .env.local')
  process.exit(1)
}

const resend = new Resend(apiKey)

async function main() {
  console.log('Sending test email via Resend...')

  const { data, error } = await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: 'mirkomartic1@gmail.com',
    subject: 'Weekend Getaways — Resend test',
    html: `
      <h2>It works!</h2>
      <p>Resend is wired up correctly for the Weekend Getaways project.</p>
      <p><small>Sent at ${new Date().toISOString()}</small></p>
    `,
  })

  if (error) {
    console.error('Send failed:', error)
    process.exit(1)
  }

  console.log('Sent! Message ID:', data?.id)
}

main()
