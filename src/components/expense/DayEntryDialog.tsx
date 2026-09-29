import { useEffect, useMemo, useState } from "react";
import { CopyPlus, Loader2, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  SLOT_LABELS,
  WEEKDAY_NAMES,
  inr,
  isHoliday,
  tintFor,
  type CategoryDef,
  type SlotKey,
} from "@/lib/expense-config";
import { dayTotal, useCategories, useSaveCategories, useSaveDay, type DayMap } from "@/lib/expense-data";

type Props = {
  date: Date | null;
  dayMap: DayMap;
  balanceBefore: number;
  /** Amount received for this month. */
  received: number;
  /** Total already spent in this month (including this day's saved amounts). */
  monthSpent: number;
  onOpenChange: (open: boolean) => void;
};

function keyFor(d: Date) {
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function DayEntryDialog({ date, dayMap, balanceBefore, received, monthSpent, onOpenChange }: Props) {
  const save = useSaveDay();
  const { data: categories } = useCategories();
  const saveCats = useSaveCategories();
  const [values, setValues] = useState<Record<string, string>>({});
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newTimed, setNewTimed] = useState(false);
  const [removeMode, setRemoveMode] = useState(false);
  const [categoryToRemove, setCategoryToRemove] = useState<CategoryDef | null>(null);

  const stored = useMemo(() => (date ? dayMap.get(keyFor(date)) : undefined), [date, dayMap]);

  useEffect(() => {
    if (!date) return;
    const next: Record<string, string> = {};
    for (const c of categories) {
      for (const slot of c.slots) {
        const amount = stored?.get(`${c.key}|${slot}`) ?? 0;
        next[`${c.key}|${slot}`] = amount ? String(amount) : "";
      }
    }
    setValues(next);
    setAdding(false);
    setRemoveMode(false);
  }, [date, stored, categories]);

  const total = Object.values(values).reduce((sum, v) => sum + (Number(v) || 0), 0);
  const hiddenStored = [...(stored?.entries() ?? [])].reduce(
    (s, [k, v]) => (k in values ? s : s + v),
    0,
  );
  const dayTotalNew = total + hiddenStored;
  const monthAfter = monthSpent - dayTotal(stored) + dayTotalNew;
  const overLimit = monthAfter > received;

  function copyPrevious() {
    if (!date) return;
    const prev = new Date(date);
    prev.setDate(prev.getDate() - 1);
    const prevDay = dayMap.get(keyFor(prev));
    if (!prevDay || dayTotal(prevDay) === 0) {
      toast.info("No entries found for the previous day");
      return;
    }
    const next: Record<string, string> = {};
    for (const c of categories) {
      for (const slot of c.slots) {
        const amount = prevDay.get(`${c.key}|${slot}`) ?? 0;
        next[`${c.key}|${slot}`] = amount ? String(amount) : "";
      }
    }
    setValues(next);
    toast.success("Copied previous day's amounts");
  }

  async function addCategory(): Promise<void> {
    const label = newName.trim();
    if (!label) return void toast.error("Enter a name for the expense");
    if (label.length > 40) return void toast.error("Keep the name under 40 characters");
    if (categories.some((c) => c.label.toLowerCase() === label.toLowerCase()))
      return void toast.error("That expense already exists");
    const base = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 30) || "item";
    const key = `c-${base}-${Date.now().toString(36)}`;
    const cat: CategoryDef = {
      key,
      label,
      slots: newTimed ? ["morning", "afternoon", "evening"] : ["none"],
      tint: tintFor(categories.length),
      kind: "spend",
    };
    try {
      await saveCats.mutateAsync([...categories, cat]);
      setNewName("");
      setNewTimed(false);
      setAdding(false);
      toast.success(`"${label}" added to every day`);
    } catch {
      toast.error("Could not add. Please try again.");
    }
  }

  async function removeCategory() {
    if (!categoryToRemove) return;
    const cat = categoryToRemove;
    setCategoryToRemove(null);
    try {
      await saveCats.mutateAsync(categories.filter((c) => c.key !== cat.key));
      toast.success(`"${cat.label}" removed`);
    } catch {
      toast.error("Could not remove. Please try again.");
    }
  }

  async function handleSave(): Promise<void> {
    if (!date) return;
    if (received <= 0) return void toast.error("Enter the amount received for this month first");
    if (overLimit)
      return void toast.error(
        `This would make the month's spending ${inr(monthAfter)}, more than the ${inr(received)} received.`,
      );
    const dateKey = keyFor(date);
    // Snapshot the previously saved amounts so the save can be undone.
    const previous = categories.flatMap((c) =>
      c.slots.map((slot) => ({
        category: c.key,
        slot: slot as SlotKey,
        amount: stored?.get(`${c.key}|${slot}`) ?? 0,
      })),
    );
    const payload = categories.flatMap((c) =>
      c.slots.map((slot) => ({
        category: c.key,
        slot: slot as SlotKey,
        amount: Number(values[`${c.key}|${slot}`]) || 0,
      })),
    );
    try {
      await save.mutateAsync({ date: dateKey, values: payload });
      toast.success("Day saved", {
        duration: 8000,
        action: {
          label: "Undo",
          onClick: () => {
            save
              .mutateAsync({ date: dateKey, values: previous })
              .then(() => toast.success("Previous amounts restored"))
              .catch(() => toast.error("Could not undo. Please re-enter the amounts."));
          },
        },
      });
      onOpenChange(false);
    } catch {
      toast.error("Could not save. Please try again.");
    }
  }

  return (
    <Dialog open={!!date} onOpenChange={onOpenChange}>
      <DialogContent className="no-scrollbar max-h-[92dvh] w-[calc(100%-1.5rem)] gap-3 overflow-y-auto p-4 sm:max-w-2xl sm:gap-4 sm:p-6">
        {date && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {date.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                {isHoliday(date) && <Badge variant="secondary">Holiday</Badge>}
              </DialogTitle>
              <DialogDescription>
                {WEEKDAY_NAMES[date.getDay()]} · balance before this day {inr(balanceBefore)}
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" size="sm" variant={adding ? "secondary" : "outline"} onClick={() => { setAdding(!adding); setRemoveMode(false); }}>
                <Plus className="mr-1 size-4" /> Add expense
              </Button>
              <Button type="button" size="sm" variant={removeMode ? "destructive" : "outline"} onClick={() => { setRemoveMode(!removeMode); setAdding(false); }}>
                <Trash2 className="mr-1 size-4" /> {removeMode ? "Done removing" : "Remove"}
              </Button>
            </div>

            {adding && (
              <div className="space-y-2 rounded-md border border-dashed bg-card p-3">
                <Label htmlFor="new-expense" className="text-xs">Expense name</Label>
                <Input id="new-expense" autoFocus maxLength={40} placeholder="e.g. Minoxidil" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addCategory()} />
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <input type="checkbox" checked={newTimed} onChange={(e) => setNewTimed(e.target.checked)} />
                  Separate morning, afternoon and evening amounts
                </label>
                <Button type="button" size="sm" onClick={addCategory} disabled={saveCats.isPending}>
                  {saveCats.isPending && <Loader2 className="mr-2 size-4 animate-spin" />} Add to every day
                </Button>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              {categories.map((c) => (
                <div key={c.key} className="relative rounded-md border bg-card p-3">
                  {removeMode && (
                     <Button type="button" variant="destructive" size="icon" aria-label={`Remove ${c.label}`} onClick={() => setCategoryToRemove(c)} className="absolute -right-2 -top-2 size-6 rounded-full shadow">
                      <X className="size-3.5" />
                     </Button>
                  )}
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold">{c.label}</span>
                    <span className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${c.tint}`}>
                      {c.kind === "spend" ? "Expense" : c.kind === "invest" ? "Investment" : "Transfer"}
                    </span>
                  </div>
                  <div className={c.slots.length > 1 ? "grid grid-cols-3 gap-2" : ""}>
                    {c.slots.map((slot) => {
                      const id = `${c.key}|${slot}`;
                      return (
                        <div key={id} className="space-y-1">
                          <Label htmlFor={id} className="text-xs text-muted-foreground">
                            {SLOT_LABELS[slot]} (₹)
                          </Label>
                          <Input
                            id={id}
                            inputMode="decimal"
                            placeholder="0"
                            disabled={removeMode}
                            value={values[id] ?? ""}
                            onChange={(e) => setValues((v) => ({ ...v, [id]: e.target.value.replace(/[^\d.]/g, "") }))}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between rounded-lg bg-secondary px-4 py-3 text-sm">
              <span>Day total</span>
              <span className="font-semibold">{inr(dayTotalNew)}</span>
            </div>
            <div className={`flex items-center justify-between rounded-lg px-4 py-3 text-sm ${overLimit ? "bg-destructive/10 text-destructive" : "bg-primary/10"}`}>
              <span>{overLimit ? "Over the amount received" : "Balance after this day"}</span>
              <span className="font-semibold">{overLimit ? inr(monthAfter - received) : inr(balanceBefore - dayTotalNew)}</span>
            </div>

            <DialogFooter className="gap-2 sm:justify-between">
              <Button type="button" variant="outline" onClick={copyPrevious}>
                <CopyPlus className="mr-2 size-4" /> Copy previous day
              </Button>
              <Button type="button" onClick={handleSave} disabled={save.isPending || overLimit || received < 0}>
                {save.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                Save day
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
      <AlertDialog open={categoryToRemove !== null} onOpenChange={(open) => !open && setCategoryToRemove(null)}>
        <AlertDialogContent className="w-[calc(100%-1.5rem)] rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {categoryToRemove?.label}?</AlertDialogTitle>
            <AlertDialogDescription>
              This expense field will disappear from every day. Amounts you already saved will remain in your totals.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep expense</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={removeCategory}>Remove expense</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
