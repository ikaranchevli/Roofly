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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: profile } = await supabase
        .from('users')
        .select('household_id')
        .eq('id', user.id)
        .single();

      if (!profile?.household_id) return [];

      const { data, error } = await supabase
        .from('users')
        .select('id, first_name, last_name, status, move_in_date, move_out_date, phone, email, household_id, created_at, documents:user_documents(*)')
        .eq('household_id', profile.household_id)
        .order('move_in_date', { ascending: false });

      if (error) throw error;
      
      // Add virtual name field for backward compatibility
      const tenantsWithNames = (data || []).map(t => ({
        ...t,
        name: `${t.first_name || ''} ${t.last_name || ''}`.trim()
      }));

      return tenantsWithNames as Tenant[];
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
        .from('users')
        .select('id, first_name, last_name, status, move_in_date, move_out_date, phone, email, household_id, created_at, documents:user_documents(*)')
        .eq('id', id)
        .single();

      if (error) throw error;

      const tenant = { ...data, name: `${data.first_name || ''} ${data.last_name || ''}`.trim() } as Tenant;
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
      // 0. Get user's household
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('users')
        .select('household_id')
        .eq('id', user?.id)
        .single();

      if (!profile?.household_id) {
        throw new Error('You must belong to a household to add tenants.');
      }

      // 1. Insert tenant row
      const { data: tenant, error } = await supabase
        .from('users')
        .insert({
          first_name: values.first_name,
          last_name: values.last_name,
          household_id: profile.household_id,
          move_in_date: values.move_in_date,
          move_out_date:
            values.currently_living || !values.move_out_date
              ? null
              : values.move_out_date,
          phone: values.phone || null,
          role: 'housemate',
          status: 'pending',
        })
        .select('id, first_name, last_name, status, move_in_date, move_out_date, phone, email, household_id, created_at')
        .single();

      if (error) throw error;

      return {
        ...tenant,
        name: `${tenant.first_name || ''} ${tenant.last_name || ''}`.trim()
      } as Tenant;
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
        .from('users')
        .update({
          first_name: values.first_name,
          last_name: values.last_name,
          move_in_date: values.move_in_date,
          move_out_date:
            values.currently_living || !values.move_out_date
              ? null
              : values.move_out_date,
          phone: values.phone || null,
        })
        .eq('id', id)
        .select('id, first_name, last_name, status, move_in_date, move_out_date, phone, email, household_id, created_at')
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

      return {
        ...tenant,
        name: `${tenant.first_name || ''} ${tenant.last_name || ''}`.trim()
      } as Tenant;
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
        .from('user_documents')
        .select('file_path')
        .eq('user_id', id);

      if (docs && docs.length > 0) {
        const paths = docs.map((d: { file_path: string }) => d.file_path);
        await supabase.storage.from(DOCUMENTS_BUCKET).remove(paths);
      }

      // Deleting tenant will cascade-delete documents rows
      const { error } = await supabase.from('users').delete().eq('id', id);
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

      const { error: dbError } = await supabase.from('user_documents').insert({
        user_id: tenantId,
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

  await supabase.from('user_documents').delete().in('id', docIds);
}
