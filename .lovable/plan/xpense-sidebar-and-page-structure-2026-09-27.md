# Xpense sidebar and page structure

## Recommendation: 5 main pages

### 1. Overview
The fast daily summary users should see first.
- Greeting and overspending alert
- Today’s expense, month spent, daily average, savings rate, top category
- Month and year selector
- Month highlights
- Quick actions: Add today and Add money

### 2. Transactions
The working expense sheet.
- Money received breakdown and carry-forward
- Monthly totals and safe-per-day figures
- Full Monday–Sunday weekly totals
- Searchable daily expense rows
- Add/edit daily expenses and extra income
- Month and year export

### 3. Analytics
All reporting and comparisons in one focused page.
- Spending by category chart
- Monthly received, spent, and balance chart
- Category changes compared with the previous month
- Year selector and reporting-period controls

### 4. Planning
Forward-looking money controls.
- Category budgets
- Monthly savings goal
- Recurring expenses
- Progress and over-budget states

### 5. Money owed
A dedicated place for split expenses.
- Outstanding total
- People and amounts owed
- Paid-back history
- Mark paid, optionally add repayment to received money
- Delete records with confirmation

## Sidebar behavior
- Desktop: collapsible left sidebar with icons and labels; collapsed mode keeps an icon rail visible.
- Phone: sidebar becomes a slide-out menu opened from the top bar.
- Active page is clearly highlighted.
- The bottom area contains theme, account name, and sign out.
- Signed-out users see only the Xpense logo and Sign in.

## Route changes
- Keep `/` as Overview.
- Add `/transactions`, `/analytics`, `/planning`, and `/money-owed`.
- Keep `/sheet` working by forwarding it to `/transactions`.
- Keep `/dashboard` forwarding to `/`.
- Keep onboarding and sign-in outside the main sidebar experience.

## Implementation approach
- Move each existing section rather than copying it, so calculations and actions have one source of truth.
- Extract the shared month/year selection so Overview, Transactions, Analytics, and Planning stay synchronized during a session.
- Reuse the existing cards, charts, dialogs, colors, dark mode, and data functions.
- Add unique page titles and descriptions for every new page.
- Verify signed-in and signed-out navigation, desktop collapse, phone drawer, all forms, charts, dialogs, and old links.

## Why five pages
Five destinations are enough to make the application easy to scan without creating tiny pages. Budgets, goals, and recurring expenses naturally belong together under Planning, while money owed deserves its own page because it has a separate repayment workflow.
