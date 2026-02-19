# Roadmap: Last-Minute Weekend Getaways

## Overview

A weekly automated flight-deal email newsletter for Zagreb-based travelers. The build proceeds in strict dependency order: compliance and infrastructure first, then a subscriber landing page that deploys early to start building the list, then the flight data pipeline validated in isolation, then the email layer wired to real data, and finally the scheduler that automates the full end-to-end flow. Each phase delivers a complete, independently verifiable capability before the next begins.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation** - Provision the database and configure email authentication DNS records before any subscriber is collected or any email is sent
- [ ] **Phase 2: Subscriber Sub-System** - Deploy the landing page and signup flow so list-building starts while the pipeline is built
- [ ] **Phase 3: Flight Pipeline** - Build and validate the flight data fetcher, deal selector, and hotel estimator in isolation before wiring to email
- [ ] **Phase 4: Email Assembly** - Compose and send the formatted deal email to real subscribers using tested data from Phase 3
- [ ] **Phase 5: Scheduling and Automation** - Wire the full pipeline to a cron schedule with idempotency guards, logging, and a dead man's switch

## Phase Details

### Phase 1: Foundation
**Goal**: The infrastructure required to safely collect subscribers and send email exists and is verified before any subscriber arrives or any email is sent.
**Depends on**: Nothing (first phase)
**Requirements**: INFRA-01, INFRA-02
**Success Criteria** (what must be TRUE):
  1. SPF, DKIM, and DMARC records are published on the sending domain and pass verification via mail-tester.com before any email is sent
  2. A Supabase PostgreSQL instance is provisioned with the subscriber, deals_cache, and send_log tables and their schemas match the application data model
  3. A test email sent from the configured sending domain to a Gmail address lands in the inbox (not spam) with no authentication warnings
**Plans**: TBD

Plans:
- [ ] 01-01: Configure sending domain DNS (SPF, DKIM, DMARC) and verify deliverability score
- [ ] 01-02: Provision Supabase project and apply database schema migrations

### Phase 2: Subscriber Sub-System
**Goal**: Users can discover the service, sign up with GDPR consent, confirm their subscription via double opt-in, and unsubscribe at any time — deployed and live so list-building begins immediately.
**Depends on**: Phase 1
**Requirements**: SUB-01, SUB-02, SUB-03, SUB-04
**Success Criteria** (what must be TRUE):
  1. A user can visit the landing page, enter their email with a GDPR consent checkbox checked, and submit the form successfully
  2. The user receives a confirmation email and becomes an active subscriber only after clicking the confirmation link
  3. A subscriber can click the unsubscribe link in any email and is immediately removed from the active list without logging in
  4. A hard bounce or spam complaint received via ESP webhook automatically removes the subscriber from the active list without manual intervention
**Plans**: TBD

Plans:
- [ ] 02-01: Build and deploy Next.js landing page with signup form and GDPR consent checkbox
- [ ] 02-02: Implement POST /subscribe API (validate, deduplicate, insert, trigger double opt-in email)
- [ ] 02-03: Implement GET /unsubscribe?token= API and ESP webhook handler for bounces and complaints

### Phase 3: Flight Pipeline
**Goal**: The system can fetch real weekend flights from Zagreb via Kiwi Tequila, select the top 3 qualifying deals, enrich them with hotel cost estimates, and handle the zero-results edge case — all verifiable without sending any email.
**Depends on**: Phase 1
**Requirements**: PIPE-01, PIPE-02, PIPE-03, PIPE-04
**Success Criteria** (what must be TRUE):
  1. Running the pipeline script manually produces a ranked list of the cheapest weekend flights departing ZAG, fetched live from Kiwi Tequila
  2. The deal selector returns exactly 3 enriched deals containing destination name, flight price in EUR, departure/return dates, booking link, and hotel cost estimate
  3. When the API returns zero qualifying results, the pipeline exits cleanly via the defined fallback path without throwing an unhandled error
  4. Running the pipeline twice in the same week produces the same output without making duplicate API calls beyond the defined cache window
**Plans**: TBD

Plans:
- [ ] 03-01: Implement Flight Fetcher (Kiwi Tequila API integration, ZAG weekend search, price/duration filters)
- [ ] 03-02: Implement Deal Selector (scoring logic, top-3 selection, zero-results fallback path)
- [ ] 03-03: Implement Hotel Estimator (static JSON IATA-to-nightly-EUR lookup) and wire into deal enrichment

### Phase 4: Email Assembly
**Goal**: A correctly formatted, mobile-optimised HTML email with 3 deal cards is sent to all active subscribers using real pipeline output, and renders correctly in Gmail and iOS Mail before any automated send occurs.
**Depends on**: Phase 2, Phase 3
**Requirements**: EMAIL-01, EMAIL-02, EMAIL-03, EMAIL-04
**Success Criteria** (what must be TRUE):
  1. Running the send script delivers a deal email to all active subscribers via Resend, with each card showing destination name, EUR price, departure and return dates, trip blurb, hotel estimate, and a working booking link
  2. The email includes a price observation timestamp ("Observed: Thu 19 Feb 08:12 CET") on each deal card so subscribers know how fresh the prices are
  3. The email renders correctly in a mobile single-column layout on iOS Mail and Gmail Android, and the plain-text fallback is present in the raw MIME structure
  4. Each booking link in the email contains UTM tracking parameters and clicks through to the correct airline or aggregator page
**Plans**: TBD

Plans:
- [ ] 04-01: Build React Email HTML template (deal cards with all required fields, unsubscribe footer, mobile layout, plain-text fallback)
- [ ] 04-02: Implement Email Composer (injects deal data into template) and Email Sender (Resend integration, subscriber query, send loop, receipt collection)

### Phase 5: Scheduling and Automation
**Goal**: The full pipeline runs automatically every Thursday without manual intervention, double-sends are impossible, failures are detected within hours, and the operator can disable a send without touching code.
**Depends on**: Phase 4
**Requirements**: INFRA-03, PIPE-04 (idempotency, already partially in Phase 3 — scheduling enforcement here)
**Success Criteria** (what must be TRUE):
  1. The GitHub Actions cron fires at 08:00 CET every Thursday and completes the full pipeline end-to-end without manual triggering
  2. If the cron fires more than once in a week, the second run detects the week_key in send_log and exits without re-sending
  3. A Healthchecks.io dead man's switch receives a ping on every successful run, and the operator receives an alert if no ping arrives within the expected window
  4. Setting a kill-switch config flag prevents the next automated send without modifying the cron schedule or any source code
**Plans**: TBD

Plans:
- [ ] 05-01: Configure GitHub Actions cron workflow (Thursday 08:00 CET, timezone-aware, environment secrets)
- [ ] 05-02: Implement Send Log writes, idempotency gate (week_key check), Healthchecks.io ping, operator alert on exception, and kill-switch flag

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

Note: Phase 3 depends only on Phase 1 (not Phase 2) and can be worked in parallel with Phase 2 if desired. Phase 4 requires both Phase 2 and Phase 3 complete.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 0/2 | Not started | - |
| 2. Subscriber Sub-System | 0/3 | Not started | - |
| 3. Flight Pipeline | 0/3 | Not started | - |
| 4. Email Assembly | 0/2 | Not started | - |
| 5. Scheduling and Automation | 0/2 | Not started | - |
