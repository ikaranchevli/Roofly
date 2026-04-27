import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { DOCUMENTS_BUCKET, isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { Tenant, TenantDocument, TenantFormValues } from '@/types/tenant';

// ============================================================
// Query Keys
// ============================================================
export const tenantKeys = {
  all: ['tenants'] as const,
  lists: () => [...tenantKeys.all, 'list'] as const,
  detail: (id: string) => [...tenantKeys.all, 'detail', id] as const,
};

// ============================================================
// Helpers
// ============================================================

/** Generate a signed URL for a document stored in Supabase Storage */
async function getSignedUrl(filePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl(filePath, 60 * 60); // 1 hour expiry
  if (error) throw error;
  return data.signedUrl;
}

/** Enrich documents with signed URLs */
async function enrichDocuments(docs: TenantDocument[]): Promise<TenantDocument[]> {
  return Promise.all(
    docs.map(async (doc) => ({
      ...doc,
      url: await getSignedUrl(doc.file_path).catch(() => undefined),
    })),
  );
}

// ============================================================
// useTenants — fetch list
// ============================================================
export function useTenants() {
  return useQuery<Tenant[]>({
    queryKey: tenantKeys.lists(),
    enabled: isSupabaseConfigured,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenants')
        .select('*, documents:tenant_documents(*)')
        .order('move_in_date', { ascending: false });

      if (error) throw error;
      return data as Tenant[];
    },
  });
}

// ============================================================
// useTenant — fetch single
// ============================================================
export function useTenant(id: string) {
  return useQuery<Tenant>({
    queryKey: tenantKeys.detail(id),
    enabled: !!id && isSupabaseConfigured,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenants')
        .select('*, documents:tenant_documents(*)')
        .eq('id', id)
        .single();

      if (error) throw error;

      const tenant = data as Tenant;
      if (tenant.documents?.length) {
        tenant.documents = await enrichDocuments(tenant.documents);
      }
      return tenant;
    },
  });
}

// ============================================================
// useCreateTenant
// ============================================================
export function useCreateTenant() {
  const queryClient = useQueryClient();

  return useMutation<Tenant, Error, TenantFormValues>({
    mutationFn: async (values) => {
      // 1. Insert tenant row
      const { data: tenant, error } = await supabase
        .from('tenants')
        .insert({
          name: values.name,
          move_in_date: values.move_in_date,
          move_out_date:
            values.currently_living || !values.move_out_date
              ? null
              : values.move_out_date,
          phone: values.phone || null,
          email: values.email || null,
        })
        .select()
        .single();

      if (error) throw error;

      // 2. Upload documents
      if (values.new_documents.length > 0) {
        await uploadDocuments(tenant.id, values.new_documents);
      }

      return tenant as Tenant;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tenantKeys.lists() });
    },
  });
}

// ============================================================
// useUpdateTenant
// ============================================================
export function useUpdateTenant() {
  const queryClient = useQueryClient();

  return useMutation<
    Tenant,
    Error,
    { id: string; values: TenantFormValues }
  >({
    mutationFn: async ({ id, values }) => {
      // 1. Update tenant row
      const { data: tenant, error } = await supabase
        .from('tenants')
        .update({
          name: values.name,
          move_in_date: values.move_in_date,
          move_out_date:
            values.currently_living || !values.move_out_date
              ? null
              : values.move_out_date,
          phone: values.phone || null,
          email: values.email || null,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // 2. Remove deleted documents
      if (values.removed_document_ids.length > 0) {
        await removeDocuments(values.removed_document_ids);
      }

      // 3. Upload new documents
      if (values.new_documents.length > 0) {
        await uploadDocuments(id, values.new_documents);
      }

      return tenant as Tenant;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: tenantKeys.lists() });
      queryClient.invalidateQueries({ queryKey: tenantKeys.detail(id) });
    },
  });
}

// ============================================================
// useDeleteTenant
// ============================================================
export function useDeleteTenant() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      // Fetch documents to remove from Storage
      const { data: docs } = await supabase
        .from('tenant_documents')
        .select('file_path')
        .eq('tenant_id', id);

      if (docs && docs.length > 0) {
        const paths = docs.map((d: { file_path: string }) => d.file_path);
        await supabase.storage.from(DOCUMENTS_BUCKET).remove(paths);
      }

      // Deleting tenant will cascade-delete documents rows
      const { error } = await supabase.from('tenants').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tenantKeys.lists() });
    },
  });
}

// ============================================================
// Internal helpers
// ============================================================

async function uploadDocuments(tenantId: string, files: File[]) {
  await Promise.all(
    files.map(async (file) => {
      const filePath = `${tenantId}/${Date.now()}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from(DOCUMENTS_BUCKET)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from('tenant_documents').insert({
        tenant_id: tenantId,
        name: file.name,
        file_path: filePath,
        size: file.size,
        mime_type: file.type,
      });

      if (dbError) throw dbError;
    }),
  );
}

async function removeDocuments(docIds: string[]) {
  // Fetch paths first
  const { data: docs } = await supabase
    .from('tenant_documents')
    .select('file_path')
    .in('id', docIds);

  if (docs && docs.length > 0) {
    const paths = docs.map((d: { file_path: string }) => d.file_path);
    await supabase.storage.from(DOCUMENTS_BUCKET).remove(paths);
  }

  await supabase.from('tenant_documents').delete().in('id', docIds);
}
