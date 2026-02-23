# Phase 2: User Setup Required

**Generated:** 2026-02-23
**Phase:** 02-subscriber-sub-system
**Status:** Incomplete

Complete these items for Resend webhook signature verification to function. Claude automated all code; these items require access to the Resend dashboard.

## Environment Variables

| Status | Variable | Source | Add to |
|--------|----------|--------|--------|
| [ ] | `RESEND_WEBHOOK_SECRET` | Resend Dashboard -> Webhooks -> [your endpoint] -> Signing secret | `.env.local` and Vercel |

## Dashboard Configuration

- [ ] **Create webhook endpoint in Resend**
  - Location: Resend Dashboard -> Webhooks -> Add Endpoint
  - Endpoint URL: `https://YOUR_DOMAIN/api/webhooks/resend`
  - Events to subscribe: `email.bounced`, `email.complained`
  - After creation: copy the **Signing Secret** (starts with `whsec_`) — this is your `RESEND_WEBHOOK_SECRET`

## Local Development

For local webhook testing, use ngrok to expose localhost:

```bash
ngrok http 3000
```

Register the ngrok URL in Resend dashboard: `https://<ngrok-subdomain>.ngrok.io/api/webhooks/resend`

Use the signing secret from that ngrok endpoint as `RESEND_WEBHOOK_SECRET` in `.env.local`.

## Verification

After completing setup, verify the webhook handler rejects invalid signatures:

```bash
curl -X POST http://localhost:3000/api/webhooks/resend \
  -H "Content-Type: application/json" \
  -H "svix-id: msg_test123" \
  -H "svix-timestamp: 1234567890" \
  -H "svix-signature: v1,invalidbase64signature" \
  -d '{"type":"email.bounced","data":{"to":["test@test.com"]}}'
```

Expected: HTTP 400 `{"error":"Invalid signature"}`

For end-to-end verification after deployment:
1. In Resend Dashboard -> Webhooks, use "Send test" to send a test `email.bounced` event
2. Check Supabase subscribers table — matching active subscriber should now have `status = 'bounced'`
3. Send test `email.complained` — matching active subscriber should have `status = 'unsubscribed'`
4. Alternatively, send a real email to `bounced@resend.dev` (Resend test bounce address) to trigger a genuine bounce

---

**Once all items complete:** Mark status as "Complete" at top of file.
