import { createClient, type Client } from "@libsql/client/web";

let client: Client | undefined;
let ready: Promise<void> | undefined;

export function turso(): Client {
  if (!client) {
    const url = process.env["TURSO_DATABASE_URL"];
    const authToken = process.env["TURSO_AUTH_TOKEN"];
    if (!url || !authToken) throw new Error("Turso database is not configured.");
    client = createClient({ url: url.replace(/^libsql:\/\//, "https://"), authToken });
  }
  return client;
}

export function ensureSchema() {
  if (!ready) {
    ready = turso()
      .batch(
        [
          `CREATE TABLE IF NOT EXISTS months (
            id TEXT PRIMARY KEY, user_id TEXT NOT NULL, year INTEGER NOT NULL, month INTEGER NOT NULL,
            total_received REAL NOT NULL DEFAULT 0, notes TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            UNIQUE (user_id, year, month))`,
          `CREATE TABLE IF NOT EXISTS expenses (
            id TEXT PRIMARY KEY, user_id TEXT NOT NULL, entry_date TEXT NOT NULL, category TEXT NOT NULL,
            slot TEXT NOT NULL DEFAULT 'none', amount REAL NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            UNIQUE (user_id, entry_date, category, slot))`,
          `CREATE INDEX IF NOT EXISTS expenses_user_date ON expenses (user_id, entry_date)`,
          `CREATE TABLE IF NOT EXISTS budgets (
            id TEXT PRIMARY KEY, user_id TEXT NOT NULL, category TEXT NOT NULL,
            monthly_limit REAL NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            UNIQUE (user_id, category))`,
          `CREATE TABLE IF NOT EXISTS users (
            user_id TEXT PRIMARY KEY, email TEXT NOT NULL, full_name TEXT,
            provider TEXT NOT NULL DEFAULT 'email',
            created_at TEXT NOT NULL DEFAULT (datetime('now')), last_sign_in_at TEXT NOT NULL DEFAULT (datetime('now')))`,
          `CREATE UNIQUE INDEX IF NOT EXISTS users_email_provider ON users (email, provider)`,
          `CREATE TABLE IF NOT EXISTS user_categories (user_id TEXT PRIMARY KEY, config TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT (datetime('now')))`,
          `CREATE TABLE IF NOT EXISTS user_migrations (user_id TEXT PRIMARY KEY, migrated_at TEXT NOT NULL DEFAULT (datetime('now')))`,
          `CREATE TABLE IF NOT EXISTS income_entries (
            id TEXT PRIMARY KEY, user_id TEXT NOT NULL, entry_date TEXT NOT NULL,
            amount REAL NOT NULL, note TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')))`,
          `CREATE INDEX IF NOT EXISTS income_user_date ON income_entries (user_id, entry_date)`,
          `CREATE TABLE IF NOT EXISTS recurring_expenses (
            id TEXT PRIMARY KEY, user_id TEXT NOT NULL, category TEXT NOT NULL, slot TEXT NOT NULL DEFAULT 'none',
            amount REAL NOT NULL, day_of_month INTEGER NOT NULL, start_date TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now')))`,
          `CREATE INDEX IF NOT EXISTS recurring_user ON recurring_expenses (user_id)`,
          `CREATE TABLE IF NOT EXISTS loans (
            id TEXT PRIMARY KEY, user_id TEXT NOT NULL, person TEXT NOT NULL, amount REAL NOT NULL,
            entry_date TEXT NOT NULL, note TEXT, repaid_at TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')))`,
          `CREATE INDEX IF NOT EXISTS loans_user ON loans (user_id)`,
        ],
        "write",
      )
      .then(async () => {
        // Add later-introduced columns to existing databases.
        for (const stmt of [
          `ALTER TABLE users ADD COLUMN age INTEGER`,
          `ALTER TABLE users ADD COLUMN profession TEXT`,
          `ALTER TABLE months ADD COLUMN carry_forward INTEGER NOT NULL DEFAULT 1`,
          `ALTER TABLE months ADD COLUMN savings_goal REAL NOT NULL DEFAULT 0`,
        ]) {
          await turso().execute(stmt).catch(() => undefined); // ignore "duplicate column"
        }
      })
      .catch((e) => {
        ready = undefined;
        throw e;
      });
  }
  return ready;
}

/** One-time copy of this user's rows from the old storage into Turso. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function migrateUserIfNeeded(userId: string, supabase: any) {
  const db = turso();
  const done = await db.execute({ sql: "SELECT 1 FROM user_migrations WHERE user_id = ?", args: [userId] });
  if (done.rows.length) return;

  const [m, e, b] = await Promise.all([
    supabase.from("months").select("id, year, month, total_received, notes"),
    supabase.from("expenses").select("id, entry_date, category, slot, amount"),
    supabase.from("budgets").select("id, category, monthly_limit"),
  ]);
  if (m.error || e.error || b.error) throw m.error ?? e.error ?? b.error;

  const stmts = [
    ...(m.data ?? []).map((r: any) => ({
      sql: `INSERT OR IGNORE INTO months (id, user_id, year, month, total_received, notes) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [r.id, userId, r.year, r.month, Number(r.total_received), r.notes],
    })),
    ...(e.data ?? []).map((r: any) => ({
      sql: `INSERT OR IGNORE INTO expenses (id, user_id, entry_date, category, slot, amount) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [r.id, userId, r.entry_date, r.category, r.slot, Number(r.amount)],
    })),
    ...(b.data ?? []).map((r: any) => ({
      sql: `INSERT OR IGNORE INTO budgets (id, user_id, category, monthly_limit) VALUES (?, ?, ?, ?)`,
      args: [r.id, userId, r.category, Number(r.monthly_limit)],
    })),
    { sql: "INSERT OR IGNORE INTO user_migrations (user_id) VALUES (?)", args: [userId] },
  ];
  await db.batch(stmts, "write");
}

/** Keep this user's profile row current. No passwords are ever stored here. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function upsertUser(userId: string, claims: any) {
  const meta = claims?.user_metadata ?? {};
  const email = String(claims?.email ?? "").slice(0, 320);
  const rawName = meta.full_name ?? meta.name ?? null;
  const name = rawName ? String(rawName).trim().slice(0, 100) || null : null;
  const provider = String(claims?.app_metadata?.provider ?? "email").slice(0, 30);
  await turso().execute({
    sql: `INSERT INTO users (user_id, email, full_name, provider) VALUES (?, ?, ?, ?)
          ON CONFLICT (user_id) DO UPDATE SET email = excluded.email,
            full_name = COALESCE(users.full_name, excluded.full_name),
            provider = excluded.provider, last_sign_in_at = datetime('now')`,
    args: [userId, email, name, provider],
  });
}

/** Save the one-time onboarding details for this user. */
export async function updateProfile(
  userId: string,
  profile: { fullName: string; age: number; profession: string },
) {
  await turso().execute({
    sql: `UPDATE users SET full_name = ?, age = ?, profession = ? WHERE user_id = ?`,
    args: [profile.fullName, profile.age, profile.profession, userId],
  });
}
