import { createFileRoute } from "@tanstack/react-router";
import { RequireSession } from "@/components/auth/RequireSession";
import { AnalyticsPage } from "@/features/analytics/AnalyticsPage";

export const Route = createFileRoute("/analytics")({
  head: () => ({ meta: [
    { title: "Analytics — LiWise" }, { name: "description", content: "Explore spending categories, monthly trends and comparisons in LiWise." },
    { property: "og:title", content: "Analytics — LiWise" }, { property: "og:description", content: "Understand your spending patterns and monthly trends." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: () => <RequireSession><AnalyticsPage /></RequireSession>,
});
