<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Expense data (months, expenses, budgets) lives in Turso via server functions in src/lib/expense.functions.ts; sign-in stays on Lovable Cloud. Why: user asked to store data in their own Turso DB.
- The signed-in app uses a five-page sidebar: `/` overview, `/transactions`, `/analytics`, `/planning`, and `/money-owed`; `/dashboard` forwards home and `/sheet` forwards transactions. Why: focused workflows replace one overcrowded dashboard while preserving old links.
- Extra income lives in Turso table income_entries; month savings carry forward via monthMoney() in expense-metrics (computed client-side, per-month carry_forward flag). Why: keeps totals derived from source rows, no stored duplicates.
- Recurring rules (recurring_expenses), money owed (loans) and per-month savings_goal live in Turso; applyRecurring fills due days with ON CONFLICT DO NOTHING so it never overwrites user edits. Why: automation must stay safe to re-run.
- Feature pages live under `src/features/<feature>` and route files only declare URL metadata and mount the page; navigation is defined once in `src/config/app-navigation.ts`. Why: incremental features stay isolated while URLs and sidebar ordering remain stable.
