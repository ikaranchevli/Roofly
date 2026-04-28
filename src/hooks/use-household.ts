import { useQuery } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export function useHousehold() {
  return useQuery({
    queryKey: ['household'],
    enabled: isSupabaseConfigured,
    queryFn: async () => {
      // 1. Get current session/user
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      
      console.log('useHousehold: Current user ID:', user?.id);
      if (!user) return null;

      // 2. Fetch profile
      const { data: profile, error: pErr } = await supabase
        .from('users')
        .select('household_id, role')
        .eq('id', user.id)
        .maybeSingle();

      console.log('useHousehold: Profile fetch result:', profile, 'Error:', pErr);

      if (profile?.household_id) {
        // 3. Fetch household
        const { data: household, error: hErr } = await supabase
          .from('households')
          .select('*')
          .eq('id', profile.household_id)
          .maybeSingle();

        console.log('useHousehold: Household fetch result:', household, 'Error:', hErr);

        if (household) {
          return { ...household, userRole: profile.role };
        }
      }

      // 4. Fallback for admin without profile link
      const { data: adminHousehold } = await supabase
        .from('households')
        .select('*')
        .eq('admin_id', user.id)
        .maybeSingle();

      console.log('useHousehold: Admin fallback fetch result:', adminHousehold);

      if (adminHousehold) {
        return { ...adminHousehold, userRole: 'admin' };
      }

      return null;
    },
  });
}
