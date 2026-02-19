# Stack Research: Last-Minute Weekend Getaways

## Recommended Stack

### Flight / Travel API

**Primary recommendation: Kiwi.com Tequila API**
- Free tier: up to 5,000 searches/month (more than enough for weekly batch)
- Covers Zagreb (ZAG) routes well — Wizz Air and Ryanair data included
- Flexible date search: find cheapest flights within a date range (perfect for "this weekend")
- Returns price, airline, booking link, and duration
- Confidence: HIGH — widely used for exactly this use case

**Alternative: Amadeus for Developers**
- Free sandbox + production tiers
- `Flight Offers Search` endpoint supports flexible date ranges
- Requires going through approval for production access (can take days)
- Confidence: HIGH — solid API, but production access has friction

**Do NOT use:**
- Skyscanner API — closed to new developers since 2022, effectively dead for new projects
- Google Flights — no public API, scraping violates ToS
- Direct airline scraping — fragile, ToS violations, high maintenance

**Recommendation: Start with Kiwi Tequila** (immediate access, flexible date search, good coverage).

---

### Email Delivery

**Recommendation: Resend**
- Version: current (check resend.com for latest SDK)
- Free tier: 3,000 emails/month (well beyond MVP needs)
- React Email support: write email templates as React components
- Excellent deliverability and simple API
- `resend` npm package or Python SDK
- Confidence: HIGH

**Alternative: Postmark**
- Better deliverability guarantees, stricter on transactional vs marketing
- 100 free emails/month on free tier (tight if list grows)
- Confidence: HIGH

**Do NOT use:**
- SendGrid free tier — rate limits and deliverability issues at low volume
- Mailchimp — overengineered for automated transactional emails, expensive

---

### Scheduler

**Recommendation: GitHub Actions (cron)**
- Free for public repos; generous free minutes for private repos
- Cron syntax: `0 6 * * 4` (Thursday 6am UTC) + `0 6 * * 5` (Friday 6am UTC)
- No infrastructure to manage
- Confidence: HIGH

**Alternative: Railway cron jobs** (if hosting on Railway anyway)
- Built-in cron scheduler alongside the app
- Confidence: HIGH

**Do NOT use:**
- Heroku Scheduler — shutting down free tier, reliability issues
- Rolling your own cron on a VPS — unnecessary complexity for MVP

---

### Backend

**Recommendation: Node.js + TypeScript**
- Excellent Resend SDK support (first-class)
- React Email for templates (same ecosystem)
- `node-fetch` or `axios` for API calls
- Version: Node 20 LTS
- Confidence: HIGH

**Alternative: Python**
- Better for data manipulation if deal-scoring logic grows complex
- `requests` library for API calls
- Jinja2 for email templates
- Confidence: HIGH (use if you're more comfortable with Python)

---

### Database (Subscribers)

**Recommendation: PostgreSQL via Supabase**
- Free tier: 500MB, enough for thousands of subscribers
- Built-in auth if you add user accounts later
- Simple table: `subscribers (id, email, created_at, confirmed, unsubscribed_at)`
- Supabase JS client or direct `pg` connection
- Confidence: HIGH

**Alternative: SQLite (file-based)**
- Zero config, perfect for MVP
- Limitation: doesn't scale if you move to serverless/multi-instance
- Use if: running on a single VPS and want simplicity
- Confidence: HIGH for MVP

---

### Landing Page

**Recommendation: Next.js (App Router) + Tailwind CSS**
- Single repo: landing page + API routes for email signup
- Deploy to Vercel (free tier)
- API route handles POST /subscribe → saves to database
- Version: Next.js 14+
- Confidence: HIGH

**Alternative: Plain HTML + a form endpoint service (Formspree / Basin)**
- Zero-code landing page, form submissions handled by third party
- Fastest to ship, no backend needed for the signup form
- Confidence: HIGH for MVP

---

### Hosting / Deployment

**Recommendation: Vercel (frontend) + Railway (backend worker)**
- Vercel: landing page + email signup API (free tier)
- Railway: scheduled job runner + database (free tier available)
- Confidence: HIGH

**Alternative: Single Railway deployment**
- One platform for everything: Node app, PostgreSQL, cron scheduler
- Simpler ops, slightly less generous free tier
- Confidence: HIGH

---

## Summary

| Layer | Choice | Why |
|-------|--------|-----|
| Flight API | Kiwi Tequila | Free, covers ZAG, flexible date search |
| Email delivery | Resend | Free tier, great DX, React Email support |
| Scheduler | GitHub Actions cron | Free, no infra, reliable |
| Backend | Node.js 20 + TypeScript | Same ecosystem as Resend/React Email |
| Database | Supabase (PostgreSQL) | Free tier, future-proof |
| Landing page | Next.js 14 + Vercel | Free hosting, API routes included |

---

*Research date: 2026-02-19*
*Confidence: HIGH across all recommendations — verify Kiwi Tequila free tier limits before launch*
