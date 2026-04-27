-- ============================================================
-- Roofly: Development RLS Policies
-- Run this in the Supabase SQL Editor to allow anonymous access
-- during development (before authentication is implemented).
-- ============================================================

-- 1. Enable RLS on tables (if not already enabled)
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_documents ENABLE ROW LEVEL SECURITY;

-- 2. Create public access policies for tenants
CREATE POLICY "Allow public read access to tenants" 
ON tenants FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to tenants" 
ON tenants FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access to tenants" 
ON tenants FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow public delete access to tenants" 
ON tenants FOR DELETE USING (true);

-- 3. Create public access policies for tenant_documents
CREATE POLICY "Allow public read access to tenant_documents" 
ON tenant_documents FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to tenant_documents" 
ON tenant_documents FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access to tenant_documents" 
ON tenant_documents FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow public delete access to tenant_documents" 
ON tenant_documents FOR DELETE USING (true);

-- 4. Create public access policies for the Storage Bucket
-- Allow anyone to upload, read, update, and delete documents in the 'tenant-documents' bucket
CREATE POLICY "Allow public uploads to tenant-documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'tenant-documents');

CREATE POLICY "Allow public read access to tenant-documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'tenant-documents');

CREATE POLICY "Allow public update access to tenant-documents"
ON storage.objects FOR UPDATE
USING (bucket_id = 'tenant-documents')
WITH CHECK (bucket_id = 'tenant-documents');

CREATE POLICY "Allow public delete access to tenant-documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'tenant-documents');
