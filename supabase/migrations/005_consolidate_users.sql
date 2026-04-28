-- ============================================================
-- Roofly Migration: Consolidate Tenants into Users
-- ============================================================

-- 1. Rename profiles to users safely
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
    ALTER TABLE profiles RENAME TO users;
  END IF;
END $$;

-- 2. Add tenant-specific fields to users safely
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='first_name') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='full_name') THEN
      ALTER TABLE users RENAME COLUMN full_name TO first_name;
    ELSE
      ALTER TABLE users ADD COLUMN first_name TEXT;
    END IF;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='last_name') THEN
    ALTER TABLE users ADD COLUMN last_name TEXT;
  END IF;
  
  -- Split existing first_name into first and last name if it contains a space
  UPDATE users SET 
    last_name = substring(first_name from position(' ' in first_name) + 1),
    first_name = split_part(first_name, ' ', 1)
  WHERE position(' ' in first_name) > 0 AND last_name IS NULL;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='move_in_date') THEN
    ALTER TABLE users ADD COLUMN move_in_date DATE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='move_out_date') THEN
    ALTER TABLE users ADD COLUMN move_out_date DATE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='email') THEN
    ALTER TABLE users ADD COLUMN email TEXT;
  END IF;
END $$;

-- Drop the foreign key to auth.users to allow manual tenant creation
ALTER TABLE users DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_id_fkey;
ALTER TABLE users ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 3. Migrate existing data from tenants to users
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tenants') THEN
    INSERT INTO users (id, first_name, last_name, phone, email, household_id, role, status, created_at, move_in_date, move_out_date)
    SELECT 
      id, 
      split_part(name, ' ', 1), 
      substring(name from position(' ' in name) + 1),
      phone, 
      email,
      household_id, 
      'housemate' AS role, 
      'active' AS status, 
      created_at, 
      move_in_date, 
      move_out_date
    FROM tenants
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- 4. Update tenant_documents to user_documents safely
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tenant_documents') THEN
    ALTER TABLE tenant_documents RENAME TO user_documents;
    ALTER TABLE user_documents RENAME COLUMN tenant_id TO user_id;

    -- Drop old foreign key and add new one
    ALTER TABLE user_documents DROP CONSTRAINT IF EXISTS tenant_documents_tenant_id_fkey;
    ALTER TABLE user_documents ADD CONSTRAINT user_documents_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

    -- Rename indexes
    ALTER INDEX IF EXISTS tenant_documents_pkey RENAME TO user_documents_pkey;
    ALTER INDEX IF EXISTS tenant_documents_tenant_id_idx RENAME TO user_documents_user_id_idx;
  END IF;
END $$;

-- 5. Update bill_splits safely
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='bill_splits' AND column_name='tenant_id') THEN
    ALTER TABLE bill_splits RENAME COLUMN tenant_id TO user_id;
    ALTER TABLE bill_splits DROP CONSTRAINT IF EXISTS bill_splits_tenant_id_fkey;
    ALTER TABLE bill_splits ADD CONSTRAINT bill_splits_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    ALTER INDEX IF EXISTS bill_splits_tenant_id_idx RENAME TO bill_splits_user_id_idx;
  END IF;
END $$;

-- 6. Drop tenants table
DROP TABLE IF EXISTS tenants CASCADE;

-- 7. Update Policies & Security Functions
-- Create a security definer function to avoid RLS recursion
CREATE OR REPLACE FUNCTION get_my_household_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT household_id FROM users WHERE id = auth.uid();
$$;

DROP POLICY IF EXISTS "profiles_permissive_select" ON users;
DROP POLICY IF EXISTS "profiles_permissive_insert" ON users;
DROP POLICY IF EXISTS "profiles_strict_update" ON users;
DROP POLICY IF EXISTS "users_permissive_select" ON users;
DROP POLICY IF EXISTS "users_permissive_insert" ON users;
DROP POLICY IF EXISTS "users_strict_update" ON users;
DROP POLICY IF EXISTS "users_self_select" ON users;
DROP POLICY IF EXISTS "users_household_select" ON users;

-- Users can see themselves
CREATE POLICY "users_self_select" ON users FOR SELECT USING (id = auth.uid());

-- Users can see others in the same household using the helper function
CREATE POLICY "users_household_select" ON users FOR SELECT USING (
    household_id = get_my_household_id()
);

CREATE POLICY "users_permissive_insert" ON users FOR INSERT WITH CHECK (true);

-- Users can update their own row
CREATE POLICY "users_self_update" ON users FOR UPDATE USING (id = auth.uid());

-- Admins can update any user in their household
DROP POLICY IF EXISTS "users_admin_update" ON users;
CREATE POLICY "users_admin_update" ON users FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM users AS me
    WHERE me.id = auth.uid()
      AND me.household_id = users.household_id
      AND me.role = 'admin'
  )
);

DROP POLICY IF EXISTS "users_strict_update" ON users;

-- Recreate household isolation policies for other tables
DROP POLICY IF EXISTS "bills_household_isolation" ON bills;
CREATE POLICY "bills_household_isolation" ON bills FOR ALL USING (
    household_id = get_my_household_id()
);

-- 8. Email Sync Trigger
-- This ensures public.users.email is always in sync with auth.users.email
CREATE OR REPLACE FUNCTION sync_user_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.users
  SET email = NEW.email
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

-- Create the trigger on auth.users (triggers can cross schemas in Postgres)
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_email();

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_email();

-- 10. Profile Matching RPC
-- Allows anonymous users to search for matching profiles during the join flow
-- by providing a valid household ID.
CREATE OR REPLACE FUNCTION match_housemate_profile(
  p_household_id UUID,
  p_email TEXT,
  p_phone TEXT,
  p_first_name TEXT,
  p_last_name TEXT
)
RETURNS SETOF users
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM users
  WHERE household_id = p_household_id
  AND (
    (p_email IS NOT NULL AND email = p_email) OR
    (p_phone IS NOT NULL AND phone = p_phone) OR
    (p_first_name IS NOT NULL AND first_name ILIKE '%' || p_first_name || '%') OR
    (p_last_name IS NOT NULL AND last_name ILIKE '%' || p_last_name || '%')
  );
END;
$$;

-- 11. Merge Housemate Profile RPC
-- Atomically merges a shadow user (created by admin) into the newly authenticated user.
-- Reads shadow data first, re-assigns FKs, deletes shadow row, inserts merged row.
CREATE OR REPLACE FUNCTION merge_housemate_profile(
  p_shadow_id UUID,
  p_auth_id UUID,
  p_email TEXT,
  p_phone TEXT,
  p_first_name TEXT,
  p_last_name TEXT,
  p_avatar_url TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_household_id UUID;
  v_role TEXT;
  v_move_in_date DATE;
  v_move_out_date DATE;
  v_first_name TEXT;
  v_last_name TEXT;
  v_phone TEXT;
BEGIN
  -- Step 1: Read the shadow user data before we delete it
  SELECT household_id, role, move_in_date, move_out_date, first_name, last_name, phone
  INTO v_household_id, v_role, v_move_in_date, v_move_out_date, v_first_name, v_last_name, v_phone
  FROM users WHERE id = p_shadow_id;

  IF v_household_id IS NULL THEN
    RAISE EXCEPTION 'Shadow user % not found', p_shadow_id;
  END IF;

  -- Step 2: Re-assign all related data to the new auth ID
  UPDATE bill_splits SET user_id = p_auth_id WHERE user_id = p_shadow_id;
  UPDATE user_documents SET user_id = p_auth_id WHERE user_id = p_shadow_id;

  -- Step 3: Delete the shadow row
  DELETE FROM users WHERE id = p_shadow_id;

  -- Step 4: Insert the merged user row with the real auth ID, preserving admin-set data
  INSERT INTO users (
    id, first_name, last_name, email, phone, avatar_url,
    household_id, role, status, move_in_date, move_out_date
  ) VALUES (
    p_auth_id,
    COALESCE(NULLIF(p_first_name, ''), v_first_name),
    COALESCE(NULLIF(p_last_name, ''), v_last_name),
    p_email,
    COALESCE(NULLIF(p_phone, ''), v_phone),
    NULLIF(p_avatar_url, ''),
    v_household_id,
    COALESCE(v_role, 'housemate'),
    'active',
    v_move_in_date,
    v_move_out_date
  );
END;
$$;

-- 12. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
