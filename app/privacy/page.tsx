export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white px-4 py-16">
      <main className="w-full max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mb-2">
          Privacy Policy
        </h1>
        <p className="text-sm text-zinc-500 mb-10">Last updated: February 2026</p>

        <div className="space-y-8 text-zinc-700 leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 mb-2">Who we are</h2>
            <p>
              Weekend Getaways is a free weekly newsletter that sends the cheapest weekend
              flight deals from Zagreb to subscribers who have opted in. This service is
              operated as a personal project.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 mb-2">What data we collect</h2>
            <p>We collect and store only your <strong>email address</strong>. We do not collect
              names, phone numbers, payment information, or any other personal data.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 mb-2">Why we collect it</h2>
            <p>Your email address is used solely to send you the weekly flight deal newsletter
              you subscribed to. We do not use it for advertising, profiling, or any other purpose.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 mb-2">Legal basis</h2>
            <p>We process your email address on the basis of your explicit consent (GDPR Article 6(1)(a)),
              given when you checked the consent box and confirmed your subscription via email.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 mb-2">How long we keep your data</h2>
            <p>We keep your email address for as long as you remain subscribed. When you
              unsubscribe, your address is marked inactive and no further emails are sent.
              You may request complete deletion at any time (see below).</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 mb-2">Third parties</h2>
            <p>Your email address is shared with the following service providers solely to
              operate the newsletter:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong>Resend</strong> — email delivery</li>
              <li><strong>Supabase</strong> — database storage</li>
            </ul>
            <p className="mt-2">We do not sell, rent, or share your data with any other third parties.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 mb-2">Your rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong>Unsubscribe</strong> — click the unsubscribe link in any email</li>
              <li><strong>Request deletion</strong> — email us and we will delete your data within 30 days</li>
              <li><strong>Access</strong> — request a copy of the data we hold about you</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 mb-2">Contact</h2>
            <p>For any privacy-related requests, reply to any newsletter email or contact
              us directly at the email address you subscribed with.</p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-zinc-200">
          <a href="/" className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
            ← Back to subscribe
          </a>
        </div>
      </main>
    </div>
  )
}
