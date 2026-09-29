# Daily Expense Tracker (18 Sep 2026 – 31 Dec 2026)

A colourful, easy-to-use app that replaces your Excel sheet: you enter the money you receive at the start of each month, log spending day by day under your categories, and the app keeps a running balance. All data is saved permanently in the app's own cloud database, no login needed. Amounts in ₹.

## Pages

### 1. Month view (home)
- Month switcher: September, October, November, December 2026.
- Top card for the month: **Total amount received** (you type it), total spent, money given to home, invested, and **In-hand balance**.
- One row per day for the full month (Sep starts at the 18th, as you asked).
- Saturdays and Sundays are marked **Holiday** with a distinct colour band.
- Each day shows amount spent and the running balance after that day.
- Click a day to open the entry panel.

### 2. Day entry panel
Inputs for every category, with morning/evening split where it applies:
- Rent
- Food – morning, evening
- Other (tea etc.) – morning, evening
- Minoxidil
- Travelling
- Given to home (monthly)
- Investment in stocks

Day total and the balance left after the day update live as you type.

### 3. Dashboard / reports
- Today's expense card.
- This month vs. previous months comparison.
- Category-wise breakdown chart (where your money goes).
- Weekday vs. holiday spend split.
- Highest spending day, daily average, days remaining in month.
- Month-end summary strip: Total received, total spent, in-hand balance.

### Extra helpful features
- Copy yesterday's entries to today (one tap for routine food/travel amounts).
- Optional monthly budget per category with a colour bar when you go over.
- Search/filter days by category or amount.
- Export the month (or the whole period) to an Excel file you can download.

## Design
Warm, professional finance look: deep teal + amber accents, clear number typography, soft cards, green/red for credit/spend, muted stripe for holidays. Works well on phone and desktop.

## Technical notes
- Lovable Cloud (Postgres) enabled for permanent storage.
- Tables: `months` (year, month, total_received, notes), `expenses` (date, category, slot [morning/evening/none], amount), `budgets` (category, monthly_limit). Public read/write policies since there is no login.
- Date range and weekend flags generated from the calendar, 18 Sep–31 Dec 2026; the app stays usable beyond that.
- Balance logic: month opening = total received; running balance = opening − cumulative spend (including given-to-home and investment) up to and including that day.
- Excel export built client-side from the stored rows.
