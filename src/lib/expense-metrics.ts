import { CATEGORIES, type CategoryDef, monthDays, type MonthDef, ymd } from "./expense-config";
import { dayTotal, type DayMap, type IncomeRow, type MonthRow } from "./expense-data";

export type DayMetric = {
  date: Date;
  key: string;
  total: number;
  before: number;
  after: number;
  day: Map<string, number> | undefined;
  /** Extra money received on this day. */
  income: number;
};

/** Opening = start amount + carry-forward. Extra income is added on its own day. */
export function buildMonthMetrics(def: MonthDef, dayMap: DayMap, opening: number, incomeByDate?: Map<string, number>) {
  let balance = opening;
  return monthDays(def).map((date): DayMetric => {
    const key = ymd(date);
    const day = dayMap.get(key);
    const total = dayTotal(day);
    const income = incomeByDate?.get(key) ?? 0;
    balance += income;
    const before = balance;
    balance -= total;
    return { date, key, day, total, income, before, after: balance };
  });
}

export function incomeMap(rows: IncomeRow[]) {
  const map = new Map<string, number>();
  for (const r of rows) map.set(r.entry_date, (map.get(r.entry_date) ?? 0) + r.amount);
  return map;
}

export type MonthMoney = { start: number; carry: number; extra: number; total: number; spent: number; left: number; carryEnabled: boolean };

/** Money picture for a month, with savings carried from earlier months (chained). */
export function monthMoney(year: number, month: number, monthRows: MonthRow[], dayMap: DayMap, income: IncomeRow[]): MonthMoney {
  const prefix = (y: number, m: number) => `${y}-${String(m).padStart(2, "0")}-`;
  const sumSpent = (y: number, m: number) => {
    const p = prefix(y, m); let s = 0;
    for (const [k, d] of dayMap) if (k.startsWith(p)) s += dayTotal(d);
    return s;
  };
  const sumExtra = (y: number, m: number) => { const p = prefix(y, m); return income.reduce((s, r) => (r.entry_date.startsWith(p) ? s + r.amount : s), 0); };
  const idx = (y: number, m: number) => y * 12 + (m - 1);
  const earliest = Math.min(
    idx(year, month),
    ...monthRows.map((r) => idx(r.year, r.month)),
    ...income.map((r) => idx(Number(r.entry_date.slice(0, 4)), Number(r.entry_date.slice(5, 7)))),
  );
  let carry = 0;
  let result: MonthMoney | null = null;
  for (let i = earliest; i <= idx(year, month); i++) {
    const y = Math.floor(i / 12), m = (i % 12) + 1;
    const row = monthRows.find((r) => r.year === y && r.month === m);
    const carryEnabled = row?.carry_forward ?? true;
    const start = row?.total_received ?? 0;
    const extra = sumExtra(y, m);
    const c = carryEnabled ? carry : 0;
    const total = start + c + extra;
    const spent = sumSpent(y, m);
    const left = total - spent;
    result = { start, carry: c, extra, total, spent, left, carryEnabled };
    carry = Math.max(0, left);
  }
  return result!;
}

export function categoryTotals(rows: DayMetric[], cats: CategoryDef[] = CATEGORIES) {
  return cats.map((category) => ({
    key: category.key,
    name: category.label,
    value: rows.reduce(
      (sum, row) => sum + category.slots.reduce((slotSum, slot) => slotSum + (row.day?.get(`${category.key}|${slot}`) ?? 0), 0),
      0,
    ),
  }));
}

/**
 * Full Monday–Sunday weeks. A week belongs to the month that holds most of
 * its days (4+ of 7, i.e. the month of its Thursday), so no week is split or
 * shown twice. Totals include days from the neighbouring month.
 */
export function weekdayWeekTotals(year: number, month: number, dayMap: DayMap) {
  const format = (date: Date) => date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  const first = new Date(year, month - 1, 1);
  const monday = new Date(first);
  monday.setDate(first.getDate() - ((first.getDay() + 6) % 7));
  const weeks: { key: string; label: string; total: number }[] = [];
  for (let start = monday; ; ) {
    const thursday = new Date(start); thursday.setDate(start.getDate() + 3);
    if (thursday.getFullYear() * 12 + thursday.getMonth() > year * 12 + month - 1) break;
    let total = 0;
    const d = new Date(start);
    for (let i = 0; i < 7; i++) { total += dayTotal(dayMap.get(ymd(d))); d.setDate(d.getDate() + 1); }
    const end = new Date(start); end.setDate(start.getDate() + 6);
    if (thursday.getMonth() === month - 1) weeks.push({ key: ymd(start), label: `${format(start)}–${format(end)}`, total });
    start = new Date(start); start.setDate(start.getDate() + 7);
  }
  return weeks;
}