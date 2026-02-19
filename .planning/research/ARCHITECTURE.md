# Architecture Patterns

**Domain:** Scheduled flight-deal email newsletter service
**Researched:** 2026-02-19

---

## Recommended Architecture

A simple pipeline architecture. A weekly cron trigger drives the entire flow from flight data fetch through email delivery. Two independent sub-systems share only the subscriber store.

```
┌─────────────────────────────────────────────────────────────────┐
│                        SCHEDULED PIPELINE                        │
│                                                                  │
│  Cron Trigger (Thu/Fri)                                         │
│       │                                                          │
│       ▼                                                          │
│  Flight Fetcher ──────► Flight API (Kiwi Tequila/Amadeus)       │
│       │                                                          │
│       ▼                                                          │
│  Deal Selector  (rank & pick top 3)                             │
│       │                                                          │
│       ▼                                                          │
│  Hotel Estimator ─────► Static JSON lookup (MVP)                │
│       │                                                          │
│       ▼                                                          │
│  Email Composer  (template → HTML email)                        │
│       │                                                          │
│       ▼                                                          │
│  Email Sender ────────► Email Delivery API (Resend)             │
│       │                                                          │
│       ▼                                                          │
│  Send Log  (record outcome per subscriber)                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      SUBSCRIBER SUB-SYSTEM                       │
│                                                                  │
│  Landing Page  ──────► Signup API ──────► Subscriber Store      │
│  (Next.js/static)      (POST /subscribe)  (Postgres/SQLite)     │
│                                                                  │
│  Unsubscribe Link ───► Unsubscribe API ──► soft-delete row      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Boundaries

| Component | Responsibility | Inputs | Outputs |
|-----------|---------------|--------|---------|
| **Cron Trigger** | Fire pipeline on schedule (Thu 08:00) | Clock | Pipeline invocation |
| **Flight Fetcher** | Call flight API for ZAG + upcoming weekend | Config (origin, dates) | Raw flight results JSON |
| **Deal Selector** | Score and rank; pick top 3 | Raw flight results | 3 deal objects |
| **Hotel Estimator** | Attach rough hotel cost to each deal | Destination codes | Deals with hotel_estimate |
| **Email Composer** | Render HTML email from template + deal data | 3 enriched deals | HTML string |
| **Email Sender** | Send rendered email to subscriber list | HTML, subscriber list | Delivery receipts |
| **Send Log** | Record each send attempt and result | Delivery receipts | Persisted log rows |
| **Landing Page** | Capture email signups | User form submission | POST to Signup API |
| **Signup API** | Validate and persist new subscriber | Email address | Confirmation response |
| **Unsubscribe API** | Mark subscriber inactive | Token | Updated row |
| **Subscriber Store** | Source of truth for subscribers and send history | Writes from all APIs | Active subscriber list |

---

## Data Flow

### Signup Flow (any time)

```
User fills form on Landing Page
  → POST /subscribe { email }
    → Validate email format
    → Check for duplicate
    → INSERT subscriber row (status = active)
    → Send confirmation email (optional for MVP)
  → Show "check your inbox" confirmation
```

### Weekly Pipeline Flow (Thursday/Friday cron)

```
1. Cron fires
   → compute upcoming weekend dates (next Sat/Sun)

2. Flight Fetcher
   → GET flight API: origin=ZAG, destination=anywhere,
     depart=[Sat], return=[Sun], adults=1
   → Filter: price < threshold, duration < max_hours

3. Deal Selector
   → Score each result: price, flight duration, destination novelty
   → Pick top 3

4. Hotel Estimator
   → For each destination: lookup average 1-night cost
   → Source: static JSON file mapping IATA → avg nightly rate (MVP)

5. Email Composer
   → Render HTML template with 3 deal cards
   → Each card: destination, price, dates, blurb, booking URL, hotel estimate

6. Email Sender
   → SELECT email FROM subscribers WHERE status = 'active'
   → Send rendered HTML via Resend API
   → Collect delivery status per recipient

7. Send Log
   → INSERT send_log row per subscriber: (subscriber_id, sent_at, status, week_key)
```

### Unsubscribe Flow

```
Subscriber clicks unsubscribe link (unique token in URL)
  → GET /unsubscribe?token={token}
    → Lookup subscriber by token
    → UPDATE status = 'unsubscribed', unsubscribed_at = NOW()
  → Show "you've been unsubscribed" page
```

---

## Key Patterns

### Pattern 1: Pipeline as a Single Script

The entire weekly pipeline runs as one orchestrated function invoked by cron. Simple to debug, deploy, and re-run manually. No microservices.

```js
async function runWeeklyPipeline() {
  const deals       = await fetchFlightDeals();
  const top3        = selectTopDeals(deals, 3);
  const enriched    = await enrichWithHotels(top3);
  const html        = renderEmail(enriched);
  const subscribers = await getActiveSubscribers();
  await sendEmailToAll(html, subscribers);
  await logSendResults(...);
}
```

### Pattern 2: Token-Based Unsubscribe (No Auth Required)

Each subscriber row gets a random UUID token at insert time. Unsubscribe links embed this token. Required for GDPR compliance.

```sql
ALTER TABLE subscribers ADD COLUMN unsubscribe_token UUID DEFAULT gen_random_uuid();
```

Link in footer: `https://yourdomain.com/unsubscribe?token={{ subscriber.unsubscribe_token }}`

### Pattern 3: Static Hotel Lookup for MVP

A JSON file mapping destination IATA codes to rough average hotel nightly costs. Eliminates a second paid API dependency for launch.

```json
{
  "VIE": { "avg_hotel_night": 90, "currency": "EUR" },
  "PRG": { "avg_hotel_night": 75, "currency": "EUR" },
  "BUD": { "avg_hotel_night": 65, "currency": "EUR" }
}
```

### Pattern 4: Idempotent Pipeline with Week Key

Store a `week_key` (e.g., `2026-W08`) in the send log. Check before running — if this week's key exists, skip. Prevents double-sends.

```sql
SELECT COUNT(*) FROM send_log WHERE week_key = '2026-W08';
-- if > 0, abort with log message
```

---

## Anti-Patterns to Avoid

| Anti-Pattern | Why Bad | Instead |
|---|---|---|
| Raw SMTP | Deliverability is your problem; lands in spam | Use Resend/SES transactional API |
| Synchronous HTTP trigger | Flight fetch + bulk send exceeds 30s timeouts | Standalone cron script, not HTTP handler |
| Hard-delete unsubscribed rows | Loses history; can't prove GDPR compliance | Soft-delete: `UPDATE status = 'unsubscribed'` |
| Hardcoded weekend dates | Stale results or errors every week | Compute at runtime relative to trigger date |

---

## Database Schema

### subscribers

```sql
CREATE TABLE subscribers (
  id                 SERIAL PRIMARY KEY,
  email              TEXT NOT NULL UNIQUE,
  status             TEXT NOT NULL DEFAULT 'active',  -- active | unsubscribed | bounced
  unsubscribe_token  UUID NOT NULL DEFAULT gen_random_uuid(),
  subscribed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_at       TIMESTAMPTZ,
  unsubscribed_at    TIMESTAMPTZ
);
```

### deals_cache

```sql
CREATE TABLE deals_cache (
  id               SERIAL PRIMARY KEY,
  week_key         TEXT NOT NULL,
  destination      TEXT NOT NULL,
  destination_name TEXT NOT NULL,
  flight_price     NUMERIC(8,2) NOT NULL,
  currency         TEXT NOT NULL DEFAULT 'EUR',
  depart_at        TIMESTAMPTZ NOT NULL,
  return_at        TIMESTAMPTZ NOT NULL,
  booking_url      TEXT NOT NULL,
  hotel_estimate   NUMERIC(8,2),
  trip_blurb       TEXT,
  rank             INT NOT NULL,
  UNIQUE(week_key, rank)
);
```

### send_log

```sql
CREATE TABLE send_log (
  id                  SERIAL PRIMARY KEY,
  subscriber_id       INT NOT NULL REFERENCES subscribers(id),
  week_key            TEXT NOT NULL,
  sent_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status              TEXT NOT NULL,       -- sent | failed | skipped
  provider_message_id TEXT,
  UNIQUE(subscriber_id, week_key)          -- prevents double-send
);
```

---

## Suggested Build Order

```
Phase 1: Foundation
  1a. Database schema + migrations
  1b. Subscriber data layer

Phase 2: Subscriber Sub-System  ← deploy early, start building list
  2a. Landing page (email signup form)
  2b. POST /subscribe API
  2c. GET /unsubscribe?token= API

Phase 3: Pipeline Core
  3a. Flight Fetcher (API integration, parse, filter)
  3b. Deal Selector (scoring, pick top 3)
  3c. Hotel Estimator (static JSON lookup)

Phase 4: Email
  4a. HTML email template (deal cards + footer)
  4b. Email Composer (inject deal data)
  4c. Email Sender (Resend integration, test send)

Phase 5: Scheduling + Logging
  5a. Cron setup (GitHub Actions or cron-job.org)
  5b. Send Log writes + idempotency check
  5c. End-to-end dry run
```

**Why this order:** Phase 2 deploys independently — start building your subscriber list while building the pipeline. Flight API is the highest-risk integration — validate it in isolation before wiring email. Scheduling is last because it requires Phases 3+4 to be manually tested first.

---
*Research date: 2026-02-19*
