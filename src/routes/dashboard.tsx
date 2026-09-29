import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — LiWise" },
      { name: "description", content: "Open your LiWise financial dashboard." },
      { property: "og:title", content: "Dashboard — LiWise" },
      { property: "og:description", content: "Open your LiWise financial dashboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/", replace: true });
  },
});
