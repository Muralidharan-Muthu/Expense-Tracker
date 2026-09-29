CREATE TABLE public.months (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year int NOT NULL,
  month int NOT NULL,
  total_received numeric NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (year, month)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.months TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.months TO authenticated;
GRANT ALL ON public.months TO service_role;
ALTER TABLE public.months ENABLE ROW LEVEL SECURITY;
CREATE POLICY "months are publicly readable" ON public.months FOR SELECT USING (true);
CREATE POLICY "months are publicly writable" ON public.months FOR INSERT WITH CHECK (true);
CREATE POLICY "months are publicly updatable" ON public.months FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "months are publicly deletable" ON public.months FOR DELETE USING (true);

CREATE TABLE public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_date date NOT NULL,
  category text NOT NULL,
  slot text NOT NULL DEFAULT 'none',
  amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (entry_date, category, slot)
);

CREATE INDEX expenses_entry_date_idx ON public.expenses (entry_date);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.expenses TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expenses TO authenticated;
GRANT ALL ON public.expenses TO service_role;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "expenses are publicly readable" ON public.expenses FOR SELECT USING (true);
CREATE POLICY "expenses are publicly writable" ON public.expenses FOR INSERT WITH CHECK (true);
CREATE POLICY "expenses are publicly updatable" ON public.expenses FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "expenses are publicly deletable" ON public.expenses FOR DELETE USING (true);

CREATE TABLE public.budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL UNIQUE,
  monthly_limit numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.budgets TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.budgets TO authenticated;
GRANT ALL ON public.budgets TO service_role;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "budgets are publicly readable" ON public.budgets FOR SELECT USING (true);
CREATE POLICY "budgets are publicly writable" ON public.budgets FOR INSERT WITH CHECK (true);
CREATE POLICY "budgets are publicly updatable" ON public.budgets FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "budgets are publicly deletable" ON public.budgets FOR DELETE USING (true);

INSERT INTO public.months (year, month, total_received) VALUES
  (2026, 9, 15000),
  (2026, 10, 15000),
  (2026, 11, 15000),
  (2026, 12, 15000);
