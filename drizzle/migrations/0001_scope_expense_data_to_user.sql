-- 1. Owner column on every table (tables are empty, so a default is enough)
ALTER TABLE public.months ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();

ALTER TABLE public.months ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.expenses ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.budgets ALTER COLUMN user_id SET NOT NULL;

-- 2. Uniqueness is now per user
ALTER TABLE public.months DROP CONSTRAINT IF EXISTS months_year_month_key;
ALTER TABLE public.expenses DROP CONSTRAINT IF EXISTS expenses_entry_date_category_slot_key;
ALTER TABLE public.budgets DROP CONSTRAINT IF EXISTS budgets_category_key;

CREATE UNIQUE INDEX IF NOT EXISTS months_user_year_month_key
  ON public.months (user_id, year, month);
CREATE UNIQUE INDEX IF NOT EXISTS expenses_user_date_category_slot_key
  ON public.expenses (user_id, entry_date, category, slot);
CREATE UNIQUE INDEX IF NOT EXISTS budgets_user_category_key
  ON public.budgets (user_id, category);

-- 3. Remove the fully public policies
DROP POLICY IF EXISTS "months are publicly readable" ON public.months;
DROP POLICY IF EXISTS "months are publicly writable" ON public.months;
DROP POLICY IF EXISTS "months are publicly updatable" ON public.months;
DROP POLICY IF EXISTS "months are publicly deletable" ON public.months;
DROP POLICY IF EXISTS "expenses are publicly readable" ON public.expenses;
DROP POLICY IF EXISTS "expenses are publicly writable" ON public.expenses;
DROP POLICY IF EXISTS "expenses are publicly updatable" ON public.expenses;
DROP POLICY IF EXISTS "expenses are publicly deletable" ON public.expenses;
DROP POLICY IF EXISTS "budgets are publicly readable" ON public.budgets;
DROP POLICY IF EXISTS "budgets are publicly writable" ON public.budgets;
DROP POLICY IF EXISTS "budgets are publicly updatable" ON public.budgets;
DROP POLICY IF EXISTS "budgets are publicly deletable" ON public.budgets;

-- 4. Owner-only access for signed-in users
REVOKE ALL ON public.months FROM anon;
REVOKE ALL ON public.expenses FROM anon;
REVOKE ALL ON public.budgets FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.months TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expenses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.budgets TO authenticated;
GRANT ALL ON public.months TO service_role;
GRANT ALL ON public.expenses TO service_role;
GRANT ALL ON public.budgets TO service_role;

CREATE POLICY "Users read own months" ON public.months
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own months" ON public.months
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own months" ON public.months
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own months" ON public.months
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users read own expenses" ON public.expenses
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own expenses" ON public.expenses
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own expenses" ON public.expenses
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own expenses" ON public.expenses
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users read own budgets" ON public.budgets
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own budgets" ON public.budgets
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own budgets" ON public.budgets
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own budgets" ON public.budgets
  FOR DELETE TO authenticated USING (auth.uid() = user_id);