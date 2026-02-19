# Domain Pitfalls

**Domain:** Flight-deal / travel email newsletter service (weekly sends, single origin ZAG)
**Researched:** 2026-02-19

---

## Critical Pitfalls

### Pitfall 1: Stale Prices in Sent Emails

**What goes wrong:** Flight prices are highly volatile. A price fetched at 08:00 Thursday can be gone by 08:05. When a subscriber opens the email hours later, the advertised price no longer exists — they feel deceived and unsubscribe or mark as spam.

**Prevention:**
- Always timestamp prices: "Price observed: Thu 19 Feb 08:12 CET — verify at booking."
- Add disclaimer: "Prices change rapidly. Click to confirm current fare."
- Consider a freshness gate: if more than N hours pass between fetch and send, re-fetch.

**Detection:** Subscriber complaints about wrong prices; high CTR but zero booking conversion.

**Phase:** Phase 1 (email template design). Non-negotiable from day one.

---

### Pitfall 2: Flight API Terms-of-Service Violations

**What goes wrong:** Most flight APIs (Amadeus, Kiwi/Tequila) have strict ToS on caching duration and prohibited uses. Violating these results in key revocation — killing the entire data pipeline.

**Prevention:**
- Read the full ToS before writing a single line of code.
- Note maximum cache duration; build the scheduler around it.
- Store only what ToS permits (aggregated/derived data, not raw fare objects).
- Identify a secondary API as fallback before going live.

**Detection:** 403 Forbidden responses instead of 429 rate-limit; sudden zero-result responses.

**Phase:** Phase 1 (API selection). ToS review must happen before any caching design.

---

### Pitfall 3: Email Deliverability Collapse from Missing DNS Authentication

**What goes wrong:** Without SPF, DKIM, and DMARC records, Gmail and Outlook silently drop or spam-route emails. This is invisible to the sender — open rates look terrible but the emails are never seen. Gmail's 2024 bulk sender requirements make this enforced, not optional.

**Prevention:**
- Set up SPF, DKIM, and DMARC on the sending domain before the first send — even test sends.
- Use a dedicated sending subdomain (`mail.yourdomain.com`) to isolate reputation.
- Use an ESP (Resend, Postmark) that handles DKIM signing and reputation monitoring.
- Verify with mail-tester.com before any real sends.

**Detection:** Open rates below 5% from launch; Google Postmaster Tools showing spam rate above 0.1%.

**Phase:** Phase 1 (infrastructure). DNS records must exist before any email send.

---

### Pitfall 4: GDPR Non-Compliance

**What goes wrong:** Zagreb is in Croatia (EU). Collecting subscriber emails requires explicit consent, a privacy policy, functional unsubscribe, and data deletion on request. CAN-SPAM also requires a physical address in every email.

**Prevention:**
- Implement double opt-in from day one.
- Every email must contain: one-click unsubscribe link, sender identity, physical address or PO box.
- Write a minimal privacy policy before accepting the first subscriber.
- Store consent records (timestamp, IP, confirmation method).
- Honor unsubscribe requests same-day.

**Detection:** Subscriber asking "how do I unsubscribe?" (link is missing or broken).

**Phase:** Phase 1 (subscriber model) and email template. Cannot be retrofitted after subscribers are collected.

---

### Pitfall 5: Scheduler Silently Failing Without Alerting

**What goes wrong:** The Thursday cron job fails — API timeout, server restart, missing env var — and nobody knows. No email goes out. Subscribers notice before the operator does.

**Prevention:**
- Implement a dead man's switch: ping Healthchecks.io on every successful run. If no ping, alert fires.
- Log every execution with start time, end time, result, and error.
- Add operator email/Slack alert for any scheduler exception.

**Detection:** No send log entry for the expected Thursday window; no heartbeat ping received.

**Phase:** Phase 2 (scheduler). Monitoring must be in place before first production send.

---

## Moderate Pitfalls

### Pitfall 6: No Good Deals This Week — Edge Case Not Handled

**What goes wrong:** The fetcher finds nothing below threshold. Code crashes, sends an empty email, or silently skips.

**Prevention:** Define the business rule explicitly. Build a "no deals this week" template alongside the happy-path template. Unit test the deal selector with zero-result input.

**Phase:** Phase 2 (deal selection). Design the fallback path at the same time as the happy path.

---

### Pitfall 7: API Rate Limits Exhausted by Combinatorial Queries

**What goes wrong:** Fetching flights for multiple destinations and date pairs burns through free-tier quotas (Amadeus sandbox: ~2,000 calls/month) in a single test run.

**Prevention:** Count expected API calls before implementing. Implement throttling and back-off. Cache responses for the maximum permitted duration. Monitor quota at 80% of monthly limit.

**Phase:** Phase 2 (flight fetch service). Design the call budget before writing the loop.

---

### Pitfall 8: Click Tracking / UTM Parameters Breaking Booking Links

**What goes wrong:** UTM parameters or click-tracking redirects break the deep link. Users land on a homepage instead of the pre-filled search, eliminating the convenience value.

**Prevention:** Test every booking link in a real email client (not just a browser) before first send. Test on mobile — most users open email on mobile. Verify UTM-augmented URLs still load the correct pre-filled search.

**Phase:** Phase 2 (email template). Must be tested as part of template QA.

---

### Pitfall 9: Bounce and Complaint Accumulation

**What goes wrong:** Hard bounces and spam complaints pile up. Most ESPs suspend accounts at >2% hard bounce rate.

**Prevention:** Process ESP bounce webhooks immediately — remove hard bounces on first occurrence. Process spam complaint webhooks immediately. Never import addresses without confirmed double opt-in.

**Phase:** Phase 2 (subscriber management). Bounce/complaint webhook handling must ship before first real send.

---

### Pitfall 10: Timezone and DST Ambiguity

**What goes wrong:** The scheduler fires at the right UTC time in winter but drifts one hour in summer (CET → CEST). Weekend date windows computed in UTC miss or misclassify local flights.

**Prevention:** Define weekend flight windows in CET/CEST explicitly, not UTC. Use a timezone-aware scheduling library. Test scheduler fire times in both CET and CEST.

**Phase:** Phase 1 (scheduler design). Timezone must be explicit in the initial design.

---

## Minor Pitfalls

| Pitfall | Prevention | Phase |
|---------|-----------|-------|
| Hardcoded destination list — can't exclude recently featured city without deploy | Store exclusion rules in config/DB, not code | Phase 2 |
| Email rendering broken in Outlook / Apple Mail | Use MJML; inline all styles; test with Litmus or Email on Acid | Phase 2 |
| No kill-switch for crisis events (tragedy at featured destination) | Build a skip-next-send flag in config before first real send | Phase 2 |

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|---|---|---|
| Flight API selection | ToS violations, rate limit exhaustion | Read full ToS before writing code |
| Email infrastructure | Deliverability collapse | SPF/DKIM/DMARC before first test send |
| Subscriber signup | GDPR non-compliance | Double opt-in + consent timestamps from day one |
| Deal selection | No-deals edge case | Build fallback template alongside happy path |
| Scheduler | Silent failures, DST drift | Heartbeat monitoring + timezone-aware scheduling |
| Email template | Stale prices, rendering breakage, broken links | Timestamp prices; test in real clients; test links on mobile |
| Bounce handling | ESP suspension | Wire bounce/complaint webhooks before first real send |

---
*Research date: 2026-02-19*
