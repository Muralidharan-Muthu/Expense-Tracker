import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { ensureSchema, migrateUserIfNeeded, turso } from "./turso.server";

async function prepare(userId: string, supabase: unknown) {
  await ensureSchema();
  await migrateUserIfNeeded(userId, supabase);
  return turso();
}

type QueryRow = Record<string, unknown>;
type BatchResult = { rows: QueryRow[] }[];
const rows = (result: BatchResult, index: number) => result[index]?.rows ?? [];

export const getFinanceData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await prepare(context.userId, context.supabase);
    const result = await db.batch([
      { sql: "SELECT id, year, month, total_received, notes, carry_forward, savings_goal FROM months WHERE user_id = ? ORDER BY year, month", args: [context.userId] },
      { sql: "SELECT id, entry_date, category, slot, amount FROM expenses WHERE user_id = ? ORDER BY entry_date", args: [context.userId] },
      { sql: "SELECT id, entry_date, amount, note FROM income_entries WHERE user_id = ? ORDER BY entry_date, created_at", args: [context.userId] },
    ], "read");
    return {
      months: rows(result as BatchResult, 0).map((r) => ({ id: String(r["id"]), year: Number(r["year"]), month: Number(r["month"]), total_received: Number(r["total_received"]), notes: r["notes"] == null ? null : String(r["notes"]), carry_forward: r["carry_forward"] == null ? true : Number(r["carry_forward"]) !== 0, savings_goal: Number(r["savings_goal"] ?? 0) || 0 })),
      expenses: rows(result as BatchResult, 1).map((r) => ({ id: String(r["id"]), entry_date: String(r["entry_date"]), category: String(r["category"]), slot: String(r["slot"]), amount: Number(r["amount"]) })),
      income: rows(result as BatchResult, 2).map((r) => ({ id: String(r["id"]), entry_date: String(r["entry_date"]), amount: Number(r["amount"]), note: r["note"] == null ? null : String(r["note"]) })),
    };
  });

export const getPlanningData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await prepare(context.userId, context.supabase);
    const result = await db.batch([
      { sql: "SELECT id, category, monthly_limit FROM budgets WHERE user_id = ?", args: [context.userId] },
      { sql: "SELECT id, category, slot, amount, day_of_month, start_date FROM recurring_expenses WHERE user_id = ? ORDER BY day_of_month, created_at", args: [context.userId] },
    ], "read");
    return {
      budgets: rows(result as BatchResult, 0).map((r) => ({ id: String(r["id"]), category: String(r["category"]), monthly_limit: Number(r["monthly_limit"]) })),
      recurring: rows(result as BatchResult, 1).map((r) => ({ id: String(r["id"]), category: String(r["category"]), slot: String(r["slot"]), amount: Number(r["amount"]), day_of_month: Number(r["day_of_month"]), start_date: String(r["start_date"]) })),
    };
  });

export const getLoansData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await prepare(context.userId, context.supabase);
    const result = await db.execute({ sql: "SELECT id, person, amount, entry_date, note, repaid_at FROM loans WHERE user_id = ? ORDER BY repaid_at IS NOT NULL, entry_date DESC, created_at DESC", args: [context.userId] });
    return result.rows.map((r) => ({ id: String(r["id"]), person: String(r["person"]), amount: Number(r["amount"]), entry_date: String(r["entry_date"]), note: r["note"] == null ? null : String(r["note"]), repaid_at: r["repaid_at"] == null ? null : String(r["repaid_at"]) }));
  });
