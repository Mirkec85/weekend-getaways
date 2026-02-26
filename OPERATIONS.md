# Operations Runbook

This document is the operator reference for the weekly flight deals pipeline. It covers secrets setup, the kill-switch, monitoring, keepalive, manual triggering, and troubleshooting. No code reading required.

---

## 1. Weekly Pipeline Overview

**What:** Automated flight deal newsletter sent every Thursday at approximately 08:00 CET.

**How:** GitHub Actions cron triggers two pipeline scripts in sequence:
1. `pipeline/index.ts` — fetches flight deals from Kiwi Tequila, caches them in Supabase for the current week
2. `pipeline/send.ts` — reads the cached deals, renders the email template, and sends it to all active subscribers via Resend

**Idempotency:** Both scripts check a `week_key` (ISO year + week number) before doing work. If the current week's data already exists, the script exits cleanly without re-fetching or re-sending. This means the workflow is safe to re-run at any time — subscribers will never receive duplicate emails.

---

## 2. Required GitHub Secrets

Navigate to: `https://github.com/{owner}/{repo}/settings/secrets/actions`

All 7 secrets must be present before the workflow will function. Missing secrets cause the pipeline step to fail with an error logged in the Actions run.

| Secret | Source | Used By |
|--------|--------|---------|
| `SUPABASE_URL` | Supabase project → Settings → API → Project URL | index.ts, send.ts |
| `SUPABASE_ANON_KEY` | Supabase project → Settings → API → anon/public key | index.ts, send.ts |
| `KIWI_API_KEY` | Kiwi Tequila dashboard → API Keys | index.ts |
| `RESEND_API_KEY` | Resend dashboard → API Keys | send.ts |
| `RESEND_FROM_ADDRESS` | Verified sender email (e.g. `hello@yourdomain.com`) | send.ts |
| `NEXT_PUBLIC_BASE_URL` | Production URL (e.g. `https://your-app.vercel.app`) | send.ts |
| `HEALTHCHECKS_PING_URL` | Healthchecks.io → Check → copy ping URL | ping-success, ping-failure jobs |

**How to add a secret:** Click "New repository secret", enter the name exactly as shown above, paste the value, click "Add secret".

---

## 3. Kill-Switch

The kill-switch lets you suppress a Thursday send without touching code or disabling the workflow.

- **Variable:** `SEND_ENABLED` (repository variable — NOT a secret)
- **Location:** `https://github.com/{owner}/{repo}/settings/variables/actions`
- **Note:** Uses `vars` context (not `secrets`) because GitHub secrets cannot be read in job `if:` conditions. `SEND_ENABLED` is not sensitive, so using `vars` is correct.

| State | Effect |
|-------|--------|
| Variable unset (default) | Pipeline runs normally — unset returns `''`, which is not `'false'` |
| `SEND_ENABLED` = `true` | Pipeline runs normally |
| `SEND_ENABLED` = `false` | `run-pipeline` job is skipped; no fetch, no send, no HC ping |

**To disable:** Set `SEND_ENABLED` to `false`. Takes effect on the next cron fire or manual trigger.

**To re-enable:** Delete the variable, or set the value back to `true`.

---

## 4. Healthchecks.io Monitoring

Healthchecks.io provides a dead man's switch — if no ping arrives within the expected window, you receive an alert.

**One-time setup:**
1. Go to [healthchecks.io](https://healthchecks.io) and create a new check
2. Name: `Weekly Pipeline`
3. Schedule type: Simple
4. Period: `1 week`
5. Grace: `4 hours`
6. Copy the ping URL (format: `https://hc-ping.com/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
7. Add the ping URL as the `HEALTHCHECKS_PING_URL` GitHub secret (see Section 2)

**How pings work:**
- **Success ping:** Sent automatically after every successful `run-pipeline` job completion
- **Failure ping:** Sent automatically if the `run-pipeline` job fails (appends `/fail` to the ping URL)
- **Alert:** If no ping arrives by Thursday 08:00 CET + 4 hours, Healthchecks.io notifies you via email (or your configured alert channel)

**DST note:** The workflow has two cron entries — one for CET (winter) and one for CEST (summer). During DST transition weeks, both crons may fire within one hour of each other. The second run exits cleanly via idempotency guards and still sends a success ping. Healthchecks.io will receive two pings that week, which is normal.

---

## 5. Keepalive

GitHub automatically disables cron schedules after 60 days of repository inactivity. For a newsletter repo with infrequent commits, this would silently stop the Thursday sends.

- **How it works:** `keepalive.yml` runs on the 1st of every month and uses the [gautamkrishnar/keepalive-workflow@v2](https://github.com/gautamkrishnar/keepalive-workflow) action to register GitHub API activity without making commits
- **No configuration needed:** The workflow uses the automatic `GITHUB_TOKEN` — no secrets required
- **Verify:** Go to Actions → "Keepalive" workflow to see monthly run history

---

## 6. Manual Trigger

You can trigger the pipeline at any time without waiting for Thursday's cron.

1. Go to your GitHub repo → **Actions** tab
2. In the left sidebar, click **"Weekly Pipeline"**
3. Click **"Run workflow"** (top right of the workflow list)
4. Select the branch you want to run from (usually `main`)
5. Click **"Run workflow"**

The pipeline is idempotent — triggering it mid-week is safe. If deals have already been cached and sent this week, both scripts will exit cleanly without re-sending.

---

## 7. Troubleshooting

Open the failing run in Actions → click on the failing job → expand the failing step to read the logs.

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `supabaseUrl is required` | `SUPABASE_URL` secret missing or misspelled | Add/correct the secret in repo Settings → Secrets |
| `KIWI_API_KEY is not set` | `KIWI_API_KEY` secret missing | Add the secret in repo Settings → Secrets |
| `RESEND_API_KEY is not set` | `RESEND_API_KEY` secret missing | Add the secret in repo Settings → Secrets |
| Pipeline succeeds but Healthchecks.io shows "Late" | Workflow was skipped (kill-switch?) or cron was suspended | Check if `SEND_ENABLED` is `false`; if cron was disabled, push a commit or manually trigger the workflow |
| Two runs on same Thursday | Normal during DST transition (CET/CEST switchover) | No action needed — second run exits cleanly via idempotency; two HC pings are expected |
| `run-pipeline` job skipped (grey) | Kill-switch is active | Check `SEND_ENABLED` variable — set to `true` or delete to re-enable |
| Emails sent but links are wrong | `NEXT_PUBLIC_BASE_URL` secret points to wrong URL | Update the secret to match your production Vercel URL |
| Emails not delivered / bounce rate high | `RESEND_FROM_ADDRESS` not verified or DNS not configured | Verify domain DNS (SPF/DKIM/DMARC) in Resend dashboard |
