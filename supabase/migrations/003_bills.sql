-- ============================================================
-- Roofly: Bills and Settings Schema
-- ============================================================

-- ============================================================
-- Bill Categories
-- ============================================================
CREATE TABLE IF NOT EXISTS bill_categories (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  icon        TEXT,       -- optional icon name (lucide-react)
  color       TEXT,       -- optional color class or hex
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default categories
INSERT INTO bill_categories (name, icon, color) VALUES 
  ('Electricity', 'Zap', 'bg-amber-500'),
  ('Water', 'Droplet', 'bg-blue-500'),
  ('Internet', 'Wifi', 'bg-purple-500'),
  ('Gas', 'Flame', 'bg-orange-500')
ON CONFLICT DO NOTHING;

-- ============================================================
-- Bills
-- ============================================================
CREATE TABLE IF NOT EXISTS bills (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id   UUID        NOT NULL REFERENCES bill_categories(id) ON DELETE CASCADE,
  amount        DECIMAL     NOT NULL,
  start_date    DATE        NOT NULL,
  end_date      DATE        NOT NULL,
  document_path TEXT,       -- path within Supabase Storage bucket (optional)
  notes         TEXT,       -- optional notes for the bill
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure the function exists before creating the trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-update updated_at on changes
CREATE TRIGGER bills_updated_at
  BEFORE UPDATE ON bills
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Bill Splits
-- ============================================================
CREATE TABLE IF NOT EXISTS bill_splits (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id     UUID        NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  tenant_id   UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  amount      DECIMAL     NOT NULL,
  days_stayed INT         NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS bill_splits_bill_id_idx ON bill_splits(bill_id);
CREATE INDEX IF NOT EXISTS bill_splits_tenant_id_idx ON bill_splits(tenant_id);

-- ============================================================
-- RLS Policies
-- ============================================================
ALTER TABLE bill_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_splits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to bill_categories" ON bill_categories FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to bill_categories" ON bill_categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to bill_categories" ON bill_categories FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete access to bill_categories" ON bill_categories FOR DELETE USING (true);

CREATE POLICY "Allow public read access to bills" ON bills FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to bills" ON bills FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to bills" ON bills FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete access to bills" ON bills FOR DELETE USING (true);

CREATE POLICY "Allow public read access to bill_splits" ON bill_splits FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to bill_splits" ON bill_splits FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to bill_splits" ON bill_splits FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete access to bill_splits" ON bill_splits FOR DELETE USING (true);
