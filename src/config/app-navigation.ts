import { BarChart3, HandCoins, LayoutDashboard, Repeat2, TableProperties, type LucideIcon } from "lucide-react";

export type AppPath = "/" | "/transactions" | "/planning" | "/money-owed" | "/analytics";
export type NavigationItem = { title: string; to: AppPath; icon: LucideIcon; description: string };
export type NavigationGroup = { label: string; items: NavigationItem[] };

export const APP_NAVIGATION: NavigationGroup[] = [
  { label: "Workspace", items: [
    { title: "Overview", to: "/", icon: LayoutDashboard, description: "Current money status and alerts" },
    { title: "Transactions", to: "/transactions", icon: TableProperties, description: "Income and daily expenses" },
  ] },
  { label: "Manage", items: [
    { title: "Planning", to: "/planning", icon: Repeat2, description: "Budgets, goals, and recurring expenses" },
    { title: "Money owed", to: "/money-owed", icon: HandCoins, description: "Split expenses and repayments" },
  ] },
  { label: "Insights", items: [
    { title: "Analytics", to: "/analytics", icon: BarChart3, description: "Spending trends and comparisons" },
  ] },
];

export const APP_PAGES = APP_NAVIGATION.flatMap((group) => group.items);
