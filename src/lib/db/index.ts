import path from "node:path";
import fs from "node:fs";
import Database from "better-sqlite3";

// Reuse a single connection across hot reloads in development.
const globalForDb = globalThis as unknown as {
  __clubConnectDb?: Database.Database;
};

const SCHEMA = `
CREATE TABLE IF NOT EXISTS enrollments (
  id                  TEXT PRIMARY KEY,
  membership_type     TEXT NOT NULL,
  applicant_name      TEXT NOT NULL,
  applicant_email     TEXT NOT NULL,
  payment_method      TEXT NOT NULL,
  amount_cents        INTEGER NOT NULL,
  currency            TEXT NOT NULL,
  -- Overall lifecycle: 'pending' | 'active' | 'rejected'
  status              TEXT NOT NULL DEFAULT 'pending',
  -- Identity check: 'pending' | 'verified' | 'rejected'
  verification_status TEXT NOT NULL DEFAULT 'pending',
  approved_at         TEXT,
  -- Payment: 'pending' | 'succeeded' | 'failed'
  payment_status      TEXT NOT NULL DEFAULT 'pending',
  paid_at             TEXT,
  -- Membership details
  membership_number   TEXT,
  activated_at        TEXT,
  details_json        TEXT NOT NULL,
  created_at          TEXT NOT NULL,
  updated_at          TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS payments (
  id             TEXT PRIMARY KEY,
  enrollment_id  TEXT NOT NULL REFERENCES enrollments(id),
  amount_cents   INTEGER NOT NULL,
  currency       TEXT NOT NULL,
  method         TEXT NOT NULL,
  status         TEXT NOT NULL,
  transaction_id TEXT,
  error_code     TEXT,
  error_message  TEXT,
  created_at     TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_payments_enrollment ON payments(enrollment_id);

-- Enforce global uniqueness of assigned membership numbers. Multiple NULLs
-- are allowed (pending enrollments don't have a number yet).
CREATE UNIQUE INDEX IF NOT EXISTS idx_enrollments_membership_number
  ON enrollments(membership_number);
`;

/** Add columns/indexes that may be missing on databases created by an
 *  earlier schema version, and backfill the new status fields from the
 *  legacy single `status` column. */
function migrate(db: Database.Database): void {
  const columns = db
    .prepare("PRAGMA table_info(enrollments)")
    .all() as { name: string }[];
  const has = (name: string) => columns.some((c) => c.name === name);

  const add = (name: string, ddl: string) => {
    if (!has(name)) db.exec(`ALTER TABLE enrollments ADD COLUMN ${ddl}`);
  };

  add("approved_at", "approved_at TEXT");
  add(
    "verification_status",
    "verification_status TEXT NOT NULL DEFAULT 'pending'",
  );
  add("payment_status", "payment_status TEXT NOT NULL DEFAULT 'pending'");
  add("paid_at", "paid_at TEXT");
  add("activated_at", "activated_at TEXT");

  // Backfill the split status fields from any legacy `status` values.
  db.exec(`
    UPDATE enrollments SET payment_status = 'succeeded'
      WHERE payment_status = 'pending' AND status IN ('paid', 'active');
    UPDATE enrollments SET payment_status = 'failed'
      WHERE payment_status = 'pending' AND status = 'payment_failed';
    UPDATE enrollments SET verification_status = 'verified'
      WHERE verification_status = 'pending' AND approved_at IS NOT NULL;
    UPDATE enrollments SET activated_at = updated_at
      WHERE activated_at IS NULL AND status = 'active';
    -- Normalize the overall status to the new vocabulary.
    UPDATE enrollments SET status = 'pending'
      WHERE status IN ('pending_payment', 'paid', 'payment_failed');
  `);
}

function createDb(): Database.Database {
  const dataDir = path.join(process.cwd(), "data");
  fs.mkdirSync(dataDir, { recursive: true });

  const db = new Database(path.join(dataDir, "club-connect.db"));
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(SCHEMA);
  migrate(db);
  return db;
}

/** Shared SQLite connection (server-only). */
export function getDb(): Database.Database {
  if (!globalForDb.__clubConnectDb) {
    globalForDb.__clubConnectDb = createDb();
  }
  return globalForDb.__clubConnectDb;
}
