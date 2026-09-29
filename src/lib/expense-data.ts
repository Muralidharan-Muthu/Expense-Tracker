import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CATEGORIES, type CategoryDef, type MonthDef, type SlotKey } from "./expense-config";
import { addLoan, addRecurring, applyRecurring, deleteLoan, deleteRecurring, repayLoan, setSavingsGoal, addIncome, deleteIncome, setCarryForward, getCategories, saveCategories, getProfile, saveBudget, saveDay, saveMonthTotal, saveProfile } from "./expense.functions";
import { getFinanceData, getLoansData, getPlanningData } from "./expense-read.functions";

export const expenseQueryKeys = {
  finance: ["expense-data", "finance"] as const,
  planning: ["expense-data", "planning"] as const,
  loans: ["expense-data", "loans"] as const,
};

export type ExpenseRow = {
  id: string;
  entry_date: string;
  category: string;
  slot: string;
  amount: number;
};

export type MonthRow = {
  id: string;
  year: number;
  month: number;
  total_received: number;
  notes: string | null;
  carry_forward: boolean;
  savings_goal: number;
};

export type IncomeRow = { id: string; entry_date: string; amount: number; note: string | null };

export function useIncome() {
  return pick(useFinanceData(), (d) => d.income as IncomeRow[]);
}

function useDataMutation<I>(fn: (i: I) => Promise<unknown>, queryKeys: readonly (readonly string[])[] = [expenseQueryKeys.finance]) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: fn, onSuccess: () => Promise.all(queryKeys.map((queryKey) => qc.invalidateQueries({ queryKey }))) });
}

export function useAddIncome() {
  const fn = useServerFn(addIncome);
  return useDataMutation((data: { date: string; amount: number; note?: string }) => fn({ data }));
}

export function useDeleteIncome() {
  const fn = useServerFn(deleteIncome);
  return useDataMutation((data: { id: string }) => fn({ data }));
}

export function useSetCarryForward() {
  const fn = useServerFn(setCarryForward);
  return useDataMutation((data: { year: number; month: number; enabled: boolean }) => fn({ data }));
}

export type BudgetRow = { id: string; category: string; monthly_limit: number };

export type Profile = {
  email: string;
  name: string | null;
  provider: string;
  age: number | null;
  profession: string | null;
};

export function useProfile() {
  const fn = useServerFn(getProfile);
  return useQuery({ queryKey: ["profile"], queryFn: () => fn() });
}

export function useSaveProfile() {
  const qc = useQueryClient();
  const fn = useServerFn(saveProfile);
  return useMutation({
    mutationFn: (input: { fullName: string; age: number; profession: string }) => fn({ data: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
  });
}

function useFinanceData() {
  const fetchFinance = useServerFn(getFinanceData);
  return useQuery({ queryKey: expenseQueryKeys.finance, queryFn: () => fetchFinance() });
}

function usePlanningData() {
  const fetchPlanning = useServerFn(getPlanningData);
  return useQuery({ queryKey: expenseQueryKeys.planning, queryFn: () => fetchPlanning() });
}

function useLoanData() {
  const fetchLoans = useServerFn(getLoansData);
  return useQuery({ queryKey: expenseQueryKeys.loans, queryFn: () => fetchLoans() });
}

function pick<Q extends { data?: unknown }, T>(q: Q, sel: (d: NonNullable<Q["data"]>) => T) {
  return { ...q, data: q.data ? sel(q.data) : undefined };
}

export function useMonthRows() {
  return pick(useFinanceData(), (d) => d.months as MonthRow[]);
}

export function useAllExpenses() {
  return pick(useFinanceData(), (d) => d.expenses as ExpenseRow[]);
}

export function useBudgets() {
  return pick(usePlanningData(), (d) => d.budgets as BudgetRow[]);
}

export function useSaveDay() {
  const qc = useQueryClient();
  const fn = useServerFn(saveDay);
  return useMutation({
    mutationFn: (input: { date: string; values: { category: string; slot: SlotKey; amount: number }[] }) =>
      fn({ data: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: expenseQueryKeys.finance }),
  });
}

export function useSaveMonthTotal() {
  const qc = useQueryClient();
  const fn = useServerFn(saveMonthTotal);
  return useMutation({
    mutationFn: (input: { def: MonthDef; total: number }) =>
      fn({ data: { year: input.def.year, month: input.def.month, total: input.total } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: expenseQueryKeys.finance }),
  });
}

export function useSaveBudget() {
  const qc = useQueryClient();
  const fn = useServerFn(saveBudget);
  return useMutation({
    mutationFn: (input: { category: string; limit: number }) => fn({ data: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: expenseQueryKeys.planning }),
  });
}

export type DayMap = Map<string, Map<string, number>>;

/** date -> ("category|slot" -> amount) */
export function buildDayMap(rows: ExpenseRow[]): DayMap {
  const map: DayMap = new Map();
  for (const r of rows) {
    if (!map.has(r.entry_date)) map.set(r.entry_date, new Map());
    map.get(r.entry_date)!.set(`${r.category}|${r.slot}`, r.amount);
  }
  return map;
}

export function dayTotal(day: Map<string, number> | undefined) {
  if (!day) return 0;
  let sum = 0;
  for (const v of day.values()) sum += v;
  return sum;
}

/** The signed-in user's own list of expense cards (defaults until they customise it). */
export function useCategories() {
  const fn = useServerFn(getCategories);
  const q = useQuery({ queryKey: ["categories"], queryFn: () => fn() });
  const list = (q.data as CategoryDef[] | null | undefined) ?? CATEGORIES;
  return { ...q, data: list, map: Object.fromEntries(list.map((c) => [c.key, c])) as Record<string, CategoryDef> };
}

export function useSaveCategories() {
  const qc = useQueryClient();
  const fn = useServerFn(saveCategories);
  return useMutation({
    mutationFn: (categories: CategoryDef[]) => fn({ data: { categories } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export type RecurringRow = { id: string; category: string; slot: string; amount: number; day_of_month: number; start_date: string };
export type LoanRow = { id: string; person: string; amount: number; entry_date: string; note: string | null; repaid_at: string | null };

export function useRecurring() {
  return pick(usePlanningData(), (d) => d.recurring as RecurringRow[]);
}
export function useLoans() {
  const q = useLoanData();
  return { ...q, data: q.data as LoanRow[] | undefined };
}
export function useSetSavingsGoal() {
  const fn = useServerFn(setSavingsGoal);
  return useDataMutation((data: { year: number; month: number; goal: number }) => fn({ data }), [expenseQueryKeys.finance]);
}
export function useAddRecurring() {
  const fn = useServerFn(addRecurring);
  return useDataMutation((data: { category: string; slot: SlotKey; amount: number; day: number; startDate: string }) => fn({ data }), [expenseQueryKeys.planning]);
}
export function useDeleteRecurring() {
  const fn = useServerFn(deleteRecurring);
  return useDataMutation((data: { id: string }) => fn({ data }), [expenseQueryKeys.planning]);
}
export function useApplyRecurring() {
  const fn = useServerFn(applyRecurring);
  return useDataMutation((data: { today: string }) => fn({ data }), [expenseQueryKeys.finance]);
}
export function useAddLoan() {
  const fn = useServerFn(addLoan);
  return useDataMutation((data: { person: string; amount: number; date: string; note?: string }) => fn({ data }), [expenseQueryKeys.loans]);
}
export function useRepayLoan() {
  const fn = useServerFn(repayLoan);
  return useDataMutation((data: { id: string; date: string; addAsIncome: boolean }) => fn({ data }), [expenseQueryKeys.loans, expenseQueryKeys.finance]);
}
export function useDeleteLoan() {
  const fn = useServerFn(deleteLoan);
  return useDataMutation((data: { id: string }) => fn({ data }), [expenseQueryKeys.loans]);
}
