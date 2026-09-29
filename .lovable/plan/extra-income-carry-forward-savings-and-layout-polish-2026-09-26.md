# Extra income, carry-forward savings, and layout polish

## 1. Add money on any day
- New "Add money" button on the Sheet (and inside each day's entry window) to record extra income on a specific date, with an optional note (e.g. "Bonus", "Friend returned").
- Each day row shows a green "+₹3,456" badge when money came in that day.
- Running balance jumps up from that day onwards, so every later day shows the correct balance.
- Extra income entries can be edited or deleted from a small list.
- Spending limit check now uses the full money available (start amount + carry-forward + extra income).

## 2. Carry forward savings to next month
- Whatever is left at the end of a month is automatically added to the next month as "Carried from last month" (only positive leftover; no negative carry).
- A toggle lets you turn carry-forward off per month if you want a clean start.

## 3. Money received breakdown card (top of Sheet)
Replaces the single "Amount received" box with a clear card:

```text
Carried from August        ₹1,200
Received at month start    ₹15,000   [editable]
Added during the month     ₹3,456    (2 entries)
-----------------------------------
Total available            ₹19,656
```
The Total received metric, safe-per-day, balances and dashboard charts all use this total.

## 4. Responsive layout and spacing
- Day rows: stack date / entries / amounts on phones so nothing is cut off; labels for "Spent" and "Balance" always visible.
- Consistent card spacing (same gaps and padding across Sheet, Dashboard, dialogs); metric cards wrap into 2 columns on phone, 3 on tablet, 5 on desktop.
- Numbers never truncated; long category names wrap.
- Checked at phone, tablet and desktop widths.

## 5. Small helpful extras
- Spent / Balance column labels with a mini progress bar per day.
- "Jump to today" button on the Sheet.
- Month-end summary line: "You saved ₹X this month — carried to next month".
- Dashboard: extra income total for the year and savings carried over.

## Technical details
- New Turso table `income_entries (id, user_id, entry_date, amount, note, created_at)` with index on (user_id, entry_date); created in `ensureSchema`.
- Add `carry_forward INTEGER DEFAULT 1` to `months` via guarded ALTER.
- Server fns: `addIncome`, `deleteIncome`; `getAllData` returns income rows. All filtered by the signed-in user id.
- Carry-forward computed client-side from previous month's (start + carry + extras − spent), chained month to month; `buildMonthMetrics` takes a per-day income map.
- Validation: start amount can't drop below spent minus other income; deleting income blocked if it would make balance negative.
