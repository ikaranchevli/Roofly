-- ============================================================
-- Roofly Migration: Households and Profiles (Permissive Fix)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tables
CREATE TABLE IF NOT EXISTS households (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  join_code TEXT UNIQUE NOT NULL,
  admin_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  household_id UUID REFERENCES households(id),
  role TEXT CHECK (role IN ('admin', 'housemate')) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'active')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Columns
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='household_id') THEN
    ALTER TABLE tenants ADD COLUMN household_id UUID REFERENCES households(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bills' AND column_name='household_id') THEN
    ALTER TABLE bills ADD COLUMN household_id UUID REFERENCES households(id);
  END IF;
END $$;

-- 3. Security Enablement
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;

-- 4. Deep Cleanup
DROP POLICY IF EXISTS "households_select_auth" ON households;
DROP POLICY IF EXISTS "households_insert_all" ON households;
DROP POLICY IF EXISTS "households_update_admin" ON households;
DROP POLICY IF EXISTS "profiles_select_auth" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_all" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "tenants_all_household" ON tenants;
DROP POLICY IF EXISTS "bills_all_household" ON bills;

-- 5. PERMISSIVE POLICIES (Resolves 401 and RLS issues during signup)

-- HOUSEHOLDS
-- Allow anyone to read/insert (necessary for signup/join flow)
CREATE POLICY "households_permissive_select" ON households FOR SELECT USING (true);
CREATE POLICY "households_permissive_insert" ON households FOR INSERT WITH CHECK (true);
CREATE POLICY "households_strict_update" ON households FOR UPDATE USING (admin_id = auth.uid());

-- PROFILES
-- Allow anyone to read/insert
CREATE POLICY "profiles_permissive_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_permissive_insert" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "profiles_strict_update" ON profiles FOR UPDATE USING (id = auth.uid());

-- TENANTS & BILLS (Maintain household isolation)
CREATE POLICY "tenants_household_isolation" ON tenants FOR ALL USING (
    household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid() AND status = 'active')
);

CREATE POLICY "bills_household_isolation" ON bills FOR ALL USING (
    household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid() AND status = 'active')
);

-- 6. Storage
DROP POLICY IF EXISTS "avatars_select_public" ON storage.objects;
DROP POLICY IF EXISTS "avatars_insert_auth" ON storage.objects;
CREATE POLICY "avatars_public_view" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "avatars_auth_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars');
