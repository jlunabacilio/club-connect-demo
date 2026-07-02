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
`;

function createDb(): Database.Database {
  const dataDir = path.join(process.cwd(), "data");
  fs.mkdirSync(dataDir, { recursive: true });

  const db = new Database(path.join(dataDir, "club-connect.db"));
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(SCHEMA);
  return db;
}

/** Shared SQLite connection (server-only). */
export function getDb(): Database.Database {
  if (!globalForDb.__clubConnectDb) {
    globalForDb.__clubConnectDb = createDb();
  }
  return globalForDb.__clubConnectDb;
}
