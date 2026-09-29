import { createFileRoute } from "@tanstack/react-router";
import { RequireSession } from "@/components/auth/RequireSession";
import { MoneyOwedPage } from "@/features/money-owed/MoneyOwedPage";

export const Route = createFileRoute("/money-owed")({
  head: () => ({ meta: [
    { title: "Money owed — LiWise" }, { name: "description", content: "Track split expenses and repayments in LiWise." },
    { property: "og:title", content: "Money owed — LiWise" }, { property: "og:description", content: "Track who owes you and record repayments." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: () => <RequireSession><MoneyOwedPage /></RequireSession>,
});
