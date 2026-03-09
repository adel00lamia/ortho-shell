import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useCompanyId } from '@/hooks/useCompanyId';
import { supabase } from '@/integrations/supabase/client';

export interface Discussion {
  id: string;
  company_id: string;
  user_id: string;
  module_id: string | null;
  plan_id: string | null;
  parent_id: string | null;
  content: string;
  created_at: string;
  updated_at: string;
  // Joined
  user_name?: string;
  replies?: Discussion[];
  reactions?: ReactionSummary[];
}

export interface ReactionSummary {
  emoji: string;
  count: number;
  reacted: boolean; // current user reacted
}

export function useDiscussions(moduleId?: string, planId?: string) {
  const { user } = useAuth();
  const { companyId } = useCompanyId();

  return useQuery({
    queryKey: ['discussions', moduleId, planId],
    queryFn: async () => {
      let query = supabase
        .from('discussions')
        .select('*')
        .eq('company_id', companyId!)
        .is('parent_id', null)
        .order('created_at', { ascending: false });

      if (moduleId) query = query.eq('module_id', moduleId);
      if (planId) query = query.eq('plan_id', planId);

      const { data, error } = await query;
      if (error) throw error;

      // Fetch replies for all discussions
      const ids = (data || []).map(d => d.id);
      let replies: any[] = [];
      if (ids.length > 0) {
        const { data: replyData } = await supabase
          .from('discussions')
          .select('*')
          .in('parent_id', ids)
          .order('created_at', { ascending: true });
        replies = replyData || [];
      }

      // Fetch reactions
      const allIds = [...ids, ...replies.map(r => r.id)];
      let reactions: any[] = [];
      if (allIds.length > 0) {
        const { data: reactionData } = await supabase
          .from('reactions')
          .select('*')
          .in('discussion_id', allIds);
        reactions = reactionData || [];
      }

      // Fetch user names
      const userIds = [...new Set([...(data || []).map(d => d.user_id), ...replies.map(r => r.user_id)])];
      let profiles: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', userIds);
        (profileData || []).forEach(p => {
          profiles[p.id] = [p.first_name, p.last_name].filter(Boolean).join(' ') || 'User';
        });
      }

      const buildReactions = (discussionId: string): ReactionSummary[] => {
        const discReactions = reactions.filter(r => r.discussion_id === discussionId);
        const emojiMap = new Map<string, { count: number; reacted: boolean }>();
        discReactions.forEach(r => {
          const existing = emojiMap.get(r.emoji) || { count: 0, reacted: false };
          existing.count++;
          if (r.user_id === user?.id) existing.reacted = true;
          emojiMap.set(r.emoji, existing);
        });
        return Array.from(emojiMap.entries()).map(([emoji, data]) => ({
          emoji,
          ...data,
        }));
      };

      return (data || []).map(d => ({
        ...d,
        user_name: profiles[d.user_id] || 'User',
        replies: replies
          .filter(r => r.parent_id === d.id)
          .map(r => ({
            ...r,
            user_name: profiles[r.user_id] || 'User',
            reactions: buildReactions(r.id),
          })),
        reactions: buildReactions(d.id),
      })) as Discussion[];
    },
    enabled: !!companyId && (!!moduleId || !!planId),
  });
}

export function useAddDiscussion() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { companyId } = useCompanyId();

  return useMutation({
    mutationFn: async (data: {
      module_id?: string;
      plan_id?: string;
      parent_id?: string;
      content: string;
    }) => {
      const { error } = await supabase.from('discussions').insert({
        company_id: companyId!,
        user_id: user!.id,
        module_id: data.module_id || null,
        plan_id: data.plan_id || null,
        parent_id: data.parent_id || null,
        content: data.content,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discussions'] });
    },
  });
}

export function useDeleteDiscussion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('discussions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discussions'] });
    },
  });
}

export function useToggleReaction() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ discussionId, emoji }: { discussionId: string; emoji: string }) => {
      // Check if already reacted
      const { data: existing } = await supabase
        .from('reactions')
        .select('id')
        .eq('discussion_id', discussionId)
        .eq('user_id', user!.id)
        .eq('emoji', emoji)
        .maybeSingle();

      if (existing) {
        await supabase.from('reactions').delete().eq('id', existing.id);
      } else {
        await supabase.from('reactions').insert({
          discussion_id: discussionId,
          user_id: user!.id,
          emoji,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discussions'] });
    },
  });
}
