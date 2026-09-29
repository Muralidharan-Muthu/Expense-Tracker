import { useEffect, useMemo, useState } from "react";
import { ArrowDownToLine, CalendarDays, ChevronLeft, ChevronRight, Download, IndianRupee, Loader2, PencilLine, PiggyBank, Plus, Search, ShieldCheck, Trash2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DayEntryDialog } from "@/components/expense/DayEntryDialog";
import { RequireSession } from "@/components/auth/RequireSession";
import { MONTH_NAMES, TODAY_MONTH, TODAY_YEAR, WEEKDAY_NAMES, inr, isHoliday, makeMonth, monthsOfYear, today, ymd } from "@/lib/expense-config";
import { buildDayMap, useAddIncome, useAllExpenses, useCategories, useDeleteIncome, useIncome, useMonthRows, useSaveMonthTotal, useSetCarryForward } from "@/lib/expense-data";
import { buildMonthMetrics, incomeMap, monthMoney, weekdayWeekTotals } from "@/lib/expense-metrics";
import { useAutoRecurring } from "@/components/expense/PlanningCards";
import { exportMonthsToExcel } from "@/lib/export-excel";
import { useReportingPeriod } from "@/hooks/use-reporting-period";
import { PageHeader } from "@/components/PageHeader";

export function TransactionsPage() {
  const { year, month, setYear, setMonth, setPeriod } = useReportingPeriod();
  const [openDate, setOpenDate] = useState<Date | null>(null);
  const [query, setQuery] = useState("");
  const [totalDraft, setTotalDraft] = useState<string | null>(null);
  const [todayIso, setTodayIso] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => setTodayIso(today().iso);
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);

  const def = useMemo(() => makeMonth(year, month), [year, month]);
  const monthsQuery = useMonthRows();
  const expensesQuery = useAllExpenses();
  const saveTotal = useSaveMonthTotal();
  const incomeQuery = useIncome();
  const addIncome = useAddIncome();
  const deleteIncome = useDeleteIncome();
  const setCarry = useSetCarryForward();
  const [moneyDate, setMoneyDate] = useState("");
  const [moneyAmount, setMoneyAmount] = useState("");
  const [moneyNote, setMoneyNote] = useState("");
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [moneyToRemove, setMoneyToRemove] = useState<{ id: string; value: number } | null>(null);
  const { data: categories, map: CATEGORY_MAP } = useCategories();
  useAutoRecurring();
  const labelFor = (key: string) => CATEGORY_MAP[key]?.label ?? key.replace(/^c-/, "").replace(/-[a-z0-9]+$/, "").replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase());
  function openDay(d: Date) {
    setOpenDate(d);
  }
  const monthRows = monthsQuery.data ?? [];
  const expenses = expensesQuery.data ?? [];
  const dayMap = useMemo(() => buildDayMap(expenses), [expenses]);
  const incomeRows = incomeQuery.data ?? [];
  const incomeByDate = useMemo(() => incomeMap(incomeRows), [incomeRows]);
  const money = useMemo(() => monthMoney(year, month, monthRows, dayMap, incomeRows), [year, month, monthRows, dayMap, incomeRows]);
  const received = money.total;
  const monthPrefix = `${year}-${String(month).padStart(2, "0")}-`;
  const monthIncome = incomeRows.filter((r) => r.entry_date.startsWith(monthPrefix));
  const prevLabel = MONTH_NAMES[(month + 10) % 12];
  const rows = useMemo(() => buildMonthMetrics(def, dayMap, money.start + money.carry, incomeByDate), [def, dayMap, money.start, money.carry, incomeByDate]);
  const spent = rows.reduce((sum, row) => sum + row.total, 0);
  const balance = received - spent;
  const remainingDays = Math.max(1, rows.filter((row) => !todayIso || row.key >= todayIso).length);
  const safePerDay = Math.max(0, balance / remainingDays);
  const elapsedShare = year === TODAY_YEAR && month === TODAY_MONTH
    ? Math.min(1, today().day / rows.length)
    : year < TODAY_YEAR || (year === TODAY_YEAR && month < TODAY_MONTH) ? 1 : 0;
  const spendShare = received > 0 ? spent / received : 0;
  const budgetStatus = received <= 0 ? "Add income" : spendShare <= elapsedShare + 0.08 ? "On track" : "Spending fast";
  const weeks = useMemo(() => weekdayWeekTotals(year, month, dayMap), [year, month, dayMap]);

  const filteredRows = rows.filter((row) => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return true;
    if (row.key.includes(normalized) || WEEKDAY_NAMES[row.date.getDay()]?.toLowerCase().includes(normalized) || String(row.total).includes(normalized)) return true;
    for (const [field, amount] of row.day?.entries() ?? []) {
      const category = CATEGORY_MAP[field.split("|")[0] ?? ""];
      if (amount > 0 && labelFor(field.split("|")[0] ?? "").toLowerCase().includes(normalized)) return true;
    }
    return false;
  });

  async function commitTotal() {
    if (totalDraft === null) return;
    const value = Number(totalDraft) || 0;
    setTotalDraft(null);
    if (value < 0) { toast.error("The amount received can't be negative"); return; }
    if (value + money.carry + money.extra < spent) { toast.error(`Total money can't be less than the ${inr(spent)} already spent this month`); return; }
    try {
      await saveTotal.mutateAsync({ def, total: value });
      toast.success(`${def.label} amount received saved`);
    } catch {
      toast.error("Could not save the amount. Please try again.");
    }
  }

  async function submitMoney() {
    const value = Number(moneyAmount) || 0;
    const date = moneyDate || (todayIso?.startsWith(monthPrefix) ? todayIso : `${monthPrefix}01`);
    if (value <= 0) return void toast.error("Enter an amount more than ₹0");
    if (!date.startsWith(monthPrefix)) return void toast.error(`Pick a date in ${def.label}`);
    try {
      await addIncome.mutateAsync({ date, amount: value, ...(moneyNote.trim() ? { note: moneyNote.trim() } : {}) });
      toast.success(`${inr(value)} added on ${new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`);
      setMoneyAmount(""); setMoneyNote(""); setMoneyDate(""); setShowAddMoney(false);
    } catch { toast.error("Could not add the money. Please try again."); }
  }

  function askToRemoveMoney(id: string, value: number) {
    if (received - value < spent) return void toast.error("Removing this would make your balance negative");
    setMoneyToRemove({ id, value });
  }

  async function removeMoney() {
    if (!moneyToRemove) return;
    const entry = moneyToRemove;
    setMoneyToRemove(null);
    try { await deleteIncome.mutateAsync({ id: entry.id }); toast.success("Money entry removed"); }
    catch { toast.error("Could not remove. Please try again."); }
  }

  function jumpToToday() {
    const current = today();
    setPeriod(current.year, current.month);
    window.setTimeout(() => document.getElementById(`day-${current.iso}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 150);
  }

  const monthEnded = year < TODAY_YEAR || (year === TODAY_YEAR && month < TODAY_MONTH);

  const loading = monthsQuery.isLoading || expensesQuery.isLoading;

  return (
    <main className="mx-auto w-full max-w-6xl animate-fade-in px-3 py-5 sm:px-4 sm:py-8">
      <PageHeader title="Transactions" description="Record each day and keep your monthly balance clear." />

      <section aria-label="Money received" className={`mb-5 rounded-lg border p-4 sm:p-5 ${received <= 0 ? "border-warning bg-warning/10" : "bg-card"}`}>
        <div className="mb-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
          <h2 className="min-w-0 text-xs font-semibold uppercase text-muted-foreground">Money in {def.label}</h2>
          <Button size="sm" variant={showAddMoney ? "secondary" : "outline"} onClick={() => setShowAddMoney(!showAddMoney)}><Plus className="mr-1 size-4" />Add money</Button>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-muted-foreground"><PiggyBank className="size-4 shrink-0" />Carried from {prevLabel}</span>
            <span className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs text-muted-foreground"><Switch checked={money.carryEnabled} onCheckedChange={(checked) => setCarry.mutate({ year, month, enabled: checked })} aria-label="Carry over savings to next month" />Carry over</label>
              <span className="font-semibold">{inr(money.carry)}</span>
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label htmlFor="monthly-income" className="flex items-center gap-1.5 text-muted-foreground"><IndianRupee className="size-4 shrink-0" />Received at month start</label>
            <Input id="monthly-income" className="h-9 w-36 text-right font-semibold" inputMode="decimal" value={totalDraft ?? String(money.start)} onChange={(event) => setTotalDraft(event.target.value.replace(/[^\d.]/g, ""))} onBlur={commitTotal} onKeyDown={(event) => event.key === "Enter" && commitTotal()} />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-muted-foreground"><ArrowDownToLine className="size-4 shrink-0" />Added during the month{monthIncome.length > 0 && ` (${monthIncome.length})`}</span>
            <span className="font-semibold text-positive">+{inr(money.extra)}</span>
          </div>
          {monthIncome.length > 0 && (
            <ul className="space-y-1 rounded-md bg-secondary/60 p-2">
              {monthIncome.map((r) => (
                <li key={r.id} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 text-xs">
                  <span className="min-w-0 break-words">{new Date(r.entry_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}{r.note ? ` · ${r.note}` : ""}</span>
                  <span className="font-semibold text-positive">+{inr(r.amount)}</span>
                   <Button variant="ghost" size="icon" className="size-7" aria-label="Remove money entry" onClick={() => askToRemoveMoney(r.id, r.amount)}><Trash2 className="size-3.5" /></Button>
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-2 text-base">
            <span className="font-semibold">Total available</span>
            <span className="font-bold text-primary">{inr(received)}</span>
          </div>
        </div>
        {showAddMoney && (
          <div className="mt-3 grid gap-2 rounded-md border border-dashed p-3 sm:grid-cols-[auto_1fr_1.5fr_auto]">
            <Input type="date" aria-label="Date received" min={`${monthPrefix}01`} max={ymd(new Date(year, month, 0))} value={moneyDate || (todayIso?.startsWith(monthPrefix) ? todayIso : `${monthPrefix}01`)} onChange={(e) => setMoneyDate(e.target.value)} />
            <Input inputMode="decimal" placeholder="Amount (₹)" aria-label="Amount" value={moneyAmount} onChange={(e) => setMoneyAmount(e.target.value.replace(/[^\d.]/g, ""))} />
            <Input placeholder="Note (e.g. bonus)" aria-label="Note" maxLength={60} value={moneyNote} onChange={(e) => setMoneyNote(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submitMoney()} />
            <Button onClick={submitMoney} disabled={addIncome.isPending}>{addIncome.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}Add</Button>
          </div>
        )}
        {received <= 0 && <p className="mt-3 text-xs font-medium text-muted-foreground">No money received yet — you can still record days, but expenses can't exceed the money available.</p>}
        {monthEnded && received > 0 && <p className="mt-3 text-xs font-medium text-muted-foreground">{balance > 0 ? `You saved ${inr(balance)} this month — carried to next month.` : "No savings left to carry to next month."}</p>}
      </section>

      <section aria-label="Monthly overview" className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Metric label="Total available" value={inr(received)} icon={<IndianRupee className="size-4" />} tone="text-primary" />
        <Metric label="Total spent" value={inr(spent)} tone="text-destructive" />
        <Metric label="In-hand balance" value={inr(balance)} icon={<Wallet className="size-4" />} tone={balance < 0 ? "text-destructive" : "text-positive"} />
        <Metric label="Safe per day" value={inr(safePerDay)} />
        <Metric label="Budget health" value={budgetStatus} icon={<ShieldCheck className="size-4" />} tone={budgetStatus === "Spending fast" ? "text-warning" : "text-positive"} wide />
      </section>

      <section className="mb-5 rounded-lg border bg-card p-3 sm:p-4" aria-label="Choose month">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:flex sm:justify-center">
          <div className="flex min-w-0 items-center justify-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setYear(year - 1)} aria-label="Previous year"><ChevronLeft className="size-4" /></Button>
            <span className="min-w-16 text-center text-lg font-bold">{year}</span>
            <Button variant="outline" size="icon" onClick={() => setYear(year + 1)} aria-label="Next year"><ChevronRight className="size-4" /></Button>
          </div>
          <Button variant="ghost" size="sm" onClick={jumpToToday}>Jump to today</Button>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-1.5 sm:grid-cols-6 sm:gap-2">
          {MONTH_NAMES.map((name, index) => (
            <Button key={name} variant={month === index + 1 ? "default" : "outline"} size="sm" onClick={() => setMonth(index + 1)}>{name.slice(0, 3)}</Button>
          ))}
        </div>
      </section>

      <section className="mb-5" aria-labelledby="weekly-heading">
        <div className="mb-2 flex items-center gap-2"><CalendarDays className="size-4 text-primary" /><h2 id="weekly-heading" className="text-sm font-semibold">Weekly totals · Monday–Sunday</h2></div>
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {weeks.map((week, index) => (
            <div key={week.key} className="min-w-32 flex-1 rounded-md border bg-card px-3 py-2">
              <p className="text-[11px] font-medium text-muted-foreground">Week {index + 1} · {week.label}</p>
              <p className="mt-1 text-base font-bold">{inr(week.total)}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mb-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
        <div className="relative min-w-0">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search date, day, category or amount" value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Button variant="outline" size="sm" aria-label="Export this month" onClick={() => exportMonthsToExcel([def], monthRows, expenses, `${def.label}.xlsx`, categories)}><Download className="mr-1 size-4" />Month</Button>
          <Button variant="outline" size="sm" aria-label={`Export ${year}`} onClick={() => exportMonthsToExcel(monthsOfYear(year), monthRows, expenses, `LiWise-${year}.xlsx`, categories)}><Download className="mr-1 size-4" />Year</Button>
           <Button size="sm" aria-label="Add today" onClick={() => { const current = today(); setPeriod(current.year, current.month); if (current.year !== year || current.month !== month) { setOpenDate(null); toast.info("Switched to this month — tap Add today again"); return; } openDay(new Date(current.year, current.month - 1, current.day)); }}><PencilLine className="mr-1 size-4" />Today</Button>
        </div>
      </div>

      <Card className="mb-4 overflow-hidden rounded-lg p-0 shadow-sm">
        <div className="hidden grid-cols-[1.2fr_2fr_7rem_7rem] gap-3 border-b bg-secondary px-4 py-2.5 text-[11px] font-semibold uppercase text-secondary-foreground sm:grid">
          <span>Date</span><span>Spending</span><span className="text-right">Spent</span><span className="text-right">Balance</span>
        </div>
        {loading && <div className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Loading your sheet…</div>}
        {!loading && filteredRows.map((row) => {
          const holiday = isHoliday(row.date);
          const isToday = row.key === todayIso;
          const share = row.before > 0 ? Math.min(1, row.total / row.before) : 0;
          return (
            <button type="button" id={`day-${row.key}`} key={row.key} onClick={() => openDay(row.date)} className={`grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 border-b px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-muted/50 sm:grid-cols-[1.2fr_2fr_7rem_7rem] ${holiday ? "bg-accent/35" : ""} ${isToday ? "ring-2 ring-inset ring-primary/40" : ""}`}>
              <div className="col-start-1 row-start-1 min-w-0"><div className="flex min-w-0 flex-wrap items-center gap-1.5 text-sm font-semibold"><span>{row.date.getDate()} {row.date.toLocaleDateString("en-IN", { month: "short" })}</span>{isToday && <Badge className="text-[10px]">Today</Badge>}{holiday && <Badge variant="secondary" className="text-[10px]">Holiday</Badge>}</div><div className="text-xs text-muted-foreground">{WEEKDAY_NAMES[row.date.getDay()]}</div></div>
              <div className="col-span-2 row-start-2 flex min-w-0 flex-wrap gap-1 sm:col-span-1 sm:row-start-auto">
                {row.income > 0 && <span className="rounded bg-positive/15 px-1.5 py-0.5 text-[11px] font-semibold text-positive">+{inr(row.income)} received</span>}
                {[...(row.day?.entries() ?? [])].filter(([, amount]) => amount > 0).map(([field, amount]) => { const [key, slot] = field.split("|"); const category = CATEGORY_MAP[key ?? ""]; return <span key={field} className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${category?.tint ?? ""}`}>{labelFor(key ?? "")}{slot !== "none" ? ` ${slot}` : ""} {inr(amount)}</span>; })}
                {row.total === 0 && row.income === 0 && <span className="text-xs text-muted-foreground">No entry yet</span>}
              </div>
              <div className="col-start-2 row-start-1 flex flex-col items-end gap-0.5 text-right sm:hidden">
                <span className="text-sm font-semibold"><span className="text-[10px] font-medium uppercase text-muted-foreground">Spent </span><span className="text-destructive">{inr(row.total)}</span></span>
                <span className="text-sm font-semibold"><span className="text-[10px] font-medium uppercase text-muted-foreground">Bal </span><span className={row.after < 0 ? "text-destructive" : "text-primary"}>{inr(row.after)}</span></span>
              </div>
              <div className="hidden text-right sm:block"><span className="text-sm font-semibold text-destructive">{inr(row.total)}</span><div className="ml-auto mt-1 h-1 w-16 overflow-hidden rounded bg-muted"><div className="h-full bg-destructive/70" style={{ width: `${share * 100}%` }} /></div></div>
              <span className={`hidden text-right text-sm font-semibold sm:block ${row.after < 0 ? "text-destructive" : "text-primary"}`}>{inr(row.after)}</span>
            </button>
          );
        })}
        {!loading && filteredRows.length === 0 && <div className="px-4 py-10 text-center text-sm text-muted-foreground">No days match your search.</div>}
      </Card>

      <DayEntryDialog date={openDate} dayMap={dayMap} balanceBefore={rows.find((row) => openDate && row.key === ymd(openDate))?.before ?? received} received={received} monthSpent={spent} onOpenChange={(open) => !open && setOpenDate(null)} />
      <AlertDialog open={moneyToRemove !== null} onOpenChange={(open) => !open && setMoneyToRemove(null)}>
        <AlertDialogContent className="w-[calc(100%-1.5rem)] rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this money entry?</AlertDialogTitle>
            <AlertDialogDescription>
              {moneyToRemove ? `${inr(moneyToRemove.value)} will be removed from this month’s available money. This cannot be undone.` : "This money entry will be removed."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep entry</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={removeMoney}>Remove money</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}

function Metric({ label, value, tone = "text-foreground", icon, wide = false }: { label: string; value: string; tone?: string; icon?: React.ReactNode; wide?: boolean }) {
  return <Card className={`rounded-lg shadow-sm ${wide ? "col-span-2 lg:col-span-1" : ""}`}><CardContent className="p-3 sm:p-4"><p className="text-[10px] font-semibold uppercase text-muted-foreground sm:text-xs">{label}</p><p className={`mt-1 flex min-w-0 flex-wrap items-center gap-1.5 break-words text-lg font-bold sm:text-xl ${tone}`}>{icon}{value}</p></CardContent></Card>;
}
