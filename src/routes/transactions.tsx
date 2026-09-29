import { createFileRoute } from "@tanstack/react-router";
import { RequireSession } from "@/components/auth/RequireSession";
import { TransactionsPage } from "@/features/transactions/TransactionsPage";

export const Route = createFileRoute("/transactions")({
  head: () => ({ meta: [
    { title: "Transactions — LiWise" },
    { name: "description", content: "Record income and daily expenses, review weekly totals, and follow your running balance with LiWise." },
    { property: "og:title", content: "Transactions — LiWise" },
    { property: "og:description", content: "A clear transaction ledger with weekly totals and running balances." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: () => <RequireSession><TransactionsPage /></RequireSession>,
});
