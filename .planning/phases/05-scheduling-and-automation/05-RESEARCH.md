# Phase 5: Scheduling and Automation - Research

**Researched:** 2026-02-25
**Domain:** GitHub Actions cron scheduling, dead man's switch monitoring, kill-switch pattern, TypeScript pipeline orchestration
**Confidence:** HIGH

---

## Summary

This phase wires the two existing pipeline scripts (`pipeline/index.ts` and `pipeline/send.ts`) into a single GitHub Actions workflow that fires every Thursday at approximately 08:00 CET. No new npm dependencies are required — GitHub Actions provides the scheduling runtime, Healthchecks.io provides free external monitoring via HTTP ping, and the kill-switch is implemented using GitHub's built-in repository variables (`vars` context).

The core challenge is the CET/CEST DST offset shift. GitHub Actions cron runs in UTC only. CET is UTC+1 (winter), CEST is UTC+2 (summer). To target 08:00 CET/CEST year-round, the workflow must declare **two cron triggers**: `0 7 * * 4` (winter, CET=UTC+1) and `0 6 * * 4` (summer, CEST=UTC+2). The idempotency guard already built into `pipeline/index.ts` (`hasCachedDeals`) and `pipeline/send.ts` (send_log pre-check) means a double-fire on the same Thursday is harmless — the second run exits without re-sending.

GitHub Actions scheduled workflows are disabled automatically after 60 days of repository inactivity. For a newsletter product with infrequent code commits, this is a real operational risk. The keepalive-workflow action (`gautamkrishnar/keepalive-workflow@v2`) prevents this by using the GitHub API to register activity before the 60-day threshold.

**Primary recommendation:** One workflow file (`.github/workflows/weekly-pipeline.yml`) with dual cron triggers, sequential job steps for index.ts then send.ts, secrets passed as step-level env vars, Healthchecks.io pinged in a separate `ping-success`/`ping-failure` job pair, kill-switch via `vars.SEND_ENABLED != 'false'` job condition, plus a separate `keepalive.yml` to prevent schedule suspension.

---

## Standard Stack

### Core
| Tool | Version/Config | Purpose | Why Standard |
|------|---------------|---------|--------------|
| GitHub Actions | N/A (hosted) | Cron scheduler and CI runner | Already decided in Phase 1; zero infrastructure to manage |
| `actions/checkout@v4` | v4 | Check out repo code | Official action, required for all workflows |
| `actions/setup-node@v4` | v4 | Install Node.js with npm cache | Official action; `cache: 'npm'` speeds up runs significantly |
| Healthchecks.io | Free tier | Dead man's switch monitoring | Free, purpose-built for this use case; ping-based, no SDK needed |
| `gautamkrishnar/keepalive-workflow@v2` | v2 | Prevent 60-day schedule suspension | Community standard for long-running cron repos |

### Supporting
| Tool | Version/Config | Purpose | When to Use |
|------|---------------|---------|-------------|
| `curl` | System (ubuntu-latest) | HTTP ping to Healthchecks.io | Always — curl is available on all ubuntu-latest runners |
| GitHub repository variables (`vars`) | N/A | Kill-switch flag storage | Kill-switch (`SEND_ENABLED`) — non-secret, UI-editable without code change |
| GitHub repository secrets | N/A | API key storage | All sensitive keys: SUPABASE_URL, SUPABASE_ANON_KEY, KIWI_API_KEY, RESEND_API_KEY, HEALTHCHECKS_PING_URL |

### Alternatives Considered
| Standard Choice | Alternative | Why Standard Wins |
|----------------|-------------|-------------------|
| `vars.SEND_ENABLED` for kill-switch | Secret-based kill-switch | Secrets cannot be used in `if:` conditions; vars can |
| Dual cron triggers for DST | Single UTC cron | Single cron drifts 1 hour seasonally — 07:00 CET in winter, 08:00 CEST in summer. Dual crons hold the wall-clock time stable |
| Separate keepalive.yml | Commit-based activity | API mode (`use_api: true`) avoids polluting git history |
| Step-level `env:` for secrets | Workflow-level `env:` | Step-level limits secret exposure to only the steps that need them |

**Installation:** No new npm packages required. All tooling is GitHub-hosted or HTTP-based.

---

## Architecture Patterns

### Recommended File Structure
```
.github/
├── workflows/
│   ├── weekly-pipeline.yml     # Main cron workflow
│   └── keepalive.yml           # Prevents 60-day schedule suspension
pipeline/
├── index.ts                    # Fetch + cache deals (already built)
└── send.ts                     # Render + send emails (already built)
```

### Pattern 1: Dual-Cron for DST-Stable Scheduling

**What:** Declare two `schedule` entries in the workflow `on:` block — one for CET (winter) and one for CEST (summer). The idempotency guards in the pipeline scripts prevent double-sends on the rare week when both fire.

**When to use:** Any time a UTC-only cron scheduler must approximate a local wall-clock time across DST boundaries.

**CET/CEST UTC offset facts (verified):**
- CET (winter): UTC+1 — active from last Sunday in October to last Sunday in March
- CEST (summer): UTC+2 — active from last Sunday in March to last Sunday in October
- Europe changes clocks at 01:00 UTC

**Result:** 08:00 CET = 07:00 UTC; 08:00 CEST = 06:00 UTC

```yaml
# Source: GitHub Actions scheduling docs + UTC/CET conversion
on:
  schedule:
    - cron: '0 7 * * 4'   # Thursdays 08:00 CET (UTC+1, winter)
    - cron: '0 6 * * 4'   # Thursdays 08:00 CEST (UTC+2, summer)
  workflow_dispatch: {}    # Allow manual trigger via GitHub UI
```

**Important:** During the weeks when DST transitions, both crons may fire within an hour of each other. The idempotency guards (`hasCachedDeals` + send_log pre-check) make this safe — the second run exits immediately.

### Pattern 2: Sequential Pipeline Steps in One Job

**What:** Run `index.ts` then `send.ts` as sequential steps within a single job. If `index.ts` fails, the job fails before `send.ts` is attempted.

**When to use:** When step 2 depends on step 1's output (deal cache written before send reads it).

```yaml
# Source: GitHub Actions docs (docs.github.com/en/actions)
jobs:
  run-pipeline:
    runs-on: ubuntu-latest
    if: ${{ vars.SEND_ENABLED != 'false' }}
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Fetch and cache deals (index.ts)
        run: npx ts-node --project pipeline/tsconfig.json pipeline/index.ts
        env:
          KIWI_API_KEY: ${{ secrets.KIWI_API_KEY }}
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
          NEXT_PUBLIC_BASE_URL: ${{ secrets.NEXT_PUBLIC_BASE_URL }}

      - name: Send emails (send.ts)
        run: npx ts-node --project pipeline/tsconfig.json pipeline/send.ts
        env:
          RESEND_API_KEY: ${{ secrets.RESEND_API_KEY }}
          RESEND_FROM_ADDRESS: ${{ secrets.RESEND_FROM_ADDRESS }}
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
          NEXT_PUBLIC_BASE_URL: ${{ secrets.NEXT_PUBLIC_BASE_URL }}
```

**Critical note on .env.local:** In GitHub Actions, `.env.local` does NOT exist. The pipeline scripts use `if (fs.existsSync(envPath))` before loading it — this branch is simply skipped in CI. Env vars must be passed via the workflow `env:` block at step level. Both `index.ts` and `send.ts` already read from `process.env` correctly; they just need the vars injected.

### Pattern 3: Healthchecks.io Dead Man's Switch via Job Dependencies

**What:** Add `ping-success` and `ping-failure` jobs that depend on `run-pipeline`. The success job runs only if `run-pipeline` succeeded; the failure job runs only if it failed. Healthchecks.io alerts the operator if no success ping arrives within the configured window.

**When to use:** Always — this is the required monitoring strategy per success criteria.

```yaml
# Source: healthchecks.io/docs/github_actions/
  ping-success:
    runs-on: ubuntu-latest
    needs: [run-pipeline]
    if: ${{ success() }}
    steps:
      - name: Ping Healthchecks.io success
        run: curl -m 10 --retry 5 ${{ secrets.HEALTHCHECKS_PING_URL }}

  ping-failure:
    runs-on: ubuntu-latest
    needs: [run-pipeline]
    if: ${{ failure() }}
    steps:
      - name: Ping Healthchecks.io failure
        run: curl -m 10 --retry 5 ${{ secrets.HEALTHCHECKS_PING_URL }}/fail
```

**Healthchecks.io configuration:**
- Create a check with period = 1 week, schedule type = "Simple"
- Set grace period to 4 hours (accounts for GHA scheduling delays + pipeline runtime)
- Store the ping URL as a GitHub secret (`HEALTHCHECKS_PING_URL`) — never hardcode it
- The operator receives an alert if no ping arrives within: Thursday 08:00 CET + 4 hours grace

**Optional /start ping:** For execution time measurement, add a `/start` ping at the beginning of `run-pipeline`. This lets Healthchecks.io detect if the job started but hung. Not strictly required for MVP but adds observability.

### Pattern 4: Kill-Switch via Repository Variable

**What:** A `SEND_ENABLED` repository variable (not a secret) checked in the `run-pipeline` job's `if:` condition. Setting it to `'false'` in GitHub's UI skips the job without any code change or cron modification.

**When to use:** Whenever the operator needs to suppress a Thursday send (holiday, bad data, etc.).

```yaml
# Source: GitHub Actions vars context docs (docs.github.com/en/actions/reference/workflows-and-actions/contexts#vars-context)
jobs:
  run-pipeline:
    if: ${{ vars.SEND_ENABLED != 'false' }}
    # ...
```

**Key facts about vars vs secrets:**
- `vars` context values ARE readable in `if:` conditions at job level — verified
- `secrets` context values are NOT available in `if:` conditions (GitHub security restriction)
- If `SEND_ENABLED` is not set (variable doesn't exist), `vars.SEND_ENABLED` returns empty string `''`, which is NOT equal to `'false'` — so the default behavior (no variable set = runs) is safe
- Set in: GitHub repo → Settings → Secrets and variables → Actions → Variables tab → New repository variable

**Operator workflow:** Navigate to repo Variables → change `SEND_ENABLED` to `'false'` → pipeline skips next Thursday → change back to `'true'` (or delete the variable) to re-enable.

### Pattern 5: Keepalive Workflow to Prevent 60-Day Suspension

**What:** A separate workflow that fires on a schedule and prevents GitHub from disabling cron triggers due to inactivity.

**When to use:** Any repository where cron is the primary purpose but code commits are infrequent (e.g., a newsletter pipeline).

```yaml
# .github/workflows/keepalive.yml
# Source: https://github.com/marketplace/actions/keepalive-workflow
name: Keepalive
on:
  schedule:
    - cron: '0 12 1 * *'   # First of each month at noon UTC
  workflow_dispatch: {}

jobs:
  keepalive:
    runs-on: ubuntu-latest
    permissions:
      actions: write
    steps:
      - uses: actions/checkout@v4
      - uses: gautamkrishnar/keepalive-workflow@v2
```

### Anti-Patterns to Avoid

- **Passing secrets at workflow level:** Defines them globally for all jobs. Use step-level `env:` — limits exposure.
- **Using `secrets.SEND_ENABLED` for kill-switch:** Secrets cannot be read in `if:` conditions. Use `vars.SEND_ENABLED` instead.
- **Single cron trigger in UTC:** `0 7 * * 4` stays at 07:00 UTC year-round — that's 08:00 in winter (CET) but 09:00 in summer (CEST). Use dual crons.
- **Scheduling at exact top of hour:** `0 8 * * 4` is peak GitHub Actions load time. Scheduling at `:00` increases delay and drop probability. Use `:05` or `:00` but be aware of delays.
- **Not using `workflow_dispatch`:** Without it, there is no way to manually trigger the workflow for testing without pushing a commit. Always include it.
- **Running send.ts before index.ts succeeds:** Don't use `continue-on-error: true` on the fetch step — if deals aren't cached, send.ts should not run.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Dead man's switch alerting | Custom webhook receiver, email alerter | Healthchecks.io | Free, handles alert routing, has integrations (email, Slack, PagerDuty), configurable grace periods |
| Schedule suspension prevention | Custom GitHub API calls in workflow | `gautamkrishnar/keepalive-workflow@v2` | Handles the exact 60-day inactivity rule, tested community action |
| DST timezone conversion | Custom time-zone logic in workflow steps | Dual cron entries + existing idempotency guards | The pipeline already has guards; dual cron is the standard pattern when timezone support is absent |
| Kill-switch UI | Custom admin endpoint or config file | GitHub repository variables | Zero additional infrastructure; operator can flip it via GitHub UI in seconds |

**Key insight:** GitHub Actions has no timezone support for cron. The correct mental model is "schedule twice, let idempotency guards handle overlap" rather than attempting timezone calculations at runtime.

---

## Common Pitfalls

### Pitfall 1: .env.local Does Not Exist in CI
**What goes wrong:** Pipeline scripts use `fs.existsSync(envPath)` to optionally load `.env.local`. In CI the file doesn't exist — that's correct and expected. BUT if an env var is missing from the workflow's `env:` block, `process.env.SUPABASE_URL` will be `undefined`, and the Supabase client created in `lib/db.ts` will fail silently or throw at the first query.
**Why it happens:** Developer tests locally with `.env.local`, workflow `env:` block is incomplete.
**How to avoid:** List every env var consumed by `lib/db.ts`, `pipeline/index.ts`, and `pipeline/send.ts` and map each to a secret. Verify by running the workflow once and checking logs.
**Warning signs:** "supabaseUrl is required" or similar errors in workflow logs; Supabase client errors at the first database call.

### Pitfall 2: GitHub Actions Scheduling Delays
**What goes wrong:** Cron fires 15-30 minutes late, or occasionally doesn't fire at all during high-load periods.
**Why it happens:** GitHub documented: "The `schedule` event can be delayed during periods of high loads... High load times include the start of every hour. If the load is sufficiently high enough, some queued jobs may be dropped."
**How to avoid:** Configure Healthchecks.io grace period to at least 2 hours (4 hours recommended for safety). The pipeline doesn't need to run at exactly 08:00 — a few hours of slack is fine for a weekly newsletter. Do NOT schedule at `0 * * * *` (top of hour).
**Warning signs:** Consistently late runs in the workflow history; Healthchecks.io false alerts.

### Pitfall 3: DST Transition Week Double-Fire
**What goes wrong:** On the week when Europe switches from CEST to CET (last Sunday of October), both `0 6 * * 4` and `0 7 * * 4` may fire on Thursday with the crons landing close together. Similarly, on the Spring Forward week, neither cron may match cleanly.
**Why it happens:** Dual cron is an approximation; during the transition week both entries are active.
**How to avoid:** The existing idempotency guards in `index.ts` (`hasCachedDeals`) and `send.ts` (send_log pre-check) fully handle this. A second run on the same Thursday exits immediately without any side effects. No special handling needed — just document it.
**Warning signs:** Two workflow runs completing on the same Thursday — both completing with "already cached" / "already sent" logs is correct and expected.

### Pitfall 4: vars.SEND_ENABLED Behavior When Variable Is Unset
**What goes wrong:** Developer creates `SEND_ENABLED` variable, sets it to `'false'` to suppress a send, then deletes the variable (instead of setting it back to `'true'`). If the condition were `vars.SEND_ENABLED == 'true'`, deletion would permanently disable sends.
**Why it happens:** Intuitive but wrong condition direction.
**How to avoid:** Use `vars.SEND_ENABLED != 'false'` as the condition. When the variable doesn't exist, `vars.SEND_ENABLED` returns `''`, which is NOT equal to `'false'` — the pipeline runs. Only explicit `'false'` suppresses it.
**Warning signs:** Pipeline stops running after an operator "re-enables" it by deleting the variable.

### Pitfall 5: 60-Day Schedule Suspension
**What goes wrong:** No code commits for 60 days → GitHub silently disables the scheduled trigger → newsletter stops sending → no alert (Healthchecks.io will alert, but only if you notice it).
**Why it happens:** GitHub documented behavior for inactive repositories. A newsletter with stable code may go months without commits.
**How to avoid:** Add `keepalive.yml` from day one.
**Warning signs:** Workflow history shows no runs after a quiet period; Healthchecks.io "late" alert fires.

### Pitfall 6: Secrets vs vars Context in if Conditions
**What goes wrong:** `if: ${{ secrets.SEND_ENABLED == 'false' }}` silently evaluates to false because secrets are not accessible in `if:` conditionals — GitHub returns empty string for security reasons.
**Why it happens:** Developer uses a secret for the kill-switch because it sounds more controlled.
**How to avoid:** `SEND_ENABLED` is NOT sensitive — use `vars` not `secrets`. The value `'false'` or `'true'` is not a credential.
**Warning signs:** Kill-switch has no effect; workflow always runs regardless of the secret value.

---

## Code Examples

Verified patterns from official sources:

### Complete weekly-pipeline.yml

```yaml
# Source: GitHub Actions official docs + healthchecks.io/docs/github_actions/
name: Weekly Pipeline

on:
  schedule:
    - cron: '0 7 * * 4'    # Thursday 08:00 CET (UTC+1, winter Nov-Mar)
    - cron: '0 6 * * 4'    # Thursday 08:00 CEST (UTC+2, summer Apr-Oct)
  workflow_dispatch: {}     # Manual trigger via GitHub UI

jobs:
  run-pipeline:
    runs-on: ubuntu-latest
    if: ${{ vars.SEND_ENABLED != 'false' }}

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Fetch and cache deals
        run: npx ts-node --project pipeline/tsconfig.json pipeline/index.ts
        env:
          KIWI_API_KEY: ${{ secrets.KIWI_API_KEY }}
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
          NEXT_PUBLIC_BASE_URL: ${{ secrets.NEXT_PUBLIC_BASE_URL }}

      - name: Send emails
        run: npx ts-node --project pipeline/tsconfig.json pipeline/send.ts
        env:
          RESEND_API_KEY: ${{ secrets.RESEND_API_KEY }}
          RESEND_FROM_ADDRESS: ${{ secrets.RESEND_FROM_ADDRESS }}
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
          NEXT_PUBLIC_BASE_URL: ${{ secrets.NEXT_PUBLIC_BASE_URL }}

  ping-success:
    runs-on: ubuntu-latest
    needs: [run-pipeline]
    if: ${{ success() }}
    steps:
      - name: Ping Healthchecks.io (success)
        run: curl -fsS -m 10 --retry 5 ${{ secrets.HEALTHCHECKS_PING_URL }}

  ping-failure:
    runs-on: ubuntu-latest
    needs: [run-pipeline]
    if: ${{ failure() }}
    steps:
      - name: Ping Healthchecks.io (failure)
        run: curl -fsS -m 10 --retry 5 ${{ secrets.HEALTHCHECKS_PING_URL }}/fail
```

### Complete keepalive.yml

```yaml
# Source: https://github.com/marketplace/actions/keepalive-workflow
name: Keepalive

on:
  schedule:
    - cron: '0 12 1 * *'   # 1st of each month at 12:00 UTC
  workflow_dispatch: {}

jobs:
  keepalive:
    runs-on: ubuntu-latest
    permissions:
      actions: write
    steps:
      - uses: actions/checkout@v4
      - uses: gautamkrishnar/keepalive-workflow@v2
```

### Healthchecks.io Ping URL Formats

```bash
# Source: healthchecks.io/docs/http_api/
# Success ping (call at end of successful run):
curl -fsS -m 10 --retry 5 https://hc-ping.com/<uuid>

# Failure ping (call when job fails):
curl -fsS -m 10 --retry 5 https://hc-ping.com/<uuid>/fail

# Optional: start ping (call at job start for execution time tracking):
curl -fsS -m 10 --retry 5 https://hc-ping.com/<uuid>/start

# Flags explained:
# -f  fail silently on HTTP errors (exit non-zero)
# -sS silent mode but show errors
# -m 10  max 10 second timeout
# --retry 5  retry up to 5 times
```

### Kill-Switch: Setting the Repository Variable

Navigate to: `https://github.com/{owner}/{repo}/settings/variables/actions`

To disable next Thursday's send:
1. Create variable: Name = `SEND_ENABLED`, Value = `false`
2. After the skipped Thursday, delete the variable (or set to `true`)

The workflow condition `if: ${{ vars.SEND_ENABLED != 'false' }}` means:
- Variable not set → `'' != 'false'` → true → pipeline runs (default)
- Variable = `'false'` → `'false' != 'false'` → false → pipeline skipped
- Variable = `'true'` → `'true' != 'false'` → true → pipeline runs

### Required GitHub Secrets to Configure

| Secret Name | Value Source |
|------------|-------------|
| `SUPABASE_URL` | Supabase project → Settings → API → Project URL |
| `SUPABASE_ANON_KEY` | Supabase project → Settings → API → anon/public key |
| `KIWI_API_KEY` | Kiwi Tequila dashboard |
| `RESEND_API_KEY` | Resend dashboard → API Keys |
| `RESEND_FROM_ADDRESS` | Verified sender email (e.g., `hello@yourdomain.com`) |
| `NEXT_PUBLIC_BASE_URL` | Production Vercel URL (e.g., `https://your-app.vercel.app`) |
| `HEALTHCHECKS_PING_URL` | Healthchecks.io → New Check → copy ping URL |

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|-----------------|--------|
| Single cron + timezone env var check at runtime | Dual cron + idempotency guards | Simpler, no runtime tz logic; guards already exist |
| `secrets` context for feature flags | `vars` context for non-sensitive flags | vars are readable in `if:` conditions; secrets are not |
| Manual keepalive commits | `gautamkrishnar/keepalive-workflow@v2` | No git history pollution |
| `actions/cache@v3` or v4 for node_modules | `actions/setup-node@v4` with `cache: 'npm'` | Official, integrated, handles cache key management automatically |

**Deprecated/outdated:**
- `actions/cache@v3` and older: Superseded by v5 (Node 24 runtime) as of Feb 2025, but setup-node@v4 with `cache: 'npm'` is preferred over manual cache configuration for npm projects
- Storing kill-switch in a secret: Never worked in `if:` conditions — always use `vars` for non-sensitive flags

---

## Open Questions

1. **Exact RESEND_FROM_ADDRESS value**
   - What we know: send.ts defaults to `onboarding@resend.dev` if not set; production requires a verified custom domain sender
   - What's unclear: Whether the custom domain is verified in Resend yet (Phase 1/4 setup)
   - Recommendation: Add as a secret even if it's `onboarding@resend.dev` during development — makes it easy to swap without code change

2. **NEXT_PUBLIC_BASE_URL in pipeline context**
   - What we know: send.ts uses `process.env.NEXT_PUBLIC_BASE_URL` to construct unsubscribe URLs
   - What's unclear: Whether the Vercel deployment URL is stable or changes per deploy
   - Recommendation: Use the production custom domain URL (not the vercel.app auto-generated URL) and set it as a secret

3. **Healthchecks.io grace period tuning**
   - What we know: GitHub Actions can delay up to 30+ minutes; pipeline runtime for fetch+send could be 2-5 minutes; grace period minimum is 1 minute
   - What's unclear: Real-world pipeline execution time (not tested end-to-end in CI yet)
   - Recommendation: Start with 4-hour grace period; reduce after observing actual run durations

4. **workflow_dispatch inputs for manual testing**
   - What we know: `workflow_dispatch` allows manual triggers via GitHub UI
   - What's unclear: Whether the team wants a dry-run input to test without actual sends
   - Recommendation: For Phase 5, keep it simple with no inputs — the existing idempotency guards prevent re-sends; manual testing can use the local `ts-node` commands

---

## Sources

### Primary (HIGH confidence)
- `https://docs.github.com/en/actions/writing-workflows/choosing-when-your-workflow-runs/events-that-trigger-workflows#schedule` — Cron syntax, UTC requirement, minimum interval, delay warning
- `https://docs.github.com/en/actions/reference/workflows-and-actions/contexts#vars-context` — vars context, kill-switch pattern, `if:` condition support
- `https://healthchecks.io/docs/http_api/` — Ping URL formats, /start /fail endpoints, curl pattern
- `https://healthchecks.io/docs/github_actions/` — GitHub Actions integration YAML example
- `https://healthchecks.io/docs/configuring_checks/` — Grace period and schedule configuration
- `https://docs.github.com/en/actions/automating-builds-and-tests/building-and-testing-nodejs` — setup-node, npm ci, secrets env pattern

### Secondary (MEDIUM confidence)
- `https://github.com/marketplace/actions/keepalive-workflow` — keepalive-workflow@v2 YAML, 60-day suspension mechanics, API mode vs commit mode
- `https://github.com/orgs/community/discussions/42133` — Community verification of `vars` context usage in `if:` conditions
- `https://en.wikipedia.org/wiki/Central_European_Time` + `https://en.wikipedia.org/wiki/Central_European_Summer_Time` — CET (UTC+1) and CEST (UTC+2) offset verification

### Tertiary (LOW confidence — validate before relying on)
- Multiple GitHub community discussions re: 15-30 minute scheduling delays — consistent pattern across reports but not in official docs; documented only as "may be delayed"
- DST transition week double-fire behavior — inferred from dual cron design + idempotency guards; no direct test of this exact scenario

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — GitHub Actions docs directly verified; Healthchecks.io docs directly verified
- Architecture patterns: HIGH — All patterns verified against official documentation and official GitHub Actions examples
- Pitfalls: MEDIUM/HIGH — .env.local and vars/secrets pitfalls are documented facts; scheduling delays are documented by GitHub; DST double-fire behavior is logically derived and covered by existing guards
- Kill-switch pattern: HIGH — vars context in `if:` conditions verified against official GitHub docs and community examples

**Research date:** 2026-02-25
**Valid until:** 2026-09-25 (GitHub Actions cron behavior stable; Healthchecks.io API stable; keepalive action actively maintained)
