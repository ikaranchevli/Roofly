-- ============================================================
-- Roofly: Initial Database Schema
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- Tenants
-- ============================================================
CREATE TABLE IF NOT EXISTS tenants (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT        NOT NULL,
  move_in_date  DATE        NOT NULL,
  move_out_date DATE,                       -- NULL = currently living
  phone         TEXT,
  email         TEXT,
  property_id   UUID,                       -- Reserved for future multi-property support
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at on changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Tenant Documents
-- ============================================================
CREATE TABLE IF NOT EXISTS tenant_documents (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  file_path   TEXT        NOT NULL,   -- path within Supabase Storage bucket
  size        BIGINT,
  mime_type   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS tenant_documents_tenant_id_idx ON tenant_documents(tenant_id);

-- ============================================================
-- Row-Level Security (optional — enable when adding auth)
-- ============================================================
-- ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE tenant_documents ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Storage Bucket
-- ============================================================
-- Run this in Supabase dashboard OR via the management API:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('tenant-documents', 'tenant-documents', false);
