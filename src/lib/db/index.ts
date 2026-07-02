import path from "node:path";
import fs from "node:fs";
import Database from "better-sqlite3";

// Reuse a single connection across hot reloads in development.
const globalForDb = globalThis as unknown as {
  __clubConnectDb?: Database.Database;
};

const SCHEMA = `
CREATE TABLE IF NOT EXISTS enrollments (
  id                TEXT PRIMARY KEY,
  membership_type   TEXT NOT NULL,
  applicant_name    TEXT NOT NULL,
  applicant_email   TEXT NOT NULL,
  payment_method    TEXT NOT NULL,
  amount_cents      INTEGER NOT NULL,
  currency          TEXT NOT NULL,
  status            TEXT NOT NULL,
  membership_number TEXT,
  approved_at       TEXT,
  details_json      TEXT NOT NULL,
  created_at        TEXT NOT NULL,
  updated_at        TEXT NOT NULL
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
 *  earlier schema version. */
function migrate(db: Database.Database): void {
  const columns = db
    .prepare("PRAGMA table_info(enrollments)")
    .all() as { name: string }[];
  if (!columns.some((c) => c.name === "approved_at")) {
    db.exec("ALTER TABLE enrollments ADD COLUMN approved_at TEXT");
  }
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
