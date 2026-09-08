-- Covenant cloud schema subset (v1) — users, sessions, memberships, weddings,
-- guests, vendors, payments, budget_categories, seating_tables.
-- Trimmed from the planner's schema.sql guest/vendor/payment/wedding/table shapes for Postgres sync.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name  TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token         TEXT NOT NULL UNIQUE,
  expires_at    TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sessions_token_idx ON sessions(token);
CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id);

CREATE TABLE IF NOT EXISTS weddings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL DEFAULT 'My Wedding',
  bride           TEXT,
  groom           TEXT,
  wedding_date    TEXT,
  client_key      TEXT,                 -- optional device profile id for idempotent upload
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS weddings_client_key_idx
  ON weddings(client_key) WHERE client_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS memberships (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id    UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role          TEXT NOT NULL CHECK (role IN ('owner', 'partner', 'planner')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (wedding_id, user_id)
);

CREATE INDEX IF NOT EXISTS memberships_user_idx ON memberships(user_id);

-- Guest fields aligned with planner JSON + schema.sql guest table (trimmed).
CREATE TABLE IF NOT EXISTS guests (
  id               TEXT NOT NULL,
  wedding_id       UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  name             TEXT NOT NULL DEFAULT '',
  household        TEXT,
  guest_group      TEXT,
  side             TEXT,
  role             TEXT,
  invite_decision  TEXT,
  phone            TEXT,
  email            TEXT,
  address          TEXT,
  invited          BOOLEAN DEFAULT FALSE,
  rsvp             TEXT,
  meal             TEXT,
  dietary          TEXT,
  plus_one         BOOLEAN DEFAULT FALSE,
  children         INTEGER DEFAULT 0,
  family           BOOLEAN DEFAULT FALSE,
  thankyou         BOOLEAN DEFAULT FALSE,
  table_name       TEXT,
  notes            TEXT,
  companions_json  JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (wedding_id, id)
);

CREATE INDEX IF NOT EXISTS guests_wedding_updated_idx ON guests(wedding_id, updated_at);

-- Vendor fields aligned with planner JSON + schema.sql vendor table (trimmed).
-- Client aliases: cat↔category, contract↔has_contract; attrs stay on-device for now.
CREATE TABLE IF NOT EXISTS vendors (
  id               TEXT NOT NULL,
  wedding_id       UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  category         TEXT,
  name             TEXT NOT NULL DEFAULT '',
  contact          TEXT,
  phone            TEXT,
  email            TEXT,
  quote            DOUBLE PRECISION,
  deposit          DOUBLE PRECISION,
  balance          DOUBLE PRECISION,
  status           TEXT,
  rating           DOUBLE PRECISION,
  has_contract     BOOLEAN DEFAULT FALSE,
  pros             TEXT,
  cons             TEXT,
  review           TEXT,
  notes            TEXT,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (wedding_id, id)
);

CREATE INDEX IF NOT EXISTS vendors_wedding_updated_idx ON vendors(wedding_id, updated_at);

-- Payment fields aligned with planner JSON + schema.sql payment table (trimmed).
-- Client aliases: desc↔descr, due↔due_amount, paid↔paid_amount, date↔due_date,
-- paiddate↔paid_date, ptype↔method, gratuityStatus↔gratuity_status, etc.
-- Installments stay nested JSON (like guest companions) for LWW row sync.
-- vendor_id / budget_category_id are opaque client ids — no cloud FK (vendors/budget may lag).
CREATE TABLE IF NOT EXISTS payments (
  id                  TEXT NOT NULL,
  wedding_id          UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  vendor              TEXT,
  vendor_id           TEXT,
  budget_cat          TEXT,
  budget_category_id  TEXT,
  descr               TEXT,
  due_amount          DOUBLE PRECISION,
  paid_amount         DOUBLE PRECISION,
  gratuity            DOUBLE PRECISION,
  gratuity_status     TEXT,
  budget_item         TEXT,
  budget_item_id      TEXT,
  contract_idx        TEXT,
  contract_id         TEXT,
  due_date            TEXT,
  paid_date           TEXT,
  method              TEXT,
  status              TEXT,
  notes               TEXT,
  installments_json   JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (wedding_id, id)
);

CREATE INDEX IF NOT EXISTS payments_wedding_updated_idx ON payments(wedding_id, updated_at);

-- Budget category fields aligned with planner JSON + schema.sql budget_category / budget_item.
-- Client aliases: cat↔name, target↔target_pct; line items stay nested JSON (like payment
-- installments / guest companions) for LWW row sync on the category.
CREATE TABLE IF NOT EXISTS budget_categories (
  id               TEXT NOT NULL,
  wedding_id       UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  name             TEXT NOT NULL DEFAULT '',
  target_pct       DOUBLE PRECISION,
  planned          DOUBLE PRECISION,
  tip              TEXT,
  items_json       JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (wedding_id, id)
);

CREATE INDEX IF NOT EXISTS budget_categories_wedding_updated_idx
  ON budget_categories(wedding_id, updated_at);

-- Seating / table-layout fields aligned with planner JSON + schema.sql reception_table.
-- Client: data.tables (+ floor plan x/y/w/h/vert/preset in layout_json).
-- Guest→table assignments sync via guests.table_name (not duplicated here).
-- Floor fixtures (DJ / cake / dance) live on weddings.floor_fixtures_json (LWW).
CREATE TABLE IF NOT EXISTS seating_tables (
  id               TEXT NOT NULL,
  wedding_id       UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  name             TEXT NOT NULL DEFAULT '',
  capacity         INTEGER,
  placement        TEXT,
  table_type       TEXT,
  shape            TEXT,
  vip              BOOLEAN DEFAULT FALSE,
  facing           TEXT,
  label            TEXT,
  table_group      TEXT,
  notes            TEXT,
  layout_json      JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (wedding_id, id)
);

CREATE INDEX IF NOT EXISTS seating_tables_wedding_updated_idx
  ON seating_tables(wedding_id, updated_at);

-- Floor-plan fixtures (wedding-scoped, not per-table).
ALTER TABLE weddings
  ADD COLUMN IF NOT EXISTS floor_fixtures_json JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE weddings
  ADD COLUMN IF NOT EXISTS floor_fixtures_updated_at TIMESTAMPTZ;
