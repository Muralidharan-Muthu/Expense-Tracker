import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/sheet")({
  head: () => ({ meta: [
    { title: "Transactions — LiWise" },
    { name: "description", content: "Open your LiWise transaction ledger." },
    { property: "og:title", content: "Transactions — LiWise" },
    { property: "og:description", content: "Open your LiWise transaction ledger." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  beforeLoad: () => { throw redirect({ to: "/transactions", replace: true }); },
});
