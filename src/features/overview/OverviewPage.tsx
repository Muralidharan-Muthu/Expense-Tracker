import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight, CircleDollarSign, IndianRupee, PiggyBank, Plus, TrendingDown, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RequireSession } from "@/components/auth/RequireSession";
import { DayEntryDialog } from "@/components/expense/DayEntryDialog";
import { PeriodSelector } from "@/components/expense/PeriodSelector";
import { useAutoRecurring } from "@/components/expense/PlanningCards";
import { MONTH_NAMES, TODAY_DAY, TODAY_MONTH, TODAY_YEAR, inr, lastDayOfMonth, makeMonth, today } from "@/lib/expense-config";
import { buildDayMap, useAllExpenses, useCategories, useIncome, useMonthRows, useProfile } from "@/lib/expense-data";
import { buildMonthMetrics, categoryTotals, incomeMap, monthMoney } from "@/lib/expense-metrics";
import { useReportingPeriod } from "@/hooks/use-reporting-period";
import { PageHeader } from "@/components/PageHeader";

export function OverviewPage() {
  const { year, month, setYear, setMonth } = useReportingPeriod();
  const { data: monthRows = [] } = useMonthRows();
  const { data: expenses = [] } = useAllExpenses();
  const { data: income = [] } = useIncome();
  const { data: categories } = useCategories();
  const profile = useProfile();
  const navigate = useNavigate();
  const [todayIso, setTodayIso] = useState("");
  const [quickAdd, setQuickAdd] = useState(false);
  useAutoRecurring();
  useEffect(() => { setTodayIso(today().iso); }, []);
  useEffect(() => { if (profile.data && profile.data.age == null) navigate({ to: "/onboarding", replace: true }); }, [profile.data, navigate]);
  const dayMap = useMemo(() => buildDayMap(expenses), [expenses]);
  const incomeByDate = useMemo(() => incomeMap(income), [income]);
  const years = useMemo(() => Array.from(new Set([TODAY_YEAR, year, ...monthRows.map((row) => row.year)])).sort((a, b) => b - a), [monthRows, year]);
  const money = monthMoney(year, month, monthRows, dayMap, income);
  const rows = buildMonthMetrics(makeMonth(year, month), dayMap, money.start + money.carry, incomeByDate);
  const spent = rows.reduce((sum, row) => sum + row.total, 0);
  const balance = money.total - spent;
  const todayTotal = rows.find((row) => row.key === todayIso)?.total ?? 0;
  const categoryData = categoryTotals(rows, categories).filter((item) => item.value > 0);
  const topCategory = [...categoryData].sort((a, b) => b.value - a.value)[0];
  const daysWithEntry = rows.filter((row) => row.total > 0).length;
  const savingsRate = money.total > 0 ? Math.round((balance / money.total) * 100) : 0;
  const daysLeft = year === TODAY_YEAR && month === TODAY_MONTH ? Math.max(0, lastDayOfMonth(year, month) - TODAY_DAY) : lastDayOfMonth(year, month);
  const noSpendDays = rows.filter((row) => row.total === 0 && (year !== TODAY_YEAR || month !== TODAY_MONTH || row.key < todayIso)).length;
  const highest = rows.reduce<(typeof rows)[number] | undefined>((best, row) => !best || row.total > best.total ? row : best, undefined);
  const currentMonth = year === TODAY_YEAR && month === TODAY_MONTH;
  const spentBeforeToday = rows.filter((row) => row.key < todayIso).reduce((sum, row) => sum + row.total, 0);
  const safeToday = Math.max(0, (money.total - spentBeforeToday) / Math.max(1, lastDayOfMonth(year, month) - TODAY_DAY + 1));
  const expected = money.total * (TODAY_DAY / lastDayOfMonth(year, month));
  const alerts: string[] = [];
  if (currentMonth && money.total > 0) {
    if (spent > money.total) alerts.push(`You've spent ${inr(spent - money.total)} more than the money available this month.`);
    else if (spent > expected * 1.1 && spent - expected >= 1) alerts.push(`You're ${inr(spent - expected)} ahead of your normal pace for day ${TODAY_DAY}.`);
    if (todayTotal > safeToday && todayTotal > 0) alerts.push(`Today's spending is above your safe amount of ${inr(safeToday)} per day.`);
  }
  const displayName = profile.data?.name || profile.data?.email?.split("@")[0] || "there";

  return <main className="mx-auto w-full max-w-6xl animate-fade-in px-3 py-5 sm:px-5 sm:py-8">
    <PageHeader title="Overview" description="Your money at a glance." eyebrow={`Hello, ${displayName}`} actions={<><Button variant="outline" onClick={() => setQuickAdd(true)}><Plus className="mr-1 size-4" />Add today</Button><Button asChild><Link to="/transactions">Transactions<ArrowRight className="ml-2 size-4" /></Link></Button></>} />
    {alerts.length > 0 && <section role="alert" className="mb-5 flex gap-3 rounded-lg border border-warning bg-warning/10 p-4"><AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning" /><div className="space-y-1 text-sm"><p className="font-semibold">Spending is running fast</p>{alerts.map((alert) => <p key={alert} className="text-muted-foreground">{alert}</p>)}</div></section>}
    <section className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-5" aria-label="Monthly summary">
      <Stat label="Today's expense" value={inr(todayTotal)} icon={<TrendingDown className="size-4" />} tone="text-destructive" />
      <Stat label={`Spent in ${MONTH_NAMES[month - 1]}`} value={inr(spent)} />
      <Stat label="Daily average" value={inr(daysWithEntry ? spent / daysWithEntry : 0)} />
      <Stat label="Savings rate" value={`${savingsRate}%`} icon={<PiggyBank className="size-4" />} tone={savingsRate < 0 ? "text-destructive" : "text-positive"} />
      <Stat label="Top category" value={topCategory?.name ?? "No spend"} icon={<CircleDollarSign className="size-4" />} wide />
    </section>
    <div className="mb-5"><PeriodSelector year={year} month={month} years={years} onYearChange={setYear} onMonthChange={setMonth} /></div>
    <section className="grid gap-4 md:grid-cols-2" aria-label="Month highlights">
      <Card><CardContent className="grid grid-cols-2 gap-3 p-4"><Highlight label="Total available" value={inr(money.total)} icon={<IndianRupee className="size-4" />} /><Highlight label="In-hand balance" value={inr(balance)} icon={<Wallet className="size-4" />} /><Highlight label="Highest-spend day" value={highest?.total ? `${highest.date.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · ${inr(highest.total)}` : "No spend"} /><Highlight label="No-spend days" value={String(noSpendDays)} /><Highlight label="Days remaining" value={String(daysLeft)} /></CardContent></Card>
      <Card><CardContent className="p-4"><p className="text-sm font-semibold">Money movement</p><div className="mt-4 space-y-3 text-sm"><Line label="Month start" value={inr(money.start)} /><Line label="Carried forward" value={inr(money.carry)} /><Line label="Added this month" value={`+${inr(money.extra)}`} tone="text-positive" /><Line label="Current balance" value={inr(balance)} tone={balance < 0 ? "text-destructive" : "text-primary"} strong /></div></CardContent></Card>
    </section>
    <DayEntryDialog date={quickAdd ? new Date() : null} dayMap={dayMap} balanceBefore={money.total - spentBeforeToday} received={money.total} monthSpent={spent} onOpenChange={setQuickAdd} />
  </main>;
}

function Stat({ label, value, tone = "text-foreground", icon, wide = false }: { label: string; value: string; tone?: string; icon?: React.ReactNode; wide?: boolean }) { return <Card className={`shadow-sm transition-transform duration-200 hover:-translate-y-0.5 ${wide ? "col-span-2 lg:col-span-1" : ""}`}><CardContent className="p-3 sm:p-4"><p className="text-[10px] font-semibold uppercase text-muted-foreground sm:text-xs">{label}</p><p className={`mt-1 flex flex-wrap items-center gap-1.5 break-words text-lg font-bold sm:text-xl ${tone}`}>{icon}{value}</p></CardContent></Card>; }
function Highlight({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) { return <div className="min-w-0 rounded-md bg-secondary p-3"><p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">{icon}{label}</p><p className="mt-1 break-words text-sm font-bold">{value}</p></div>; }
function Line({ label, value, tone = "", strong = false }: { label: string; value: string; tone?: string; strong?: boolean }) { return <div className={`flex items-center justify-between gap-3 ${strong ? "border-t pt-3" : ""}`}><span className="text-muted-foreground">{label}</span><span className={`${strong ? "text-base font-bold" : "font-semibold"} ${tone}`}>{value}</span></div>; }
