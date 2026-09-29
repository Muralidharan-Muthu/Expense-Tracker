import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { ensureSchema, migrateUserIfNeeded, turso, updateProfile, upsertUser } from "./turso.server";

async function prepare(userId: string, supabase: unknown) {
  await ensureSchema();
  await migrateUserIfNeeded(userId, supabase);
  return turso();
}

export const getProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureSchema();
    await upsertUser(context.userId, context.claims);
    const res = await turso().execute({ sql: "SELECT email, full_name, provider, age, profession FROM users WHERE user_id = ?", args: [context.userId] });
    const r = res.rows[0];
    return {
      email: String(r?.["email"] ?? ""),
      name: r?.["full_name"] ? String(r["full_name"]) : null,
      provider: String(r?.["provider"] ?? "email"),
      age: r?.["age"] == null ? null : Number(r["age"]),
      profession: r?.["profession"] ? String(r["profession"]) : null,
    };
  });

export const saveProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      fullName: z.string().trim().min(1).max(100),
      age: z.number().int().min(1).max(120),
      profession: z.string().trim().min(1).max(100),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await ensureSchema();
    await upsertUser(context.userId, context.claims);
    await updateProfile(context.userId, data);
    return { ok: true };
  });

export const getAllData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await prepare(context.userId, context.supabase);
    const res = await db.batch(
      [
        { sql: "SELECT id, year, month, total_received, notes, carry_forward, savings_goal FROM months WHERE user_id = ? ORDER BY year, month", args: [context.userId] },
        { sql: "SELECT id, entry_date, category, slot, amount FROM expenses WHERE user_id = ? ORDER BY entry_date", args: [context.userId] },
        { sql: "SELECT id, category, monthly_limit FROM budgets WHERE user_id = ?", args: [context.userId] },
        { sql: "SELECT id, entry_date, amount, note FROM income_entries WHERE user_id = ? ORDER BY entry_date, created_at", args: [context.userId] },
        { sql: "SELECT id, category, slot, amount, day_of_month, start_date FROM recurring_expenses WHERE user_id = ? ORDER BY day_of_month, created_at", args: [context.userId] },
        { sql: "SELECT id, person, amount, entry_date, note, repaid_at FROM loans WHERE user_id = ? ORDER BY repaid_at IS NOT NULL, entry_date DESC, created_at DESC", args: [context.userId] },
      ],
      "read",
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = (i: number) => (res[i]?.rows ?? []) as any[];
    return {
      months: rows(0).map((r) => ({
        id: String(r.id), year: Number(r.year), month: Number(r.month),
        total_received: Number(r.total_received), notes: r.notes == null ? null : String(r.notes),
        carry_forward: r.carry_forward == null ? true : Number(r.carry_forward) !== 0,
        savings_goal: Number(r.savings_goal ?? 0) || 0,
      })),
      expenses: rows(1).map((r) => ({
        id: String(r.id), entry_date: String(r.entry_date), category: String(r.category),
        slot: String(r.slot), amount: Number(r.amount),
      })),
      budgets: rows(2).map((r) => ({ id: String(r.id), category: String(r.category), monthly_limit: Number(r.monthly_limit) })),
      income: rows(3).map((r) => ({
        id: String(r.id), entry_date: String(r.entry_date), amount: Number(r.amount), note: r.note == null ? null : String(r.note),
      })),
      recurring: rows(4).map((r) => ({
        id: String(r.id), category: String(r.category), slot: String(r.slot), amount: Number(r.amount),
        day_of_month: Number(r.day_of_month), start_date: String(r.start_date),
      })),
      loans: rows(5).map((r) => ({
        id: String(r.id), person: String(r.person), amount: Number(r.amount), entry_date: String(r.entry_date),
        note: r.note == null ? null : String(r.note), repaid_at: r.repaid_at == null ? null : String(r.repaid_at),
      })),
    };
  });

export const addIncome = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      amount: z.number().finite().gt(0).max(1e10),
      note: z.string().trim().max(60).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const db = await prepare(context.userId, context.supabase);
    await db.execute({
      sql: "INSERT INTO income_entries (id, user_id, entry_date, amount, note) VALUES (?, ?, ?, ?, ?)",
      args: [crypto.randomUUID(), context.userId, data.date, data.amount, data.note || null],
    });
    return { ok: true };
  });

export const deleteIncome = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const db = await prepare(context.userId, context.supabase);
    await db.execute({ sql: "DELETE FROM income_entries WHERE id = ? AND user_id = ?", args: [data.id, context.userId] });
    return { ok: true };
  });

export const setCarryForward = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ year: z.number().int().min(1900).max(3000), month: z.number().int().min(1).max(12), enabled: z.boolean() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const db = await prepare(context.userId, context.supabase);
    await db.execute({
      sql: `INSERT INTO months (id, user_id, year, month, total_received, carry_forward) VALUES (?, ?, ?, ?, 0, ?)
            ON CONFLICT (user_id, year, month) DO UPDATE SET carry_forward = excluded.carry_forward, updated_at = datetime('now')`,
      args: [crypto.randomUUID(), context.userId, data.year, data.month, data.enabled ? 1 : 0],
    });
    return { ok: true };
  });

const amount = z.number().finite().min(0).max(1e10);

export const saveDay = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      values: z.array(z.object({
        category: z.string().min(1).max(50),
        slot: z.enum(["none", "morning", "afternoon", "evening"]),
        amount,
      })).max(50),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const db = await prepare(context.userId, context.supabase);
    await db.batch(
      data.values.map((v) => ({
        sql: `INSERT INTO expenses (id, user_id, entry_date, category, slot, amount) VALUES (?, ?, ?, ?, ?, ?)
              ON CONFLICT (user_id, entry_date, category, slot) DO UPDATE SET amount = excluded.amount, updated_at = datetime('now')`,
        args: [crypto.randomUUID(), context.userId, data.date, v.category, v.slot, v.amount],
      })),
      "write",
    );
    return { ok: true };
  });

export const saveMonthTotal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ year: z.number().int().min(1900).max(3000), month: z.number().int().min(1).max(12), total: amount }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const db = await prepare(context.userId, context.supabase);
    await db.execute({
      sql: `INSERT INTO months (id, user_id, year, month, total_received) VALUES (?, ?, ?, ?, ?)
            ON CONFLICT (user_id, year, month) DO UPDATE SET total_received = excluded.total_received, updated_at = datetime('now')`,
      args: [crypto.randomUUID(), context.userId, data.year, data.month, data.total],
    });
    return { ok: true };
  });

export const saveBudget = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ category: z.string().min(1).max(50), limit: amount }).parse(d))
  .handler(async ({ data, context }) => {
    const db = await prepare(context.userId, context.supabase);
    await db.execute({
      sql: `INSERT INTO budgets (id, user_id, category, monthly_limit) VALUES (?, ?, ?, ?)
            ON CONFLICT (user_id, category) DO UPDATE SET monthly_limit = excluded.monthly_limit, updated_at = datetime('now')`,
      args: [crypto.randomUUID(), context.userId, data.category, data.limit],
    });
    return { ok: true };
  });

const categorySchema = z.object({
  key: z.string().trim().min(1).max(50).regex(/^[a-z0-9_-]+$/),
  label: z.string().trim().min(1).max(40),
  slots: z.array(z.enum(["none", "morning", "afternoon", "evening"])).min(1).max(4),
  tint: z.string().max(80).regex(/^[a-z0-9\/\- ]+$/),
  kind: z.enum(["spend", "transfer", "invest"]),
});

export const getCategories = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureSchema();
    const res = await turso().execute({ sql: "SELECT config FROM user_categories WHERE user_id = ?", args: [context.userId] });
    const raw = res.rows[0]?.["config"];
    if (!raw) return null;
    const parsed = z.array(categorySchema).safeParse(JSON.parse(String(raw)));
    return parsed.success ? parsed.data : null;
  });

export const saveCategories = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ categories: z.array(categorySchema).max(40) }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureSchema();
    await turso().execute({
      sql: `INSERT INTO user_categories (user_id, config) VALUES (?, ?)
            ON CONFLICT (user_id) DO UPDATE SET config = excluded.config, updated_at = datetime('now')`,
      args: [context.userId, JSON.stringify(data.categories)],
    });
    return { ok: true };
  });

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const slotEnum = z.enum(["none", "morning", "afternoon", "evening"]);

export const setSavingsGoal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ year: z.number().int().min(1900).max(3000), month: z.number().int().min(1).max(12), goal: amount }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const db = await prepare(context.userId, context.supabase);
    await db.execute({
      sql: `INSERT INTO months (id, user_id, year, month, total_received, savings_goal) VALUES (?, ?, ?, ?, 0, ?)
            ON CONFLICT (user_id, year, month) DO UPDATE SET savings_goal = excluded.savings_goal, updated_at = datetime('now')`,
      args: [crypto.randomUUID(), context.userId, data.year, data.month, data.goal],
    });
    return { ok: true };
  });

export const addRecurring = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      category: z.string().min(1).max(50), slot: slotEnum,
      amount: z.number().finite().gt(0).max(1e10),
      day: z.number().int().min(1).max(31), startDate: isoDate,
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const db = await prepare(context.userId, context.supabase);
    await db.execute({
      sql: "INSERT INTO recurring_expenses (id, user_id, category, slot, amount, day_of_month, start_date) VALUES (?, ?, ?, ?, ?, ?, ?)",
      args: [crypto.randomUUID(), context.userId, data.category, data.slot, data.amount, data.day, data.startDate],
    });
    return { ok: true };
  });

export const deleteRecurring = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const db = await prepare(context.userId, context.supabase);
    await db.execute({ sql: "DELETE FROM recurring_expenses WHERE id = ? AND user_id = ?", args: [data.id, context.userId] });
    return { ok: true };
  });

/** Fill in due recurring expenses up to `today`. Never overwrites a day that already has that entry. */
export const applyRecurring = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ today: isoDate }).parse(d))
  .handler(async ({ data, context }) => {
    const db = await prepare(context.userId, context.supabase);
    const res = await db.execute({
      sql: "SELECT category, slot, amount, day_of_month, start_date FROM recurring_expenses WHERE user_id = ?",
      args: [context.userId],
    });
    const pad = (n: number) => String(n).padStart(2, "0");
    const ty = Number(data.today.slice(0, 4)), tm = Number(data.today.slice(5, 7));
    const stmts: { sql: string; args: (string | number)[] }[] = [];
    for (const r of res.rows) {
      const start = String(r["start_date"]);
      let y = Number(start.slice(0, 4)), m = Number(start.slice(5, 7));
      let guard = 0;
      while ((y < ty || (y === ty && m <= tm)) && guard++ < 36) {
        const last = new Date(y, m, 0).getDate();
        const due = `${y}-${pad(m)}-${pad(Math.min(Number(r["day_of_month"]), last))}`;
        if (due >= start && due <= data.today) {
          stmts.push({
            sql: `INSERT INTO expenses (id, user_id, entry_date, category, slot, amount) VALUES (?, ?, ?, ?, ?, ?)
                  ON CONFLICT (user_id, entry_date, category, slot) DO NOTHING`,
            args: [crypto.randomUUID(), context.userId, due, String(r["category"]), String(r["slot"]), Number(r["amount"])],
          });
        }
        m++; if (m > 12) { m = 1; y++; }
      }
    }
    if (!stmts.length) return { added: 0 };
    const out = await db.batch(stmts, "write");
    return { added: out.reduce((s, x) => s + x.rowsAffected, 0) };
  });

export const addLoan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      person: z.string().trim().min(1).max(60), amount: z.number().finite().gt(0).max(1e10),
      date: isoDate, note: z.string().trim().max(80).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const db = await prepare(context.userId, context.supabase);
    await db.execute({
      sql: "INSERT INTO loans (id, user_id, person, amount, entry_date, note) VALUES (?, ?, ?, ?, ?, ?)",
      args: [crypto.randomUUID(), context.userId, data.person, data.amount, data.date, data.note || null],
    });
    return { ok: true };
  });

/** Mark money as paid back; optionally record it as money received on that day. */
export const repayLoan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), date: isoDate, addAsIncome: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    const db = await prepare(context.userId, context.supabase);
    const found = await db.execute({
      sql: "SELECT person, amount FROM loans WHERE id = ? AND user_id = ? AND repaid_at IS NULL",
      args: [data.id, context.userId],
    });
    const loan = found.rows[0];
    if (!loan) return { ok: false };
    const stmts: { sql: string; args: (string | number)[] }[] = [
      { sql: "UPDATE loans SET repaid_at = ? WHERE id = ? AND user_id = ? AND repaid_at IS NULL", args: [data.date, data.id, context.userId] },
    ];
    if (data.addAsIncome) {
      stmts.push({
        sql: "INSERT INTO income_entries (id, user_id, entry_date, amount, note) VALUES (?, ?, ?, ?, ?)",
        args: [crypto.randomUUID(), context.userId, data.date, Number(loan["amount"]), `Paid back by ${String(loan["person"])}`.slice(0, 60)],
      });
    }
    await db.batch(stmts, "write");
    return { ok: true };
  });

export const deleteLoan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const db = await prepare(context.userId, context.supabase);
    await db.execute({ sql: "DELETE FROM loans WHERE id = ? AND user_id = ?", args: [data.id, context.userId] });
    return { ok: true };
  });
