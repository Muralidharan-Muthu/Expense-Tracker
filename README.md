# LiWise — Personal Expense & Wealth Tracking Workspace

![LiWise Banner](public/icons/icon-192.png)

[![React](https://img.shields.io/badge/React-19.2-61dafb?style=flat-square&logo=react)](https://react.dev/)
[![TanStack Start](https://img.shields.io/badge/TanStack-Start%20%26%20Router-ff4154?style=flat-square&logo=react-query)](https://tanstack.com/start)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Turso](https://img.shields.io/badge/Database-Turso%20(libSQL)-00e699?style=flat-square&logo=sqlite)](https://turso.tech/)
[![Supabase](https://img.shields.io/badge/Auth-Supabase-3ecf8e?style=flat-square&logo=supabase)](https://supabase.com/)

**LiWise** is a private, modern, full-stack personal finance and expense tracking workspace. Built with **TanStack Start**, **React 19**, **Tailwind CSS v4**, and backed by **Turso (libSQL)** with **Supabase Authentication**, LiWise gives you complete visibility and control over your daily spending, recurring expenses, category budgets, monthly savings, and split payments.

---

## ✨ Features

LiWise organizes your personal finance workflow into five focused workspaces:

### 1. 📊 Overview (`/`)
* **Real-time Financial Snapshot:** Instant view of total received income, month-to-date spending, current in-hand balance, and today's expenses.
* **Smart Spending Alerts & Safe Daily Pace:** Dynamically calculates your safe daily spending allowance for remaining days in the month and alerts you if spending pace exceeds safe limits.
* **Quick Entry:** One-click "Add today" modal to record expenses on the fly without navigating away.
* **Category Breakdown:** Real-time visibility into your top spending categories for the selected billing period.

### 2. 🧾 Daily Transactions & Spreadsheet (`/transactions`)
* **Interactive Day-by-Day Grid:** Log and review expenses day by day with automatic weekend and holiday highlighting (Sundays and 2nd/4th Saturdays).
* **Time-of-Day Slots:** Granular tracking with custom slots (Morning, Afternoon, Evening) for frequent expenses such as meals, coffee, and snacks.
* **Multi-Source Income & Savings Carry-Forward:** Record multiple income streams (salary, bonuses, freelance) and easily toggle previous-month savings carry-forward.
* **Instant Search & Filtering:** Filter transaction records by date or keyword notes.
* **Excel Export:** Export any month or year to formatted `.xlsx` workbooks for offline archiving or tax preparation.

### 3. 🎯 Financial Planning (`/planning`)
* **Monthly Savings Target:** Set per-month savings goals and monitor real-time savings rate progress.
* **Category Budgets:** Define strict monthly spending limits per category (Rent, Food, Travel, Investments, etc.) with color-coded progress indicators and over-budget warnings.
* **Automated Recurring Expenses:** Configure regular monthly commitments (subscriptions, rent, utilities) that automatically populate due dates safely (`ON CONFLICT DO NOTHING`) without overwriting manual changes.

### 4. 🤝 Money Owed & Debt Tracking (`/money-owed`)
* **Separation of Lent Funds:** Isolate split expenses, advances, or loans to friends and colleagues from your personal burn rate.
* **Pending vs. Recovered:** Track outstanding balances, recipient names, entry dates, and notes.
* **One-Click Settlement:** Mark debts as repaid with automatic timestamping.

### 5. 📈 Decision-Focused Analytics (`/analytics`)
* **Daily Pace & Cumulative Cash Flow:** Interactive charts comparing daily spending pace against cumulative income.
* **Weekday Distribution Analysis:** Pinpoint spending patterns across days of the week (Monday through Sunday) to uncover weekend vs. weekday spending habits.
* **Category Distribution & Yearly Trends:** Visual pie and bar charts illustrating expenditure proportion and month-over-month trends.

---

## 🛠️ Architecture & Tech Stack

```text
┌────────────────────────────────────────────────────────┐
│                   LiWise Frontend                      │
│   React 19 • TanStack Router • TanStack Query • Recharts│
│        Tailwind CSS v4 • Radix UI • Sonner Toasts       │
└───────────────┬────────────────────────┬───────────────┘
                │                        │
       (Client-Side Auth)       (Server Functions / RPC)
                │                        │
                ▼                        ▼
     ┌──────────────────────┐ ┌──────────────────────┐
     │  Supabase Auth /     │ │   TanStack Start     │
     │  Session Management  │ │   Server Functions   │
     └──────────────────────┘ └──────────┬───────────┘
                                         │
                                 (libSQL Client)
                                         │
                                         ▼
                              ┌──────────────────────┐
                              │     Turso DB         │
                              │ (Isolated SQLite DB) │
                              └──────────────────────┘
```

| Layer | Technology | Description |
|---|---|---|
| **Framework** | [TanStack Start](https://tanstack.com/start) | SSR-ready, full-stack React framework with type-safe server functions. |
| **Routing** | [TanStack Router](https://tanstack.com/router) | Type-safe, file-based routing with layout support. |
| **State & Cache** | [TanStack React Query](https://tanstack.com/query) | Asynchronous server-state management and real-time cache invalidation. |
| **UI & Styling** | [Tailwind CSS v4](https://tailwindcss.com/) + [Radix UI](https://www.radix-ui.com/) | Modern UI primitives, accessible components, and light/dark theme support. |
| **Visualizations** | [Recharts](https://recharts.org/) | Responsive SVG charts for financial cash flow and trends. |
| **Database** | [Turso (libSQL)](https://turso.tech/) | Distributed SQLite database storing user financial records with isolated schemas. |
| **Authentication** | [Supabase](https://supabase.com/) | Secure user authentication (Email and OAuth). |
| **Spreadsheet** | [SheetJS (xlsx)](https://sheetjs.com/) | In-browser Excel workbook generation. |

---

## 🗄️ Database Schema Overview

LiWise isolates all financial records per user via `user_id`. Key tables managed in Turso:

* `users`: Stores user profile data (`user_id`, `email`, `full_name`, `age`, `profession`, `last_sign_in_at`).
* `months`: Monthly financial state (`year`, `month`, `total_received`, `carry_forward`, `savings_goal`, `notes`).
* `expenses`: Daily expenditure entries (`entry_date`, `category`, `slot`, `amount`).
* `budgets`: Category spending limits (`category`, `monthly_limit`).
* `income_entries`: Granular income transactions (`entry_date`, `amount`, `note`).
* `recurring_expenses`: Automation rules (`category`, `slot`, `amount`, `day_of_month`, `start_date`).
* `loans`: Split money and debts (`person`, `amount`, `entry_date`, `note`, `repaid_at`).

---

## 🚀 Getting Started

### Prerequisites

* [Node.js](https://nodejs.org/) (v20+ recommended)
* `npm` or `pnpm`
* A [Turso](https://turso.tech/) database
* A [Supabase](https://supabase.com/) project for authentication

### 1. Clone the repository

```bash
git clone https://github.com/Muralidharan-Muthu/Expense-Tracker.git
cd Expense-Tracker
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
# Supabase Authentication
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your-supabase-publishable-key"
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_PUBLISHABLE_KEY="your-supabase-publishable-key"

# Turso Database (Server-side)
TURSO_DATABASE_URL="libsql://your-db-name.turso.io"
TURSO_AUTH_TOKEN="your-turso-auth-token"
```

### 4. Run the development server

```bash
npm run dev
```

Visit `http://localhost:3000` (or the port specified by Vite) in your browser.

---

## 📁 Project Structure

```text
├── public/                 # Static assets, web app manifest, icons
├── src/
│   ├── assets/             # Logos and graphic assets
│   ├── components/         # Reusable UI components
│   │   ├── auth/           # Route guards and session components
│   │   ├── expense/        # Expense dialogs, period selectors, planning cards
│   │   └── ui/             # Radix UI and Shadcn component primitives
│   ├── config/             # Navigation and application settings
│   ├── features/           # Modular feature pages
│   │   ├── analytics/      # Deep decision metrics and cash flow charts
│   │   ├── money-owed/     # Loans and split expense tracking
│   │   ├── overview/       # Main financial dashboard
│   │   ├── planning/       # Savings goals, budgets, recurring expenses
│   │   └── transactions/   # Daily expense spreadsheet & income logging
│   ├── hooks/              # Custom React hooks (useTheme, useReportingPeriod, etc.)
│   ├── integrations/       # Supabase and external API clients
│   ├── lib/                # Database clients, metrics calculations, Excel export
│   │   ├── expense-config.ts      # Expense categories, slots, and holiday logic
│   │   ├── expense-data.ts        # TanStack Query hooks for reading/writing data
│   │   ├── expense-metrics.ts     # Cash-flow calculations, pace metrics, savings
│   │   ├── expense.functions.ts   # TanStack Start server functions
│   │   ├── export-excel.ts        # Excel export generation
│   │   └── turso.server.ts        # Turso client initialization & schema migration
│   ├── routes/             # TanStack Router route definitions
│   │   ├── __root.tsx      # Root application shell and sidebar provider
│   │   ├── index.tsx       # Overview route
│   │   ├── transactions.tsx# Transactions route
│   │   ├── planning.tsx    # Planning route
│   │   ├── money-owed.tsx  # Money owed route
│   │   ├── analytics.tsx   # Analytics route
│   │   ├── auth.tsx        # Authentication route
│   │   └── onboarding.tsx  # First-time user profile setup
│   ├── styles.css          # Tailwind CSS styles and theme tokens
│   └── start.ts            # TanStack Start client/server entry point
├── package.json            # Project dependencies and scripts
├── tsconfig.json           # TypeScript configuration
└── vite.config.ts          # Vite configuration
```

---

## 📜 Available Scripts

* `npm run dev`: Starts the local development server.
* `npm run build`: Generates an optimized production build.
* `npm run preview`: Locally previews the production build.
* `npm run lint`: Runs ESLint to check for code quality issues.
* `npm run format`: Formats code files using Prettier.

---

## 🔒 Privacy & Security

* **Isolated User Data:** All expense records, budgets, and loans are keyed strictly by authenticated `user_id`.
* **Zero Shared State:** Database schema ensures users can only read and write their own rows.
* **Server-Side Authorization:** All data mutations run through validated server functions with Supabase token verification before touching Turso.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
