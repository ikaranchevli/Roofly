import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export function usePendingProfiles() {
  return useQuery({
    queryKey: ['pending-profiles'],
    enabled: isSupabaseConfigured,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: profile } = await supabase
        .from('users')
        .select('household_id, role')
        .eq('id', user.id)
        .single();

      if (!profile || profile.role !== 'admin') return [];

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('household_id', profile.household_id)
        .eq('status', 'pending');

      if (error) throw error;
      return data;
    },
  });
}

export function useApproveProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profileId: string) => {
      const { error } = await supabase
        .from('users')
        .update({ status: 'active' })
        .eq('id', profileId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-profiles'] });
    },
  });
}
