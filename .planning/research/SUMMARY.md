# Project Research Summary

**Project:** Last-Minute Weekend Getaways Newsletter
**Domain:** Scheduled flight-deal email newsletter service (single-origin, weekly sends, ZAG)
**Researched:** 2026-02-19
**Confidence:** HIGH

## Executive Summary

This is a weekly flight-deal email newsletter targeting Zagreb-based subscribers who want actionable last-minute weekend trip ideas. The product archetype is well-established — competitors like Going.com, Jack's Flight Club, and Thrifty Traveler Premium have proven the model — and the recommended build path is a simple scheduled pipeline: cron fires Thursday, fetches cheap ZAG-departure flights via Kiwi Tequila API, selects 3 curated deals, enriches them with hotel cost estimates, renders an HTML email, and sends via Resend. A separate subscriber sub-system (Next.js landing page + Postgres) runs independently and can be deployed first to begin list-building before the pipeline is complete.

The entire stack is free-tier viable at MVP scale. Kiwi Tequila covers ZAG routes with flexible date search at no cost. Resend provides 3,000 free emails/month. GitHub Actions handles scheduling at no cost. Supabase provides managed Postgres on a free tier. Vercel hosts the landing page for free. There is no architectural reason to spend money before the first paying subscriber.

The biggest risks are not technical complexity but operational discipline: email deliverability collapses without SPF/DKIM/DMARC DNS records (must be done before any send), GDPR non-compliance is a legal exposure from the first subscriber (Croatia is EU — double opt-in, privacy policy, and unsubscribe are mandatory from day one), and flight API ToS violations can kill the data pipeline if caching rules are ignored. All three of these risks must be addressed in the foundation phase, not retrofitted later.

---

## Key Findings

### Recommended Stack

The full stack is composed of mature, free-tier tools with strong ecosystem alignment. Node.js 20 + TypeScript is the backbone — it shares the same ecosystem as Resend (first-class SDK) and React Email (templates as components). The flight API decision is straightforward: start with Kiwi Tequila (immediate access, ZAG coverage, flexible date search). Amadeus is a credible alternative but production approval takes days and adds friction for no MVP benefit.

See [STACK.md](.planning/research/STACK.md) for full alternatives and rationale.

**Core technologies:**
- **Kiwi Tequila API**: flight data — free, covers ZAG, flexible weekend date search, Wizz Air + Ryanair included
- **Resend**: email delivery — 3,000/month free, React Email support, excellent deliverability
- **GitHub Actions cron**: scheduling — free, no infra to manage, reliable
- **Node.js 20 + TypeScript**: backend runtime — same ecosystem as Resend/React Email, strong typing
- **Supabase (PostgreSQL)**: subscriber store — free tier, future-proof auth if accounts added later
- **Next.js 14 + Vercel**: landing page + signup API — free hosting, API routes included

**Do not use:** Skyscanner API (closed to new devs since 2022), Google Flights (no public API), raw SMTP (deliverability risk), Heroku Scheduler (unreliable free tier).

---

### Expected Features

The product is simple by design. Editorial curation of 3 deals IS the product — it is not a feature to be added later. The differentiating mechanic is hyper-relevance (every deal departs ZAG) plus editorial voice (subscribers follow a person, not a price feed). Complexity added beyond this before validation is waste.

See [FEATURES.md](.planning/research/FEATURES.md) for full competitive landscape and anti-feature rationale.

**Must have (table stakes):**
- Clear destination + price in email subject line — open/ignore decision happens here
- Round-trip dates shown in email body — subscribers need to know if dates work before clicking
- Direct booking link to airline/aggregator — primary CTA; one-click to book
- Prices in EUR — price confusion kills trust
- Unsubscribe link — GDPR legal requirement, not optional
- Mobile-readable single-column layout — 60-80% of opens are mobile
- Predictable Thursday send schedule — sets subscriber expectations
- Human-readable destination name ("Split, Croatia" not "SPU") — basic UX
- Weekend-feasibility framing ("3-night weekend") — core editorial judgment

**Should have (differentiators):**
- Strong editorial voice/personality — retention and word-of-mouth driver
- Hotel cost estimate per destination — total trip cost context, eliminates a subscriber question
- "Why this destination" 2-sentence blurb — converts fence-sitters
- Exactly 3 curated picks — scarcity signal; 3 great deals beats 30 mediocre ones
- Booking urgency signal ("Book before Sunday") — drives action

**Defer to v2+:**
- Multi-origin support — validate ZAG first
- Subscriber preference filters — editorial curation IS the filter
- Referral/social sharing system — needs subscriber base first
- Price history charts — requires time-series infrastructure, no value for "book this weekend"
- Account login / subscriber dashboard — no one has asked for it yet
- AI-generated destination copy — kills editorial voice, the core differentiator

---

### Architecture Approach

The architecture is a linear pipeline with two independent sub-systems sharing only the subscriber store. The weekly pipeline (cron → fetch → select → enrich → compose → send → log) runs as a single orchestrated script — no microservices, no queues, no complexity. The subscriber sub-system (landing page → signup API → Postgres) is fully independent and can ship and start collecting emails before the pipeline exists. The idempotency pattern (week_key in send_log) prevents double-sends. Token-based unsubscribe (UUID per subscriber row) satisfies GDPR without requiring auth.

See [ARCHITECTURE.md](.planning/research/ARCHITECTURE.md) for full schema, data flow diagrams, and component boundaries.

**Major components:**
1. **Cron Trigger** — fires Thursday 08:00 CET, invokes pipeline
2. **Flight Fetcher** — calls Kiwi Tequila for ZAG weekend departures, filters by price/duration
3. **Deal Selector** — scores results, picks top 3
4. **Hotel Estimator** — static JSON lookup (IATA → avg nightly EUR), no second API needed for MVP
5. **Email Composer** — renders HTML from React Email template + deal data
6. **Email Sender** — queries active subscribers, sends via Resend, collects delivery receipts
7. **Send Log** — persists send result per subscriber per week; idempotency gate
8. **Landing Page + Signup API** — Next.js form + POST /subscribe endpoint
9. **Unsubscribe API** — GET /unsubscribe?token= soft-deletes subscriber row
10. **Subscriber Store** — Postgres; source of truth for subscribers, tokens, and send history

---

### Critical Pitfalls

See [PITFALLS.md](.planning/research/PITFALLS.md) for full pitfall catalog including moderate and minor pitfalls.

1. **Email deliverability collapse from missing DNS auth** — SPF, DKIM, and DMARC records must be configured on the sending domain before any send, including test sends. Gmail's 2024 bulk sender rules make this enforced. Use a dedicated sending subdomain (`mail.yourdomain.com`). Verify with mail-tester.com before first real send.

2. **GDPR non-compliance** — Croatia is EU. Double opt-in, privacy policy, unsubscribe link, consent timestamps, and data-deletion process are legally required from subscriber #1. Cannot be retrofitted. Treat as a hard blocker before the landing page goes live.

3. **Stale prices in sent emails** — Flight prices move in minutes. Every email must timestamp the observed price and include a "prices change rapidly" disclaimer. Consider a freshness gate: if more than N hours pass between fetch and send, re-fetch.

4. **Flight API ToS violations** — Kiwi Tequila and Amadeus have strict rules on caching duration and prohibited uses. Key revocation kills the pipeline. Read the full ToS before writing any caching logic. Identify a secondary API before going to production.

5. **Scheduler silently failing** — The cron fails, no email goes out, subscribers notice before the operator does. Implement a dead man's switch (Healthchecks.io ping on every successful run) before first production send. Log every execution with start time, end time, and result.

---

## Implications for Roadmap

The architecture research provides an explicit build order that is validated by both the feature dependency chain and the pitfall phase warnings. The recommended phase structure follows it closely, with one critical addition: compliance and infrastructure concerns (DNS auth, GDPR) must be resolved in Phase 1 before any subscriber is collected or any email is sent.

### Phase 1: Foundation and Infrastructure
**Rationale:** Three of the five critical pitfalls must be resolved before any other work begins. DNS authentication, GDPR compliance design, and API ToS review are blockers, not nice-to-haves. The database schema is also established here because the subscriber data model (with unsubscribe tokens) underpins everything downstream.
**Delivers:** PostgreSQL schema and migrations; SPF/DKIM/DMARC DNS configured on sending domain; Kiwi Tequila API ToS reviewed and account provisioned; GDPR consent model designed (double opt-in, privacy policy draft, unsubscribe token column)
**Addresses:** Table stakes — unsubscribe link, GDPR consent
**Avoids:** Deliverability collapse (Pitfall 3), GDPR non-compliance (Pitfall 4), API ToS violation (Pitfall 2)

### Phase 2: Subscriber Sub-System (deploy early)
**Rationale:** This sub-system is fully independent. Deploying it immediately allows list-building to begin while Phases 3-5 are being built. Every day without a deployed landing page is a day without potential subscribers. The compliance foundation from Phase 1 must be in place before this goes live.
**Delivers:** Next.js landing page with email signup form + GDPR consent checkbox; POST /subscribe API (validate, deduplicate, insert); GET /unsubscribe?token= API; double opt-in confirmation email; deployed to Vercel
**Uses:** Next.js 14, Supabase (Postgres), Resend (for confirmation email), Vercel
**Implements:** Landing Page, Signup API, Unsubscribe API, Subscriber Store
**Avoids:** GDPR non-compliance (Pitfall 4), bounce accumulation (Pitfall 9)

### Phase 3: Pipeline Core (flight data)
**Rationale:** The flight API integration is the highest-risk external dependency. Validate it in isolation before wiring it to email. This is where ToS cache limits must be respected in implementation. The "no deals" edge case must be designed into the Deal Selector at the same time as the happy path, not added later.
**Delivers:** Flight Fetcher (calls Kiwi Tequila, filters by price/duration, returns raw results); Deal Selector (scoring logic, top-3 selection, zero-result fallback path); Hotel Estimator (static JSON lookup, IATA → avg nightly EUR)
**Uses:** Kiwi Tequila API, Node.js/TypeScript
**Implements:** Flight Fetcher, Deal Selector, Hotel Estimator
**Avoids:** API rate limit exhaustion (Pitfall 7), no-deals edge case (Pitfall 6), API ToS violations (Pitfall 2)

### Phase 4: Email Assembly and Send
**Rationale:** Build the email layer only after the data pipeline is independently validated. Both the HTML template and the send mechanism must be tested in real email clients on mobile before any subscriber receives an email. Booking links must be tested end-to-end. Price timestamps and disclaimer copy must be in the template from the first version.
**Delivers:** HTML email template (React Email, deal cards + footer with unsubscribe link); Email Composer (injects deal data into template); Email Sender (Resend integration, queries active subscribers, sends, collects receipts); tested in iOS Mail + Gmail Android on mobile
**Uses:** Resend, React Email, Node.js/TypeScript
**Implements:** Email Composer, Email Sender
**Avoids:** Stale prices (Pitfall 1), broken booking links (Pitfall 8), rendering breakage in Outlook/Apple Mail (minor pitfall), deliverability collapse (Pitfall 3)

### Phase 5: Scheduling, Logging, and Monitoring
**Rationale:** Scheduling is last because it requires Phases 3+4 to be manually tested first. The send log and idempotency check prevent double-sends. Monitoring (dead man's switch) is non-negotiable before the first automated production send — silent scheduler failure is invisible without it.
**Delivers:** GitHub Actions cron (Thursday 08:00 CET, timezone-aware); Send Log writes per subscriber per week; idempotency gate (week_key check before pipeline runs); Healthchecks.io dead man's switch; operator alert on exception; kill-switch config flag (skip-next-send); end-to-end dry run with production data
**Implements:** Cron Trigger, Send Log
**Avoids:** Silent scheduler failure (Pitfall 5), DST drift (Pitfall 10), double-sends (idempotency)

---

### Phase Ordering Rationale

- **Compliance before subscribers:** DNS auth and GDPR structure must exist before any subscriber email is collected. Retrofitting these is legally risky and technically disruptive to an existing subscriber table.
- **Subscribers before pipeline:** The landing page builds list during pipeline development. It is the only phase that can ship and deliver value independently.
- **Flight API before email:** The API integration is the highest uncertainty item. Validate the external data contract before building the layer that depends on it.
- **Email before scheduling:** The email template must be manually tested in real clients before it is triggered automatically.
- **Scheduling last:** Automation of a system that hasn't been manually validated end-to-end creates invisible failures. The scheduler is the final step, not the starting point.

---

### Research Flags

Phases likely needing `/gsd:research-phase` during planning:
- **Phase 1 (DNS/Deliverability):** SPF/DKIM/DMARC configuration is domain-specific and configuration details differ by registrar. Recommend verifying exact DNS record format for chosen sending domain during planning.
- **Phase 3 (Flight API):** Kiwi Tequila API shape for flexible weekend date search needs hands-on validation before building the fetcher. ToS cache duration limits must be confirmed and designed around.

Phases with standard patterns (skip research-phase):
- **Phase 2 (Subscriber Sub-System):** Next.js API routes + Postgres form handling is thoroughly documented. No novel integration risk.
- **Phase 4 (Email Assembly):** React Email + Resend is a well-documented pairing with official examples covering this exact use case.
- **Phase 5 (Scheduling):** GitHub Actions cron with timezone is standard; Healthchecks.io integration is a one-line ping.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All primary recommendations are verified free-tier tools with documented APIs. Kiwi Tequila free-tier limit (5,000 searches/month) should be confirmed before launch as the one remaining unknown. |
| Features | HIGH | Competitive landscape is well-documented. Table stakes and differentiators are drawn from established newsletter products. Anti-features list reflects validated scope decisions. |
| Architecture | HIGH | Pipeline pattern for this use case is standard. Schema is fully specified. Build order is validated by both feature dependencies and pitfall warnings. |
| Pitfalls | HIGH | GDPR, deliverability, and API ToS pitfalls are drawn from documented enforcement actions and established best practices, not inference. |

**Overall confidence:** HIGH

### Gaps to Address

- **Kiwi Tequila free-tier quota:** Confirmed at 5,000 searches/month in research, but verify exact quota and any rate-limiting behavior before committing to call budget design in Phase 3.
- **Hotel cost data coverage:** The static JSON hotel lookup covers common European destinations but will need to be populated for any destination the flight fetcher can return. Decide during Phase 3 planning whether to pre-populate broadly or populate lazily when a new destination appears in results.
- **Double opt-in email sender:** Phase 2 sends a confirmation email via Resend. This send happens before SPF/DKIM are fully tested at scale. Treat the first 5-10 confirmation sends as a deliverability test and monitor Resend's dashboard.
- **Privacy policy wording:** PITFALLS.md flags the need for a privacy policy before subscriber #1. This is a non-technical deliverable that must be drafted (or a template adopted) as part of Phase 1 or 2 planning.

---

## Sources

### Primary (HIGH confidence)
- Kiwi Tequila API documentation — flight search endpoint, flexible date parameters, ZAG coverage
- Resend official documentation + React Email docs — email delivery, SDK, template system
- GitHub Actions documentation — cron syntax, free-tier limits
- Supabase documentation — free-tier limits, Postgres schema design
- GDPR official text + ICO guidance — consent requirements, unsubscribe obligations (Croatia = EU)
- Gmail Bulk Sender Requirements (2024) — SPF/DKIM/DMARC enforcement rules

### Secondary (MEDIUM confidence)
- Going.com, Jack's Flight Club, Thrifty Traveler product analysis — feature expectations, competitive positioning
- mail-tester.com — deliverability verification tool
- Healthchecks.io documentation — dead man's switch implementation

### Tertiary (LOW confidence)
- Hotel average nightly rate estimates (VIE, PRG, BUD, etc.) — static JSON values are rough approximations; validate against current booking.com / hotels.com spot checks before launch

---

*Research completed: 2026-02-19*
*Ready for roadmap: yes*
