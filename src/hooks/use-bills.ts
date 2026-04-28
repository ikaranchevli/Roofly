import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DOCUMENTS_BUCKET, isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { Bill, BillFormValues, BillSplit } from '@/types/bill';

/** Generate a signed URL for a document stored in Supabase Storage */
async function getSignedUrl(filePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl(filePath, 60 * 60); // 1 hour expiry
  if (error) throw error;
  return data.signedUrl;
}

/** Enrich bills with signed document URLs */
async function enrichBillsWithUrls(bills: Bill[]): Promise<Bill[]> {
  return Promise.all(
    bills.map(async (bill) => {
      if (!bill.document_path) return bill;
      const url = await getSignedUrl(bill.document_path).catch(() => undefined);
      return { ...bill, document_url: url };
    }),
  );
}

export const billKeys = {
  all: ['bills'] as const,
  detail: (id: string) => [...billKeys.all, id] as const,
};

export function useBills() {
  return useQuery<Bill[]>({
    queryKey: billKeys.all,
    enabled: isSupabaseConfigured,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bills')
        .select(`
          *,
          category:bill_categories(*),
          splits:bill_splits(
            *,
            tenant:tenants(*)
          )
        `)
        .order('start_date', { ascending: false });

      if (error) throw error;
      return enrichBillsWithUrls(data as Bill[]);
    },
  });
}

export function useCreateBill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bill,
      splits,
      documentFile,
    }: {
      bill: Omit<BillFormValues, 'document'>;
      documentFile?: File | null;
      splits: Omit<BillSplit, 'id' | 'bill_id' | 'created_at'>[];
    }) => {
      // 0. Get user's household
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('users')
        .select('household_id')
        .eq('id', user?.id)
        .single();

      if (!profile?.household_id) {
        throw new Error('You must belong to a household to add bills.');
      }

      // 1. Upload document if present
      let document_path = bill.document_path;
      if (documentFile) {
        document_path = await uploadBillDocument(documentFile);
      }

      // 2. Insert the bill
      const { data: insertedBill, error: billError } = await supabase
        .from('bills')
        .insert({ ...bill, household_id: profile.household_id, document_path })
        .select()
        .single();

      if (billError) throw billError;

      // 2. Prepare splits with the new bill_id
      const splitsToInsert = splits.map((split) => ({
        ...split,
        bill_id: insertedBill.id,
      }));

      // 3. Insert the splits
      const { error: splitsError } = await supabase
        .from('bill_splits')
        .insert(splitsToInsert);

      if (splitsError) {
        // Simple rollback if splits fail (in a real app, use an RPC/transaction)
        await supabase.from('bills').delete().eq('id', insertedBill.id);
        throw splitsError;
      }

      return insertedBill;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billKeys.all });
    },
  });
}

export function useUpdateBill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      bill,
      documentFile,
      removeDocument,
      splits,
    }: {
      id: string;
      bill: Omit<BillFormValues, 'document'>;
      documentFile?: File | null;
      removeDocument?: boolean;
      splits: Omit<BillSplit, 'id' | 'bill_id' | 'created_at'>[];
    }) => {
      // 0. Handle document
      let document_path = bill.document_path;
      
      if (removeDocument && document_path) {
        await supabase.storage.from(DOCUMENTS_BUCKET).remove([document_path]);
        document_path = undefined;
      }
      
      if (documentFile) {
        if (document_path) {
          // Clean up old file
          await supabase.storage.from(DOCUMENTS_BUCKET).remove([document_path]);
        }
        document_path = await uploadBillDocument(documentFile);
      }

      // 1. Update the bill
      const { data: updatedBill, error: billError } = await supabase
        .from('bills')
        .update({
          category_id: bill.category_id,
          amount: bill.amount,
          start_date: bill.start_date,
          end_date: bill.end_date,
          notes: bill.notes || null,
          document_path,
        })
        .eq('id', id)
        .select()
        .single();

      if (billError) throw billError;

      // 2. Delete existing splits
      const { error: deleteError } = await supabase
        .from('bill_splits')
        .delete()
        .eq('bill_id', id);
        
      if (deleteError) throw deleteError;

      // 3. Prepare new splits
      const splitsToInsert = splits.map((split) => ({
        ...split,
        bill_id: id,
      }));

      // 4. Insert the new splits
      const { error: splitsError } = await supabase
        .from('bill_splits')
        .insert(splitsToInsert);

      if (splitsError) throw splitsError;

      return updatedBill;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billKeys.all });
    },
  });
}

export function useDeleteBill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('bills')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billKeys.all });
    },
  });
}

// ============================================================
// Internal helpers
// ============================================================

async function uploadBillDocument(file: File): Promise<string> {
  const filePath = `bills/${Date.now()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  return filePath;
}
