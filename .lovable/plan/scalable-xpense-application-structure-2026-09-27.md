# Scalable Xpense application structure

## Goal
Arrange Xpense so new features can be added gradually without overcrowding pages, duplicating calculations, slowing every screen, or breaking existing links.

## Page order and navigation
Use the sidebar in the order a user naturally manages money:

1. **Overview** — current month status, alerts, highlights, and quick actions
2. **Transactions** — income, daily expenses, weekly totals, search, and exports
3. **Planning** — budgets, savings goals, and recurring expenses
4. **Analytics** — category and month/year comparisons
5. **Money owed** — split expenses and repayments

Organize the sidebar into clear groups instead of one growing list:

```text
Workspace
  Overview
  Transactions

Manage
  Planning
  Money owed

Insights
  Analytics
```

Keep `/`, `/transactions`, `/planning`, `/analytics`, and `/money-owed` unchanged. Keep `/dashboard` and `/sheet` as compatibility redirects so old bookmarks continue to work. Future pages will be added to the relevant group instead of appended randomly.

## Implementation

### 1. Establish a single application map
- Move page names, URLs, icons, sidebar group, and active-state rules into one typed navigation configuration.
- Render desktop and mobile navigation from that same configuration.
- Add a shared page-header pattern for title, reporting period, and page actions so new pages align consistently.
- Keep sign-in and first-time setup outside the signed-in workspace navigation.

### 2. Make route files thin and feature-owned
- Create feature folders for `overview`, `transactions`, `planning`, `analytics`, and `money-owed`.
- Move page-specific sections, calculations, and forms into their feature folder; route files will contain only metadata and the page entry component.
- Keep truly shared money/date formatting, reporting-period selection, dialogs, and account controls in shared modules.
- Split the large transaction screen and planning collection into focused sections without changing the visible workflows.

### 3. Separate data by page responsibility
- Replace the single “load every row for every page” request with focused reads:
  - current month data for Overview and Transactions;
  - selected year summaries for Analytics;
  - budgets, savings goals, and recurring rules for Planning;
  - loan records for Money owed.
- Introduce consistent query keys by account, feature, year, and month.
- After a change, refresh only affected data instead of refreshing the entire application.
- Keep all user isolation and server-side identity checks unchanged.
- Preserve the existing carry-forward, full Monday–Sunday week ownership, recurring-expense safety, and derived-balance rules as shared domain logic.

### 4. Prepare the backend for incremental growth
- Split the current large server-function module by domain: profile, transactions/income, planning, analytics, and loans.
- Split database access into matching repositories while keeping schema setup and account scoping centralized.
- Use shared validation for money, dates, categories, slots, years, and months so every future feature follows the same limits.
- Keep all existing Turso tables and data; this is an organization and query-efficiency change, not a destructive migration.

### 5. Add scalable page states
- Give each page its own loading, empty, error, and retry state rather than blocking the whole workspace.
- Keep important actions close to their relevant page: expense/income entry in Transactions, budgets in Planning, repayments in Money owed.
- Maintain the current responsive sidebar, phone drawer, dark mode, dialogs, accessibility labels, and no-hidden-data requirement.

## Delivery order
1. Navigation map, grouped sidebar, and shared page headers.
2. Feature folders and thin route files with no behavior change.
3. Focused page queries and targeted refreshes.
4. Domain-based server/data modules.
5. Desktop and phone regression checks for every page, dialog, redirect, Google sign-in, onboarding, and account isolation.

## Verification
- Confirm every current route and compatibility redirect still works.
- Confirm the selected month/year stays synchronized where appropriate.
- Test expense, income, budget, savings, recurring, and repayment actions.
- Confirm one user cannot read or change another user's data.
- Check loading/empty/error states and layouts on desktop and phone.
- Confirm unique metadata remains on every content page and the preview has no build, runtime, console, or overflow errors.
