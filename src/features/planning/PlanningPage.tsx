import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { RequireSession } from "@/components/auth/RequireSession";
import { PeriodSelector } from "@/components/expense/PeriodSelector";
import { RecurringCard, SavingsGoalCard, useAutoRecurring } from "@/components/expense/PlanningCards";
import { TODAY_YEAR, inr, makeMonth } from "@/lib/expense-config";
import { buildDayMap, useAllExpenses, useBudgets, useCategories, useIncome, useMonthRows, useSaveBudget } from "@/lib/expense-data";
import { buildMonthMetrics, categoryTotals, incomeMap, monthMoney } from "@/lib/expense-metrics";
import { useReportingPeriod } from "@/hooks/use-reporting-period";
import { PageHeader } from "@/components/PageHeader";

export function PlanningPage() {
  const { year, month, setYear, setMonth } = useReportingPeriod();
  const { data: monthRows = [] } = useMonthRows();
  const { data: expenses = [] } = useAllExpenses();
  const { data: income = [] } = useIncome();
  const { data: budgets = [] } = useBudgets();
  const { data: categories } = useCategories();
  const saveBudget = useSaveBudget();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  useAutoRecurring();
  const dayMap = useMemo(() => buildDayMap(expenses), [expenses]);
  const incomeByDate = useMemo(() => incomeMap(income), [income]);
  const years = useMemo(() => Array.from(new Set([TODAY_YEAR, year, ...monthRows.map((row) => row.year)])).sort((a, b) => b - a), [monthRows, year]);
  const money = monthMoney(year, month, monthRows, dayMap, income);
  const rows = buildMonthMetrics(makeMonth(year, month), dayMap, money.start + money.carry, incomeByDate);
  const spent = rows.reduce((sum, row) => sum + row.total, 0);
  const totals = categoryTotals(rows, categories);
  const goal = monthRows.find((row) => row.year === year && row.month === month)?.savings_goal ?? 0;
  async function commit(category: string) { const raw = drafts[category]; if (raw === undefined) return; setDrafts((current) => { const next = { ...current }; delete next[category]; return next; }); try { await saveBudget.mutateAsync({ category, limit: Number(raw) || 0 }); toast.success("Budget saved"); } catch { toast.error("Could not save the budget."); } }

  return <main className="mx-auto w-full max-w-6xl animate-fade-in px-3 py-5 sm:px-5 sm:py-8"><PageHeader title="Planning" description="Set limits, build savings, and automate regular expenses." /><div className="mb-5"><PeriodSelector year={year} month={month} years={years} onYearChange={setYear} onMonthChange={setMonth} compact /></div><section className="grid gap-4 lg:grid-cols-2"><SavingsGoalCard year={year} month={month} label={makeMonth(year, month).label} left={money.total - spent} goal={goal} /><RecurringCard /><Card className="lg:col-span-2"><CardHeader className="p-4 pb-2"><CardTitle className="text-base">Category budgets</CardTitle></CardHeader><CardContent className="grid gap-x-6 gap-y-4 p-4 pt-0 md:grid-cols-2">{categories.map((category) => { const limit = budgets.find((budget) => budget.category === category.key)?.monthly_limit ?? 0; const used = totals.find((item) => item.key === category.key)?.value ?? 0; const pct = limit > 0 ? Math.min(100, used / limit * 100) : 0; const over = limit > 0 && used > limit; return <div key={category.key} className="space-y-1.5"><div className="grid grid-cols-[minmax(0,1fr)_7rem] items-center gap-3"><span className="break-words text-sm font-medium">{category.label}</span><Input className="h-8" inputMode="decimal" aria-label={`${category.label} budget`} placeholder="Limit ₹" value={drafts[category.key] ?? (limit ? String(limit) : "")} onChange={(event) => setDrafts((values) => ({ ...values, [category.key]: event.target.value.replace(/[^\d.]/g, "") }))} onBlur={() => commit(category.key)} onKeyDown={(event) => event.key === "Enter" && commit(category.key)} /></div><Progress value={pct} className={over ? "[&>div]:bg-destructive" : "[&>div]:bg-primary"} /><p className="text-[11px] text-muted-foreground">{inr(used)} used{limit ? ` of ${inr(limit)}` : " · no limit set"}{over ? " · over budget" : ""}</p></div>; })}</CardContent></Card></section></main>;
}
