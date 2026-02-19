# Phase 1: Foundation - Context

**Gathered:** 2026-02-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Provision the database and configure email authentication DNS records before any subscriber is collected or any email is sent. This phase delivers: Supabase PostgreSQL with the required schema, and SPF/DKIM/DMARC records verified on the sending domain. Nothing user-facing is built here — this is the infrastructure every other phase depends on.

</domain>

<decisions>
## Implementation Decisions

### Platform choice
- **Hosting:** Vercel + Supabase (Next.js on Vercel, PostgreSQL on Supabase)
- **Cron scheduler:** GitHub Actions (weekly pipeline trigger, free tier)
- **Email delivery:** Resend (React Email compatible, generous free tier)
- **Pipeline language:** TypeScript (Node.js) — same ecosystem as Next.js and Resend

### Project structure
- **Repo:** Single monorepo — Next.js app at the root, pipeline scripts in a `/pipeline` subfolder
- **Structure:** Not Turborepo — keep it simple: Next.js conventions at root, `/pipeline` as a plain TypeScript directory with its own tsconfig and entry point

### Claude's Discretion
- Exact Supabase project region (pick closest to Zagreb — EU West)
- Database connection pooling configuration
- TypeScript / tsconfig settings for the pipeline scripts
- `.env` structure and which secrets go where

</decisions>

<specifics>
## Specific Ideas

- The pipeline script will live in `/pipeline` and be invoked by GitHub Actions — it's a standalone Node.js script, not a Next.js API route
- Supabase will be the single database used by both the Next.js app (subscriber signup) and the pipeline script (read subscribers, write deals + send logs)
- Sending domain DNS setup (SPF/DKIM/DMARC) will be verified with mail-tester.com before any other phase touches email

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-02-19*
