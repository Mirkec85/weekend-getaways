# Feature Landscape

**Domain:** Flight-deal email newsletter / weekly travel digest service
**Researched:** 2026-02-19

---

## Competitive Landscape Reference

| Product | Model | Core mechanic |
|---------|-------|---------------|
| Going.com (fmr. Scott's Cheap Flights) | Freemium subscription | Error fares + curated deals, origin-based alerts |
| Jack's Flight Club | Freemium subscription | UK/EU focused curated deals, origin-based alerts |
| Thrifty Traveler Premium | Paid subscription | Points/miles + cash deals, US-focused |
| Secret Flying | Free, ad-supported | Error fares, broad coverage, no curation |
| Hopper | Free app | Predictive fare alerts, "watch" mechanic |

---

## Table Stakes

Features users expect. Missing any = product feels broken.

| Feature | Why Expected | Complexity |
|---------|--------------|------------|
| Clear destination + price in subject line | Users open/ignore based on subject | Low |
| Round-trip dates shown | Users need to know if dates work before clicking | Low |
| Booking link direct to airline/aggregator | Primary CTA; one-click to book | Low |
| Price in a single clear currency (EUR) | Price confusion kills trust | Low |
| Unsubscribe link | Legal requirement (GDPR) + trust signal | Low |
| Mobile-readable email layout | 60–80% of opens are mobile | Medium |
| Predictable send schedule | "Every Thursday" sets expectations | Low |
| Destination name + country (not IATA code) | "Split, Croatia" not "SPU" | Low |
| Basic trip context (weekend-feasible framing) | "3-night weekend" vs "14-night itinerary" | Low |

---

## Differentiators

Features that create retention and word-of-mouth when done well.

| Feature | Value Proposition | Complexity |
|---------|-------------------|------------|
| Strong editorial voice / personality | Users subscribe to "a person," not a price feed | Low |
| Hotel cost estimate per night | Total trip cost context, not just flights | Low-Med |
| "Why this destination" blurb | Converts fence-sitters with 2-sentence pitch | Low |
| Curated to 3 picks only | Scarcity signal — 3 great beats 30 mediocre | Low |
| Fixed Zagreb origin = hyper-relevant | Every deal is immediately actionable | None (by design) |
| Weekend-trip framing | Targets employed adults with limited PTO | Low |
| Booking urgency signal | "Book before Sunday" drives action | Low |
| Plain-text fallback email | Reaches aggressive email clients | Low |

---

## Anti-Features (Do NOT Build in MVP)

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Multi-origin support | Doubles complexity before single origin is validated | Hard-code ZAG |
| Real-time / instant alerts | Requires always-on monitoring; misaligned with weekly model | Thursday batch job |
| User preference filters | Adds profile/settings system before core value proven | Editorial curation IS the filter |
| Price history charts | Requires time-series storage; no value for "book this weekend" | State price, one comparison note |
| Points/miles conversion | Separate audience, separate data sources | Cash prices only |
| App or push notifications | App Store approval, platform maintenance | Email is the channel |
| Social sharing / referral system | Need subscribers before viral loops matter | Good content first |
| Account login / subscriber dashboard | Adds auth flows before anyone asks for it | Unsubscribe link only |
| Archived past deals | Deals expire; no user value | Deals live only in the email |
| AI-generated destination copy | Produces generic copy that kills editorial voice | Write 3 blurbs manually (15 min/week) |

---

## Feature Dependencies

```
Landing page (signup form)
        |
        v
Email list exists
        |
        v
Weekly send  <---  Flight data fetch (Thursday cron, ZAG origin)
                            |
                   Deal selection (3 picks)
                            |
                   Hotel cost lookup (per destination)
                            |
                   Email assembly (destination, price, dates, hotel, blurb, booking link)
                            |
                   ESP send (Resend/Postmark)
```

**Critical path dependencies:**
- Signup form must exist BEFORE first send to real subscribers
- Flight API contract confirmed BEFORE building email assembly
- GDPR unsubscribe wired BEFORE first send (legal requirement, not optional)
- SPF/DKIM/DMARC DNS configured BEFORE first send or Gmail will spam-folder everything

---

## MVP: Must Ship on Day 1

1. Email signup landing page — email field, GDPR consent checkbox, double opt-in confirmation
2. Flight data fetch — Thursday cron, ZAG departures, 3 cheapest weekend options
3. Hotel cost per destination — even a static lookup; one number per destination is enough
4. Formatted HTML email — destination, price, dates, hotel estimate, booking link, blurb, unsubscribe
5. Reliable send via ESP — not raw SMTP
6. Mobile-readable layout — single-column, tested on iOS Mail and Gmail Android

## Post-MVP (Defer)

| Feature | Reason to Defer |
|---------|----------------|
| Multiple origins | Validate single origin first |
| Subscriber preferences | Zero subscribers have asked yet |
| Referral program | Need subscribers before viral loops |
| Price history charts | No time-series infrastructure |
| Custom analytics dashboard | Track opens/clicks in ESP |
| Points/miles deals | Separate audience |

---

*The one metric that proves MVP success: first email sends to at least one real subscriber and the booking link works correctly.*

---
*Research date: 2026-02-19*
