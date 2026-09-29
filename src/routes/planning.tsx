import { createFileRoute } from "@tanstack/react-router";
import { RequireSession } from "@/components/auth/RequireSession";
import { PlanningPage } from "@/features/planning/PlanningPage";

export const Route = createFileRoute("/planning")({
  head: () => ({ meta: [
    { title: "Planning — LiWise" }, { name: "description", content: "Set category budgets, savings goals and recurring expenses in LiWise." },
    { property: "og:title", content: "Planning — LiWise" }, { property: "og:description", content: "Plan budgets, savings and recurring expenses." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: () => <RequireSession><PlanningPage /></RequireSession>,
});
