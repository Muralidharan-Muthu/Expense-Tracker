# Xpense redesign and reporting upgrade

## Goal
Rebrand the app as **Xpense**, make the dashboard the first screen, improve the sheet and entry flow, and add compact weekly and monthly insights that work cleanly across phones, tablets, and desktops.

## What will change

### 1. Xpense identity
- Replace the current ₹ tile and “Expense Tracker” name with an **Xpense** wordmark and compact X-shaped money/ledger mark.
- Use the same mark for the browser favicon, removing the old default favicon.
- Update page titles, descriptions, and sharing metadata to use Xpense.
- Keep the existing teal-and-amber foundation, refined into a cleaner professional finance interface.

### 2. Dashboard becomes the home screen
- Move the dashboard experience to `/`, so signed-in users see it first.
- Move the monthly sheet to `/sheet` and update navigation, brand link, sign-in redirects, and not-found links accordingly.
- Preserve `/dashboard` as a redirect to `/` so old bookmarks continue working.

### 3. Sheet summary and weekly totals
- Put the four compact monthly figures directly beneath the sheet title:
  - Total received
  - Total spent
  - In-hand balance at month end
  - Safe to spend per day
- Remove the duplicated totals section at the bottom.
- Remove only the “Given to home / invested” summary card; those two categories remain available in day entry and calculations.
- Add one compact **Budget health** insight showing whether current spending is on track for the selected month.
- Add a compact weekly strip for each calendar week, totaling **Monday through Friday only**. Partial first and last weeks will include only weekdays that fall inside the selected month.
- Keep monthly amount entry, search, exports, and Add today easy to reach without crowding the page.

### 4. Day entry improvements
- Add **Others** as a separate general expense field for unrepaid loans, donations, and similar spending.
- Keep the existing “Other (tea etc.)” morning/evening category unchanged so historical data stays correctly categorized.
- Save the new category through the existing private Turso storage flow and include it in summaries, charts, search, and Excel exports.
- Hide the visible dialog scrollbar while preserving touch, wheel, trackpad, and keyboard scrolling.
- Tighten spacing and arrange fields responsively so the dialog remains comfortable on short phone screens.

### 5. Modern dashboard charts
- Add a compact year dropdown to the monthly comparison chart. Its options will come from years present in stored data plus the current year.
- Upgrade the category chart to a modern donut with a clear total and percentage-aware tooltip.
- Upgrade monthly comparison to a more legible received-versus-spent chart with a balance trend and polished tooltip/legend behavior.
- Add useful supporting detail such as monthly savings rate, highest-spend category/day, and weekday-versus-weekend spending without introducing oversized cards.
- Ensure charts provide an empty state and remain readable on narrow screens.

### 6. Responsive polish
- Rework header, navigation, month picker, compact figures, action controls, weekly totals, day rows, dialogs, and charts for phone, tablet, laptop, and wide desktop widths.
- Prevent label, amount, badge, and button overlap; use compact mobile navigation and stable chart heights.
- Keep tap targets accessible and all existing actions functional.

## Technical details
- Reuse the existing category-string data model; adding `others` does not require a Turso schema change.
- Introduce shared calculation helpers for monthly totals, Monday–Friday week groups, year options, and dashboard metrics to avoid inconsistent totals between pages.
- Use semantic design tokens for all new colors and chart roles; remove hardcoded chart and category colors from page code where touched.
- Use the existing design-system buttons and inputs for all interactions.
- Keep authentication and per-user Turso data isolation unchanged.
- Update Excel export columns so the new Others category is included automatically.

## Validation
- Confirm existing saved entries still load and the new Others value saves and reloads.
- Verify Monday–Friday totals across months that begin/end midweek and across year boundaries.
- Verify `/` opens the dashboard, `/sheet` opens the sheet, and `/dashboard` redirects safely.
- Check the day dialog scrolls without a visible scrollbar.
- Test the year selector and chart calculations with multiple years and empty years.
- Check phone, tablet, and desktop layouts for clipping, overlap, horizontal overflow, and usable controls.
- Confirm metadata, favicon, build status, runtime console, and signed-in navigation are clean.

## Assumptions
- “Remove Given to home / invested” means removing that combined summary card only, not deleting either data-entry category or historical data.
- Weekly totals exclude Saturday and Sunday exactly as requested.
- The added helper card will be Budget health, presented at the same compact scale as the four requested figures.
