import { createFileRoute } from "@tanstack/react-router";
import { RequireSession } from "@/components/auth/RequireSession";
import { OverviewPage } from "@/features/overview/OverviewPage";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Overview — LiWise" }, { name: "description", content: "See today's spending, monthly balance, savings rate and important alerts in LiWise." },
    { property: "og:title", content: "Overview — LiWise" }, { property: "og:description", content: "A clear overview of your money and spending." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: () => <RequireSession><OverviewPage /></RequireSession>,
});
