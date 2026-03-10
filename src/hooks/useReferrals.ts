import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const db = supabase as any;

export interface Referral {
  id: string;
  referrer_id: string;
  referral_code: string;
  referred_user_id: string | null;
  status: string;
  reward_type: string;
  reward_value: number;
  converted_at: string | null;
  created_at: string;
  expires_at: string;
}

export function useMyReferrals() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['referrals', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await db
        .from('referrals')
        .select('*')
        .eq('referrer_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as Referral[];
    },
  });
}

export function useGenerateReferralCode() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await db.rpc('generate_referral_code', {
        p_user_id: user!.id,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
    },
  });
}