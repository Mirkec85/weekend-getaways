# Requirements: Last-Minute Weekend Getaways

**Defined:** 2026-02-19
**Core Value:** Find and deliver the cheapest weekend flights from Zagreb so budget-conscious travelers can make spontaneous decisions without doing the research themselves.

---

## v1 Requirements

### Infrastructure

- [ ] **INFRA-01**: SPF, DKIM, and DMARC records configured on the sending domain before any email is sent
- [ ] **INFRA-02**: PostgreSQL database (Supabase) provisioned with subscriber, deals_cache, and send_log tables
- [ ] **INFRA-03**: GitHub Actions cron job fires the weekly pipeline every Thursday (and optionally Friday)

### Subscribers

- [ ] **SUB-01**: User can submit their email on a landing page with a GDPR consent checkbox
- [ ] **SUB-02**: User receives a double opt-in confirmation email and is only added to the active list after confirming
- [ ] **SUB-03**: User can unsubscribe via a one-click token link in every email (no login required)
- [ ] **SUB-04**: Hard bounces and spam complaints are automatically processed via ESP webhooks and removed from the active list

### Flight Pipeline

- [ ] **PIPE-01**: Scheduler fetches the cheapest available weekend flights departing from Zagreb (ZAG) via Kiwi Tequila API each Thursday
- [ ] **PIPE-02**: Deal selector scores and picks the top 3 cheapest qualifying flights from the results
- [ ] **PIPE-03**: Each selected deal is enriched with a rough hotel nightly cost estimate from a static JSON lookup file
- [ ] **PIPE-04**: Pipeline is idempotent — a week-key check prevents double-sends if the cron fires more than once; a no-deals fallback handles weeks with no qualifying results

### Email

- [ ] **EMAIL-01**: A formatted HTML email is sent to all active subscribers with 3 deal cards, each containing: destination name, flight price in EUR, departure and return dates, a short trip blurb, direct booking link, and hotel cost estimate
- [ ] **EMAIL-02**: Each deal card displays the price observation timestamp ("Observed: Thu 19 Feb 08:12 CET") to set expectations on price freshness
- [ ] **EMAIL-03**: Email renders in a mobile-optimised single-column layout and includes a plain-text fallback (multipart MIME)
- [ ] **EMAIL-04**: Booking links include UTM tracking parameters to measure clicks per destination

---

## v2 Requirements

### Monitoring

- **MON-01**: Dead man's switch (Healthchecks.io) alerts operator if weekly pipeline fails to complete
- **MON-02**: Operator dashboard showing send history, open rates, and bounce rate per week

### Personalisation

- **PERS-01**: User can set a maximum flight price preference
- **PERS-02**: User can filter by destination type (beach, city, nature)
- **PERS-03**: Multiple origin cities supported beyond Zagreb

### Data Quality

- **DATA-01**: Live hotel API replaces static JSON lookup for real-time accommodation pricing
- **DATA-02**: Destination exclusion rules prevent featuring the same city within N weeks

### Growth

- **GROW-01**: Referral program — subscriber can share a unique link to invite others
- **GROW-02**: Social sharing links (WhatsApp, Instagram) in email footer

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| Real-time / instant flight alerts | Misaligned with weekly digest model; requires always-on monitoring |
| Account login / subscriber dashboard | Adds auth flows before core value is proven; unsubscribe link sufficient |
| Points/miles deals | Separate audience, separate data sources |
| Mobile app | Web-first; embrace email as the channel |
| In-app booking | Links out to airline/aggregator; no booking infrastructure needed |
| AI-generated destination blurbs | Kills editorial voice; 3 manual blurbs per week is 15 minutes of work |
| Price history charts | Requires time-series storage; no value for "book this weekend" use case |
| Archived past deals | Deals expire; no user value after send |

---

## Traceability

*Populated during roadmap creation.*

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01 | — | Pending |
| INFRA-02 | — | Pending |
| INFRA-03 | — | Pending |
| SUB-01 | — | Pending |
| SUB-02 | — | Pending |
| SUB-03 | — | Pending |
| SUB-04 | — | Pending |
| PIPE-01 | — | Pending |
| PIPE-02 | — | Pending |
| PIPE-03 | — | Pending |
| PIPE-04 | — | Pending |
| EMAIL-01 | — | Pending |
| EMAIL-02 | — | Pending |
| EMAIL-03 | — | Pending |
| EMAIL-04 | — | Pending |

**Coverage:**
- v1 requirements: 15 total
- Mapped to phases: 0
- Unmapped: 15 ⚠️

---
*Requirements defined: 2026-02-19*
*Last updated: 2026-02-19 after initial definition*
