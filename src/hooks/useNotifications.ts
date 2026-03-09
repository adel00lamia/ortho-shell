import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Notification {
  id: string;
  user_id: string;
  company_id: string | null;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
}

export function useNotifications() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!user,
    refetchInterval: 30_000, // poll every 30s
  });
}

export function useUnreadCount() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['notifications-unread-count', user?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user!.id)
        .eq('read', false);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
    refetchInterval: 15_000,
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications', user?.id] });
      qc.invalidateQueries({ queryKey: ['notifications-unread-count', user?.id] });
    },
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('mark_all_notifications_read', {
        p_user_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications', user?.id] });
      qc.invalidateQueries({ queryKey: ['notifications-unread-count', user?.id] });
    },
  });
}
