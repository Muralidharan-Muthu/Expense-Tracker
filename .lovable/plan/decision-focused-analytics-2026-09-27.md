# Decision-focused Analytics

## Goal
Turn Analytics into a clearer money decision workspace using the data LiWise already stores. Keep the existing month/year selector and make every chart readable on phone and desktop.

## What will change
- Add a compact decision summary for the selected month: savings rate, average daily spend, projected month-end balance, and the biggest spending driver.
- Add a **daily spending and safe-limit** chart to show which days exceeded a sustainable pace.
- Add a **cumulative cash-flow** chart showing money received, spending, and remaining balance across the month.
- Add a **day-of-week pattern** chart covering Monday through Sunday, with average spend and transaction-day context.
- Improve the existing category view into a ranked comparison with share of total and month-over-month movement.
- Keep the yearly money-flow chart, but make its labels, empty states, tooltips, and mobile layout easier to scan.
- Add short, data-derived observations that explain the most useful signals without giving financial advice.

## Behavior and edge cases
- Current and completed months use only actual recorded data; future days are clearly treated as projections.
- Empty months show useful empty states instead of misleading zero-value charts.
- Added income and carried balance remain distinct so yearly income is not double-counted.
- Calculations use the existing per-user finance data and do not change storage or account behavior.
- Charts resize without hiding values, overlapping labels, or requiring horizontal page scrolling.

## Technical details
- Extend `src/features/analytics/AnalyticsPage.tsx` with derived metrics built from existing month rows, expense rows, income entries, and category definitions.
- Reuse Recharts and the app’s semantic colors/components; no new package or database work.
- Extract small local chart/insight helpers where this keeps the page maintainable.
- Verify the page in light and dark themes at desktop and phone sizes, including an empty-data state when practical.
