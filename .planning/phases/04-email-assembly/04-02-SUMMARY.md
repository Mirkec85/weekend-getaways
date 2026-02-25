# 04-02 Summary — Send Script Orchestrator

**Status:** Complete
**Date:** 2026-02-25

## What was built

`pipeline/send.ts` (210 lines) — the full send orchestrator:

1. Inline `.env.local` loader (copy of index.ts pattern) so Supabase client is initialised with env vars before any `require()` runs
2. `require()` for `./cache` and `../lib/db` (env-dependent, must not be hoisted by TypeScript)
3. Normal `import` for `@react-email/components`, `react`, `WeeklyDeals`, `resend`, `date-fns`
4. `addUtmParams()` — appends UTM params via URL API (handles existing query params in Kiwi deep-links)
5. `formatObservedCET()` — UTC+1 offset applied manually (no date-fns-tz needed); format: "EEE dd MMM HH:mm CET"
6. `formatDateLabel()` — formats depart/return as "EEE dd MMM"
7. Loads `blurbs.json` and `city-images.json` via `require()`
8. Builds `DealCard[]` from `deals_cache` rows — maps all fields, includes `imageUrl` from city-images
9. Fetches only `active` subscribers with `id, email, unsubscribe_token`
10. Pre-checks `send_log` and skips already-sent subscribers (idempotency gate)
11. Per-subscriber HTML render inside batch loop — each subscriber gets their personalised `unsubscribeUrl`
12. `resend.batch.send(chunk, { idempotencyKey })` — max 100 per call, key = `weekly-send/{weekKey}/batch-{n}`
13. Upserts `send_log` with `ignoreDuplicates: true` — retry-safe
14. Failure path: upserts failed rows to `send_log` with `status: 'failed'` before rethrowing

## Template design changes (applied at human checkpoint)

- `WeeklyDeals.tsx` updated to full-width (removed `maxWidth: 600px` / `margin: 0 auto` from containerStyle)
- Added `imageUrl?: string` to `DealCard` interface
- City photo in 180px left column (`Row` + `Column` + `Img`), deal text in right column
- Falls back to single-column layout when `imageUrl` is undefined
- `DealCardText` extracted as a sub-component to avoid duplication

## New files

- `pipeline/send.ts` — send orchestrator
- `pipeline/emails/WeeklyDeals.tsx` — updated template (full-width, image layout)
- `data/city-images.json` — 65 IATA codes → Unsplash source URLs

## Key decisions

- Per-subscriber render (O(n)) is acceptable: React Email render ~10ms/call; 1000 subs = ~10s, well within GitHub Actions limits
- `unsubscribeUrl` built per-subscriber from `unsubscribe_token` (confirmed in subscriber select)
- City images use Unsplash source URLs (`source.unsplash.com/360x240/?{city}`) — can be replaced with stable CDN URLs before launch

## Verification

- `tsc --noEmit` passes with zero errors
- Dry run without deals: exits cleanly with "No deals cached" message
- `pipeline/emails/preview.html` generated and approved by human review (full-width layout, city images on left, text on right)
