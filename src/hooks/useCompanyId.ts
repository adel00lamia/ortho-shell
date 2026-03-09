import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export function useCompanyId() {
  const { user } = useAuth();

  const { data: companyId = null, isLoading } = useQuery({
    queryKey: ['company-id', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user!.id)
        .single();
      return data?.company_id ?? null;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 30, // 30 min - rarely changes
  });

  return { companyId, loading: isLoading };
}
