import { CheckCircle2, Clock3, HandCoins } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { RequireSession } from "@/components/auth/RequireSession";
import { LoansCard } from "@/components/expense/PlanningCards";
import { useLoans } from "@/lib/expense-data";
import { inr } from "@/lib/expense-config";
import { PageHeader } from "@/components/PageHeader";

export function MoneyOwedPage() {
  const { data: loans = [] } = useLoans();
  const pending = loans.filter((loan) => !loan.repaid_at);
  const paid = loans.filter((loan) => loan.repaid_at);
  const outstanding = pending.reduce((sum, loan) => sum + loan.amount, 0);
  const recovered = paid.reduce((sum, loan) => sum + loan.amount, 0);
  return <main className="mx-auto w-full max-w-5xl animate-fade-in px-3 py-5 sm:px-5 sm:py-8"><PageHeader title="Money owed" description="Keep split expenses separate until they are paid back." /><section className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3"><Summary label="Outstanding" value={inr(outstanding)} icon={<HandCoins className="size-4" />} tone="text-warning" /><Summary label="Waiting on" value={String(pending.length)} icon={<Clock3 className="size-4" />} /><Summary label="Recovered" value={inr(recovered)} icon={<CheckCircle2 className="size-4" />} tone="text-positive" wide /></section><LoansCard /></main>;
}
function Summary({ label, value, icon, tone = "", wide = false }: { label: string; value: string; icon: React.ReactNode; tone?: string; wide?: boolean }) { return <Card className={wide ? "col-span-2 sm:col-span-1" : ""}><CardContent className="p-4"><p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">{icon}{label}</p><p className={`mt-1 break-words text-xl font-bold ${tone}`}>{value}</p></CardContent></Card>; }
