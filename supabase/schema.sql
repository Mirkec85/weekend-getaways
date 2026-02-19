-- ============================================================
-- Last-Minute Weekend Getaways — Database Schema
-- Apply via: Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

-- ─── subscribers ─────────────────────────────────────────────
-- One row per subscriber. Status transitions:
--   pending → active (after double opt-in confirmation)
--   active → unsubscribed (after clicking unsubscribe link)
--   active → bounced (after hard bounce webhook from Resend)
CREATE TABLE subscribers (
  id                 BIGSERIAL PRIMARY KEY,
  email              TEXT        NOT NULL UNIQUE,
  status             TEXT        NOT NULL DEFAULT 'pending',
  -- status values: pending | active | unsubscribed | bounced
  unsubscribe_token  UUID        NOT NULL DEFAULT gen_random_uuid(),
  subscribed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_at       TIMESTAMPTZ,         -- set when double opt-in is confirmed
  unsubscribed_at    TIMESTAMPTZ          -- set when subscriber opts out
);

CREATE INDEX idx_subscribers_status ON subscribers(status);
CREATE INDEX idx_subscribers_token  ON subscribers(unsubscribe_token);

-- ─── deals_cache ─────────────────────────────────────────────
-- Stores the top 3 deals selected for a given week.
-- week_key format: 'YYYY-WNN' (e.g. '2026-W08')
-- UNIQUE(week_key, rank) ensures idempotent pipeline re-runs.
CREATE TABLE deals_cache (
  id               BIGSERIAL    PRIMARY KEY,
  week_key         TEXT         NOT NULL,
  rank             INT          NOT NULL CHECK (rank BETWEEN 1 AND 3),
  destination_iata TEXT         NOT NULL,
  destination_name TEXT         NOT NULL,
  flight_price     NUMERIC(8,2) NOT NULL,
  currency         TEXT         NOT NULL DEFAULT 'EUR',
  depart_at        TIMESTAMPTZ  NOT NULL,
  return_at        TIMESTAMPTZ  NOT NULL,
  booking_url      TEXT         NOT NULL,
  hotel_estimate   NUMERIC(8,2),
  trip_blurb       TEXT,
  observed_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE(week_key, rank)
);

CREATE INDEX idx_deals_cache_week ON deals_cache(week_key);

-- ─── send_log ─────────────────────────────────────────────────
-- One row per subscriber per week send attempt.
-- UNIQUE(subscriber_id, week_key) is the idempotency guard —
-- a duplicate send attempt will fail with a unique constraint violation.
-- status values: sent | failed | skipped
CREATE TABLE send_log (
  id                  BIGSERIAL PRIMARY KEY,
  subscriber_id       BIGINT      NOT NULL REFERENCES subscribers(id),
  week_key            TEXT        NOT NULL,
  sent_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status              TEXT        NOT NULL,
  provider_message_id TEXT,
  UNIQUE(subscriber_id, week_key)
);

CREATE INDEX idx_send_log_week ON send_log(week_key);
