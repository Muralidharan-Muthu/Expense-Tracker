import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, HandCoins, Loader2, Repeat, Target, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { inr, today, type SlotKey } from "@/lib/expense-config";
import {
  useAddLoan, useAddRecurring, useApplyRecurring, useCategories, useDeleteLoan, useDeleteRecurring,
  useLoans, useRecurring, useRepayLoan, useSetSavingsGoal,
} from "@/lib/expense-data";

const applied = new Set<string>();
const num = (v: string) => v.replace(/[^\d.]/g, "");
const shortDate = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

/** Fills in due recurring expenses once per day per session. */
export function useAutoRecurring() {
  const apply = useApplyRecurring();
  const { data: rules } = useRecurring();
  const count = rules?.length ?? 0;
  useEffect(() => {
    if (!count) return;
    const iso = today().iso;
    const key = `${iso}:${count}`;
    if (applied.has(key)) return;
    applied.add(key);
    apply.mutateAsync({ today: iso })
      .then((r) => { const n = Number((r as { added?: number } | undefined)?.added ?? 0); if (n > 0) toast.success(`${n} recurring expense${n > 1 ? "s" : ""} filled in`); })
      .catch(() => applied.delete(key));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);
}

export function SavingsGoalCard({ year, month, label, left, goal }: { year: number; month: number; label: string; left: number; goal: number }) {
  const save = useSetSavingsGoal();
  const [draft, setDraft] = useState<string | null>(null);
  const saved = Math.max(0, left);
  const pct = goal > 0 ? Math.min(100, (saved / goal) * 100) : 0;
  async function commit() {
    if (draft === null) return;
    const value = Number(draft) || 0;
    setDraft(null);
    if (value === goal) return;
    try { await save.mutateAsync({ year, month, goal: value }); toast.success(value ? "Savings goal saved" : "Savings goal cleared"); }
    catch { toast.error("Could not save the goal."); }
  }
  return (
    <Card className="rounded-lg shadow-sm">
      <CardHeader className="p-4 pb-2"><CardTitle className="flex items-center gap-2 text-base"><Target className="size-4 text-primary" />Savings goal · {label}</CardTitle></CardHeader>
      <CardContent className="space-y-3 p-4 pt-0">
        <div className="grid grid-cols-[minmax(0,1fr)_8rem] items-center gap-3">
          <label htmlFor="savings-goal" className="text-sm text-muted-foreground">I want to save</label>
          <Input id="savings-goal" className="h-9 text-right font-semibold" inputMode="decimal" placeholder="₹ goal" value={draft ?? (goal ? String(goal) : "")} onChange={(e) => setDraft(num(e.target.value))} onBlur={commit} onKeyDown={(e) => e.key === "Enter" && commit()} />
        </div>
        {goal > 0 ? (
          <>
            <Progress value={pct} className={pct >= 100 ? "[&>div]:bg-positive" : "[&>div]:bg-primary"} />
            <p className="text-xs text-muted-foreground">
              {inr(saved)} left of {inr(goal)} goal · {pct >= 100 ? "On target — keep it up!" : `spend ${inr(goal - saved)} less to reach it`}
            </p>
          </>
        ) : <p className="text-xs text-muted-foreground">Set a target and watch your leftover money grow toward it.</p>}
      </CardContent>
    </Card>
  );
}

export function RecurringCard() {
  const { data: rules = [] } = useRecurring();
  const { data: categories, map } = useCategories();
  const add = useAddRecurring();
  const del = useDeleteRecurring();
  const apply = useApplyRecurring();
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [day, setDay] = useState("1");
  const [ruleToRemove, setRuleToRemove] = useState<{ id: string; label: string } | null>(null);
  async function submit() {
    const cat = map[category];
    const value = Number(amount) || 0;
    const d = Math.round(Number(day));
    if (!cat) return void toast.error("Pick a category");
    if (value <= 0) return void toast.error("Enter an amount more than ₹0");
    if (!(d >= 1 && d <= 31)) return void toast.error("Day must be between 1 and 31");
    try {
      const iso = today().iso;
      await add.mutateAsync({ category: cat.key, slot: (cat.slots[0] ?? "none") as SlotKey, amount: value, day: d, startDate: iso });
      await apply.mutateAsync({ today: iso });
      toast.success(`${cat.label} will repeat on day ${d} every month`);
      setAmount(""); setCategory("");
    } catch { toast.error("Could not save. Please try again."); }
  }
  async function remove() {
    if (!ruleToRemove) return;
    const rule = ruleToRemove;
    setRuleToRemove(null);
    try { await del.mutateAsync({ id: rule.id }); toast.success("Recurring expense stopped"); } catch { toast.error("Could not remove."); }
  }
  return (
    <Card className="rounded-lg shadow-sm">
      <CardHeader className="p-4 pb-2"><CardTitle className="flex items-center gap-2 text-base"><Repeat className="size-4 text-primary" />Recurring expenses</CardTitle></CardHeader>
      <CardContent className="space-y-3 p-4 pt-0">
        <p className="text-xs text-muted-foreground">Filled in automatically on their day each month. You can still edit the day afterwards.</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-[minmax(0,1fr)_6.5rem_4.5rem_auto]">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="col-span-2 sm:col-span-1" aria-label="Recurring category"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>{categories.map((c) => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}</SelectContent>
          </Select>
          <Input inputMode="decimal" placeholder="₹ amount" aria-label="Recurring amount" value={amount} onChange={(e) => setAmount(num(e.target.value))} />
          <Input inputMode="numeric" placeholder="Day" aria-label="Day of month" value={day} onChange={(e) => setDay(e.target.value.replace(/\D/g, "").slice(0, 2))} />
          <Button className="col-span-2 sm:col-span-1" onClick={submit} disabled={add.isPending || apply.isPending}>{(add.isPending || apply.isPending) && <Loader2 className="mr-2 size-4 animate-spin" />}Add</Button>
        </div>
        {rules.length === 0 ? <p className="text-xs text-muted-foreground">Nothing repeating yet — try adding your rent.</p> : (
          <ul className="space-y-1.5">
            {rules.map((r) => (
              <li key={r.id} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 rounded-md bg-secondary/60 px-3 py-2 text-sm">
                <span className="min-w-0 break-words"><span className="font-medium">{map[r.category]?.label ?? r.category}</span><span className="text-xs text-muted-foreground"> · day {r.day_of_month}</span></span>
                <span className="font-semibold">{inr(r.amount)}</span>
                 <Button variant="ghost" size="icon" className="size-7" aria-label="Stop recurring expense" onClick={() => setRuleToRemove({ id: r.id, label: map[r.category]?.label ?? r.category })}><Trash2 className="size-3.5" /></Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      <AlertDialog open={ruleToRemove !== null} onOpenChange={(open) => !open && setRuleToRemove(null)}>
        <AlertDialogContent className="w-[calc(100%-1.5rem)] rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Stop recurring expense?</AlertDialogTitle>
            <AlertDialogDescription>{ruleToRemove?.label} will no longer be filled in automatically. Past entries will stay in your sheet.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep recurring</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={remove}>Stop recurring</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

export function LoansCard() {
  const { data: loans = [] } = useLoans();
  const add = useAddLoan();
  const repay = useRepayLoan();
  const del = useDeleteLoan();
  const [person, setPerson] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const [open, setOpen] = useState(false);
  const [loanToDelete, setLoanToDelete] = useState<{ id: string; person: string } | null>(null);
  const [loanToRepay, setLoanToRepay] = useState<{ id: string; person: string } | null>(null);
  const pending = loans.filter((l) => !l.repaid_at);
  const owed = pending.reduce((s, l) => s + l.amount, 0);
  async function submit() {
    const value = Number(amount) || 0;
    if (!person.trim()) return void toast.error("Enter who you paid for");
    if (value <= 0) return void toast.error("Enter an amount more than ₹0");
    try {
      await add.mutateAsync({ person: person.trim(), amount: value, date: date || today().iso, ...(note.trim() ? { note: note.trim() } : {}) });
      toast.success(`${inr(value)} owed by ${person.trim()} saved`);
      setPerson(""); setAmount(""); setDate(""); setNote(""); setOpen(false);
    } catch { toast.error("Could not save. Please try again."); }
  }
  async function markRepaid(addAsIncome: boolean) {
    if (!loanToRepay) return;
    const loan = loanToRepay;
    setLoanToRepay(null);
    try { await repay.mutateAsync({ id: loan.id, date: today().iso, addAsIncome }); toast.success(addAsIncome ? "Marked paid and added to your money" : "Marked as paid back"); }
    catch { toast.error("Could not update. Please try again."); }
  }
  async function remove() {
    if (!loanToDelete) return;
    const loan = loanToDelete;
    setLoanToDelete(null);
    try { await del.mutateAsync({ id: loan.id }); toast.success("Record deleted"); } catch { toast.error("Could not delete."); }
  }
  return (
    <Card className="rounded-lg shadow-sm">
      <CardHeader className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 p-4 pb-2">
        <CardTitle className="flex min-w-0 items-center gap-2 text-base"><HandCoins className="size-4 shrink-0 text-primary" />Money owed to me</CardTitle>
        <Button size="sm" variant={open ? "secondary" : "outline"} onClick={() => setOpen(!open)}>{open ? "Close" : "Add"}</Button>
      </CardHeader>
      <CardContent className="space-y-3 p-4 pt-0">
        <p className="text-sm"><span className="text-muted-foreground">Still to get back: </span><span className="font-bold text-warning">{inr(owed)}</span>{pending.length > 0 && <span className="text-xs text-muted-foreground"> · {pending.length} {pending.length === 1 ? "person" : "people"}</span>}</p>
        {open && (
          <div className="grid gap-2 rounded-md border border-dashed p-3 sm:grid-cols-2">
            <Input placeholder="Person's name" aria-label="Person" maxLength={60} value={person} onChange={(e) => setPerson(e.target.value)} />
            <Input inputMode="decimal" placeholder="₹ amount" aria-label="Amount owed" value={amount} onChange={(e) => setAmount(num(e.target.value))} />
            <Input type="date" aria-label="Date paid" value={date || today().iso} onChange={(e) => setDate(e.target.value)} />
            <Input placeholder="Note (e.g. lunch)" aria-label="Note" maxLength={80} value={note} onChange={(e) => setNote(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} />
            <Button className="sm:col-span-2" onClick={submit} disabled={add.isPending}>{add.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}Save</Button>
            <p className="text-[11px] text-muted-foreground sm:col-span-2">Tip: also log the amount in your sheet (e.g. under Others) on the day you paid.</p>
          </div>
        )}
        {loans.length === 0 ? <p className="text-xs text-muted-foreground">Paid for a friend? Keep track here until they pay you back.</p> : (
          <ul className="space-y-1.5">
            {loans.map((l) => (
              <li key={l.id} className={`grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 rounded-md px-3 py-2 text-sm ${l.repaid_at ? "bg-muted/50 text-muted-foreground" : "bg-secondary/60"}`}>
                <span className="min-w-0 break-words"><span className="font-medium">{l.person}</span><span className="text-xs text-muted-foreground"> · {shortDate(l.entry_date)}{l.note ? ` · ${l.note}` : ""}{l.repaid_at ? ` · paid back ${shortDate(l.repaid_at)}` : ""}</span></span>
                <span className={`font-semibold ${l.repaid_at ? "line-through" : ""}`}>{inr(l.amount)}</span>
                <span className="flex">
                   {!l.repaid_at && <Button variant="ghost" size="icon" className="size-7" aria-label={`Mark ${l.person} as paid back`} disabled={repay.isPending} onClick={() => setLoanToRepay({ id: l.id, person: l.person })}><Check className="size-3.5 text-positive" /></Button>}
                   <Button variant="ghost" size="icon" className="size-7" aria-label="Delete record" onClick={() => setLoanToDelete({ id: l.id, person: l.person })}><Trash2 className="size-3.5" /></Button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      <AlertDialog open={loanToRepay !== null} onOpenChange={(open) => !open && setLoanToRepay(null)}>
        <AlertDialogContent className="w-[calc(100%-1.5rem)] rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Mark as paid back?</AlertDialogTitle>
            <AlertDialogDescription>{loanToRepay?.person} paid you back. Choose whether to also add it to today’s received money.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:space-x-0">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-secondary text-secondary-foreground hover:bg-secondary/80" onClick={() => markRepaid(false)}>Mark paid only</AlertDialogAction>
            <AlertDialogAction onClick={() => markRepaid(true)}>Mark paid + add money</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={loanToDelete !== null} onOpenChange={(open) => !open && setLoanToDelete(null)}>
        <AlertDialogContent className="w-[calc(100%-1.5rem)] rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this record?</AlertDialogTitle>
            <AlertDialogDescription>The money owed record for {loanToDelete?.person} will be permanently deleted.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep record</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={remove}>Delete record</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
