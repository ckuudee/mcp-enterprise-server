/** Mock CRM schema. Kept as a TS string so it ships with `tsc` output without a copy step. */
export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY,
  name          TEXT    NOT NULL,
  email         TEXT    NOT NULL UNIQUE,
  department    TEXT    NOT NULL,
  created_at    TEXT    NOT NULL,   -- ISO date, e.g. 2025-03-14
  last_login_at TEXT                -- ISO date; NULL = never logged in
);

CREATE TABLE IF NOT EXISTS orders (
  id           INTEGER PRIMARY KEY,
  user_id      INTEGER NOT NULL REFERENCES users(id),
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  status       TEXT    NOT NULL CHECK (status IN ('pending', 'paid', 'refunded')),
  created_at   TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login_at);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
`;
