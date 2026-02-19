# Last-Minute Weekend Getaways

## What This Is

A weekly automated email service that finds the cheapest weekend trips from Zagreb, Croatia every Thursday/Friday. Users sign up via a simple landing page and receive a curated "This weekend's ideas" email with 3 budget-friendly destinations — no planning required, just pick one and book.

## Core Value

Find and deliver the cheapest weekend flights from Zagreb so budget-conscious travelers can make spontaneous travel decisions without doing the research themselves.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Scheduler runs every Thursday/Friday and fetches cheapest weekend flights from Zagreb via flight API
- [ ] Email contains 3 destination ideas, each with: destination name, flight price, trip summary, booking link, hotel cost estimate
- [ ] Simple landing page with email signup form
- [ ] Subscribers receive the weekly email automatically

### Out of Scope

- Variable origin city — fixed to Zagreb for MVP
- User preferences (travel style, budget filters, distance limits) — v2
- Mobile app — web-first
- Real-time booking — links out to third-party, no in-app booking
- Multiple email sends per week — one send Thursday/Friday only

## Context

- Origin city: Zagreb, Croatia (ZAG) — strong Wizz Air and Ryanair route network across Europe
- Data source: Flight API (Skyscanner, Amadeus, or Kiwi.com) — to be finalized during implementation
- Weekend window: Friday departure → Sunday return (2–3 nights)
- "Cheap" is defined by raw flight price — lowest available fares win
- Hotel estimate is approximate (e.g., from a secondary API or static lookup) to give total budget context

## Constraints

- **Tech stack**: To be determined — but must support scheduled jobs and email delivery
- **API**: Flight API required with free/low-cost tier sufficient for weekly batch queries
- **Scope**: MVP is intentionally minimal — 3 ideas, fixed city, one email per week

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Fixed origin (Zagreb) | Simplifies MVP — no user config needed | — Pending |
| 3 ideas per email | Enough variety without overwhelming | — Pending |
| Flight API (not scraping) | More reliable and ToS-compliant | — Pending |

---
*Last updated: 2026-02-19 after initialization*
