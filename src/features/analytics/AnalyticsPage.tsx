import { useMemo } from "react";
import {
  Area,
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CalendarDays, Gauge, Lightbulb, Target, TrendingDown, TrendingUp, WalletCards } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PeriodSelector } from "@/components/expense/PeriodSelector";
import {
  lastDayOfMonth,
  MONTH_NAMES,
  TODAY_DAY,
  TODAY_MONTH,
  TODAY_YEAR,
  inr,
  makeMonth,
  monthsOfYear,
} from "@/lib/expense-config";
import { buildDayMap, useAllExpenses, useCategories, useIncome, useMonthRows } from "@/lib/expense-data";
import { buildMonthMetrics, categoryTotals, incomeMap, monthMoney } from "@/lib/expense-metrics";
import { useReportingPeriod } from "@/hooks/use-reporting-period";
import { PageHeader } from "@/components/PageHeader";

const COLORS = ["var(--category-1)", "var(--category-2)", "var(--category-3)", "var(--category-4)", "var(--category-5)", "var(--category-6)", "var(--category-7)", "var(--category-8)"];
const TOOLTIP_STYLE = { background: "var(--popover)", borderColor: "var(--border)", borderRadius: 8 };
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function AnalyticsPage() {
  const { year, month, setYear, setMonth } = useReportingPeriod();
  const monthQuery = useMonthRows();
  const expenseQuery = useAllExpenses();
  const incomeQuery = useIncome();
  const categoryQuery = useCategories();
  const monthRows = monthQuery.data ?? [];
  const expenses = expenseQuery.data ?? [];
  const income = incomeQuery.data ?? [];
  const categories = categoryQuery.data;
  const dayMap = useMemo(() => buildDayMap(expenses), [expenses]);
  const incomeByDate = useMemo(() => incomeMap(income), [income]);
  const years = useMemo(() => Array.from(new Set([TODAY_YEAR, year, ...monthRows.map((row) => row.year), ...expenses.map((row) => Number(row.entry_date.slice(0, 4)))])).sort((a, b) => b - a), [expenses, monthRows, year]);
  const money = monthMoney(year, month, monthRows, dayMap, income);
  const rows = buildMonthMetrics(makeMonth(year, month), dayMap, money.start + money.carry, incomeByDate);
  const totals = categoryTotals(rows, categories);
  const mix = totals.filter((item) => item.value > 0).sort((a, b) => b.value - a.value);
  const totalSpent = rows.reduce((sum, row) => sum + row.total, 0);
  const monthIndex = year * 12 + month;
  const currentMonthIndex = TODAY_YEAR * 12 + TODAY_MONTH;
  const isCurrentMonth = monthIndex === currentMonthIndex;
  const isFutureMonth = monthIndex > currentMonthIndex;
  const lastDay = lastDayOfMonth(year, month);
  const observedDays = isCurrentMonth ? TODAY_DAY : isFutureMonth ? 0 : lastDay;
  const elapsedRows = rows.slice(0, observedDays);
  const activeDays = elapsedRows.filter((row) => row.total > 0).length;
  const averageDaily = observedDays > 0 ? totalSpent / observedDays : 0;
  const projectedSpend = isCurrentMonth ? averageDaily * lastDay : totalSpent;
  const projectedBalance = isFutureMonth ? null : money.total - projectedSpend;
  const savingsRate = money.total > 0 ? (money.left / money.total) * 100 : null;
  const biggest = mix[0];
  const safeDaily = money.total > 0 ? money.total / lastDay : 0;

  const prevY = month === 1 ? year - 1 : year;
  const prevM = month === 1 ? 12 : month - 1;
  const previous = categoryTotals(buildMonthMetrics(makeMonth(prevY, prevM), dayMap, 0), categories);
  const ranked = mix.map((item) => {
    const prev = previous.find((candidate) => candidate.key === item.key)?.value ?? 0;
    const diff = item.value - prev;
    return { ...item, prev, diff, pct: prev > 0 ? Math.round((diff / prev) * 100) : null, share: totalSpent > 0 ? (item.value / totalSpent) * 100 : 0 };
  });

  const chartRows = (isCurrentMonth ? rows.slice(0, TODAY_DAY) : rows).map((row) => ({
    day: row.date.getDate(),
    date: row.date.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
    Spent: row.total,
    "Safe pace": safeDaily,
    Income: row.income,
    Balance: row.after,
  }));
  let cumulativeSpent = 0;
  let cumulativeIncome = money.start + money.carry;
  const cashFlow = chartRows.map((item) => {
    cumulativeIncome += item.Income;
    cumulativeSpent += item.Spent;
    return { ...item, "Money received": cumulativeIncome, "Total spent": cumulativeSpent, "Balance left": cumulativeIncome - cumulativeSpent };
  });

  const weekday = WEEKDAYS.map((name, index) => {
    const jsDay = (index + 1) % 7;
    const matching = elapsedRows.filter((row) => row.date.getDay() === jsDay);
    const spendDays = matching.filter((row) => row.total > 0);
    const total = matching.reduce((sum, row) => sum + row.total, 0);
    return { name, Average: matching.length > 0 ? total / matching.length : 0, Total: total, days: spendDays.length };
  });
  const weekdayPeak = [...weekday].sort((a, b) => b.Average - a.Average)[0];

  const monthly = monthsOfYear(year).map((def) => {
    const item = monthMoney(def.year, def.month, monthRows, dayMap, income);
    const monthRowsData = buildMonthMetrics(def, dayMap, item.start + item.carry, incomeByDate);
    const spent = monthRowsData.reduce((sum, row) => sum + row.total, 0);
    const future = def.year * 12 + def.month > currentMonthIndex;
    const empty = future && item.start + item.extra === 0 && spent === 0;
    return { name: MONTH_NAMES[def.month - 1]?.slice(0, 3), Received: item.start + item.extra, Spent: spent, Balance: empty ? null : item.total - spent };
  });
  const hasYearData = monthly.some((item) => item.Received > 0 || item.Spent > 0);
  const insightText = getInsight({ totalSpent, safeDaily, averageDaily, savingsRate, biggestName: biggest?.name, biggestShare: biggest ? (biggest.value / totalSpent) * 100 : 0, projectedBalance, isFutureMonth });

  if (monthQuery.isLoading || expenseQuery.isLoading || incomeQuery.isLoading || categoryQuery.isLoading) {
    return <main className="mx-auto w-full max-w-6xl px-3 py-5 sm:px-5 sm:py-8"><PageHeader title="Analytics" description="See where your money goes and how it changes." /><div className="grid min-h-72 place-items-center text-sm text-muted-foreground">Preparing your money overview…</div></main>;
  }
  if (monthQuery.isError || expenseQuery.isError || incomeQuery.isError || categoryQuery.isError) {
    return <main className="mx-auto w-full max-w-6xl px-3 py-5 sm:px-5 sm:py-8"><PageHeader title="Analytics" description="See where your money goes and how it changes." /><Card><CardContent className="p-6 text-sm text-destructive">Your analytics could not be loaded. Refresh the page to try again.</CardContent></Card></main>;
  }

  return <main className="mx-auto w-full max-w-6xl animate-fade-in px-3 py-5 sm:px-5 sm:py-8">
    <PageHeader title="Analytics" description="Make clearer decisions from your income, spending, and balance." />
    <div className="mb-5"><PeriodSelector year={year} month={month} years={years} onYearChange={setYear} onMonthChange={setMonth} compact /></div>

    <section className="grid grid-cols-2 gap-3 xl:grid-cols-4" aria-label="Decision summary">
      <Summary title="Savings rate" value={savingsRate === null ? "—" : `${Math.round(savingsRate)}%`} note={money.total > 0 ? `${inr(Math.max(0, money.left))} currently left` : "Add money received first"} icon={Target} tone={savingsRate !== null && savingsRate < 0 ? "bad" : "good"} />
      <Summary title="Daily average" value={inr(averageDaily)} note={`${activeDays} spending ${activeDays === 1 ? "day" : "days"} recorded`} icon={CalendarDays} />
      <Summary title={isCurrentMonth ? "Projected month-end" : "Closing balance"} value={projectedBalance === null ? "—" : inr(projectedBalance)} note={isCurrentMonth ? "At your current daily pace" : isFutureMonth ? "Available after activity begins" : "Based on recorded activity"} icon={Gauge} tone={projectedBalance !== null && projectedBalance < 0 ? "bad" : "good"} />
      <Summary title="Biggest use" value={biggest?.name ?? "—"} note={biggest ? `${Math.round((biggest.value / totalSpent) * 100)}% · ${inr(biggest.value)}` : "No spending recorded"} icon={WalletCards} />
    </section>

    <Card className="mt-4 border-primary/20 bg-primary/5">
      <CardContent className="flex items-start gap-3 p-4"><div className="grid size-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary"><Lightbulb className="size-4" /></div><div><p className="text-sm font-semibold">What stands out</p><p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{insightText}</p></div></CardContent>
    </Card>

    <section className="mt-4 grid gap-4 lg:grid-cols-2">
      <ChartCard title={`Daily spend vs safe pace · ${MONTH_NAMES[month - 1]}`} subtitle="Days above the line are using money faster than an even monthly pace." empty={chartRows.every((row) => row.Spent === 0 && row.Income === 0)}>
        <ComposedChart data={chartRows} margin={{ top: 10, right: 8, bottom: 0, left: -12 }}><CartesianGrid vertical={false} stroke="var(--border)" /><XAxis dataKey="day" fontSize={11} tickLine={false} axisLine={false} /><YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={compactInr} /><Tooltip labelFormatter={(_, payload) => payload[0]?.payload?.date ?? ""} formatter={(value, name) => [inr(Number(value)), name]} contentStyle={TOOLTIP_STYLE} /><Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} /><Bar dataKey="Spent" fill="var(--warning)" radius={[4, 4, 0, 0]} maxBarSize={22} /><Line type="monotone" dataKey="Safe pace" stroke="var(--positive)" strokeWidth={2} dot={false} strokeDasharray="5 4" /></ComposedChart>
      </ChartCard>
      <ChartCard title="Cumulative cash flow" subtitle="See when income arrived, how spending accumulated, and what remained." empty={money.total === 0 && totalSpent === 0}>
        <LineChart data={cashFlow} margin={{ top: 10, right: 8, bottom: 0, left: -12 }}><CartesianGrid vertical={false} stroke="var(--border)" /><XAxis dataKey="day" fontSize={11} tickLine={false} axisLine={false} /><YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={compactInr} /><Tooltip labelFormatter={(_, payload) => payload[0]?.payload?.date ?? ""} formatter={(value, name) => [inr(Number(value)), name]} contentStyle={TOOLTIP_STYLE} /><Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} /><Line type="monotone" dataKey="Money received" stroke="var(--primary)" strokeWidth={2} dot={false} /><Line type="monotone" dataKey="Total spent" stroke="var(--warning)" strokeWidth={2} dot={false} /><Line type="monotone" dataKey="Balance left" stroke="var(--positive)" strokeWidth={2.5} dot={false} /></LineChart>
      </ChartCard>
    </section>

    <section className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
      <Card>
        <CardHeader className="p-4 pb-1"><CardTitle className="text-base">Category breakdown · {MONTH_NAMES[month - 1]} {year}</CardTitle><p className="text-xs text-muted-foreground">Ranked by share of spending, compared with the previous month.</p></CardHeader>
        <CardContent className="grid min-h-80 gap-3 p-3 sm:grid-cols-[0.85fr_1.15fr] sm:p-4">{mix.length === 0 ? <div className="sm:col-span-2"><Empty /></div> : <><div className="h-60 min-w-0 sm:h-full"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={mix} dataKey="value" nameKey="name" innerRadius="50%" outerRadius="76%" paddingAngle={2} stroke="var(--card)">{mix.map((item, index) => <Cell key={item.key} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip formatter={(value) => inr(Number(value))} contentStyle={TOOLTIP_STYLE} /></PieChart></ResponsiveContainer></div><div className="min-w-0 space-y-3">{ranked.slice(0, 7).map((item, index) => <div key={item.key}><div className="mb-1 flex min-w-0 items-center justify-between gap-2 text-xs"><span className="min-w-0 truncate font-medium">{index + 1}. {item.name}</span><span className="shrink-0 font-semibold tabular-nums">{inr(item.value)}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full" style={{ width: `${item.share}%`, backgroundColor: COLORS[index % COLORS.length] }} /></div><div className="mt-1 flex justify-between text-[11px] text-muted-foreground"><span>{Math.round(item.share)}% of total</span><ChangeLabel item={item} /></div></div>)}</div></>}</CardContent>
      </Card>
      <ChartCard title="Average by day of week" subtitle={weekdayPeak && weekdayPeak.Average > 0 ? `${weekdayPeak.name} is currently your highest-average spending day.` : "Patterns appear as you record spending."} empty={totalSpent === 0}>
        {BarChartContent({ data: weekday })}
      </ChartCard>
    </section>

    <Card className="mt-4"><CardHeader className="p-4 pb-1"><CardTitle className="text-base">Monthly money flow · {year}</CardTitle><p className="text-xs text-muted-foreground">New income excludes carried money, preventing it from being counted twice.</p></CardHeader><CardContent className="h-80 p-2 sm:p-4">{!hasYearData ? <Empty /> : <ResponsiveContainer width="100%" height="100%"><ComposedChart data={monthly} margin={{ top: 12, right: 8, bottom: 0, left: -12 }}><CartesianGrid vertical={false} stroke="var(--border)" /><XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} /><YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={compactInr} /><Tooltip formatter={(value) => inr(Number(value))} contentStyle={TOOLTIP_STYLE} /><Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} /><Bar dataKey="Received" fill="var(--primary)" radius={[4, 4, 0, 0]} /><Bar dataKey="Spent" fill="var(--warning)" radius={[4, 4, 0, 0]} /><Area type="monotone" dataKey="Balance" fill="var(--secondary)" stroke="var(--positive)" strokeWidth={2} /></ComposedChart></ResponsiveContainer>}</CardContent></Card>
  </main>;
}

function Summary({ title, value, note, icon: Icon, tone }: { title: string; value: string; note: string; icon: typeof Target; tone?: "good" | "bad" }) {
  return <Card className="min-w-0"><CardContent className="p-3 sm:p-4"><div className="mb-2 flex items-center justify-between gap-2"><p className="text-xs font-medium text-muted-foreground">{title}</p><Icon className="size-4 shrink-0 text-muted-foreground" /></div><p className={`break-words text-lg font-bold tabular-nums sm:text-xl ${tone === "bad" ? "text-destructive" : tone === "good" ? "text-positive" : ""}`}>{value}</p><p className="mt-1 text-[11px] leading-snug text-muted-foreground">{note}</p></CardContent></Card>;
}

function ChartCard({ title, subtitle, empty, children }: { title: string; subtitle: string; empty: boolean; children: React.ReactElement }) {
  return <Card><CardHeader className="p-4 pb-1"><CardTitle className="text-base">{title}</CardTitle><p className="text-xs text-muted-foreground">{subtitle}</p></CardHeader><CardContent className="h-80 min-w-0 p-2 sm:p-4">{empty ? <Empty /> : <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>}</CardContent></Card>;
}

function BarChartContent({ data }: { data: { name: string; Average: number; Total: number; days: number }[] }) {
  return <ComposedChart data={data} margin={{ top: 10, right: 8, bottom: 0, left: -12 }}><CartesianGrid vertical={false} stroke="var(--border)" /><XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} /><YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={compactInr} /><Tooltip formatter={(value, name, item) => name === "Average" ? [inr(Number(value)), `Average · ${item.payload.days} active days`] : [inr(Number(value)), name]} contentStyle={TOOLTIP_STYLE} /><Bar dataKey="Average" fill="var(--category-5)" radius={[4, 4, 0, 0]} maxBarSize={34} /></ComposedChart>;
}

function ChangeLabel({ item }: { item: { diff: number; pct: number | null; prev: number } }) {
  if (item.diff === 0) return <span>Same as last month</span>;
  const up = item.diff > 0;
  const text = item.prev === 0 ? "New this month" : `${Math.abs(item.pct ?? 0)}% ${up ? "more" : "less"}`;
  return <span className={`inline-flex items-center gap-0.5 ${up ? "text-destructive" : "text-positive"}`}>{up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}{text}</span>;
}

function getInsight({ totalSpent, safeDaily, averageDaily, savingsRate, biggestName, biggestShare, projectedBalance, isFutureMonth }: { totalSpent: number; safeDaily: number; averageDaily: number; savingsRate: number | null; biggestName: string | undefined; biggestShare: number; projectedBalance: number | null; isFutureMonth: boolean }) {
  if (isFutureMonth && totalSpent === 0) return "This month has no activity yet. Select a completed month to review a money pattern.";
  if (totalSpent === 0) return "No spending is recorded for this month yet. Your charts will update as transactions are added.";
  if (projectedBalance !== null && projectedBalance < 0) return `At the current pace, spending may exceed available money by ${inr(Math.abs(projectedBalance))}. Review ${biggestName ?? "your largest category"} first.`;
  if (safeDaily > 0 && averageDaily > safeDaily) return `Daily spending is ${inr(averageDaily - safeDaily)} above an even monthly pace. ${biggestName ?? "Your top category"} is the largest contributor.`;
  if (biggestName && biggestShare >= 40) return `${biggestName} represents ${Math.round(biggestShare)}% of this month’s spending, making it the clearest place to review.`;
  if (savingsRate !== null && savingsRate >= 20) return `You currently retain ${Math.round(savingsRate)}% of available money. Keep watching daily pace to protect that balance.`;
  return "Spending is within the current monthly pace. Use the daily and category views to spot changes early.";
}

function compactInr(value: number) { return Math.abs(value) >= 1000 ? `₹${Math.round(value / 1000)}k` : `₹${Math.round(value)}`; }
function Empty() { return <div className="grid h-full place-items-center px-4 text-center text-sm text-muted-foreground">Add transactions to see this chart.</div>; }