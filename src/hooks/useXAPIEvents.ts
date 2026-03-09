import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCompanyId } from '@/hooks/useCompanyId';

export type XAPIVerb =
  | 'launched'
  | 'completed'
  | 'passed'
  | 'failed'
  | 'progressed'
  | 'answered'
  | 'suspended'
  | 'resumed';

export interface XAPIEvent {
  id: string;
  user_id: string;
  module_id: string | null;
  verb: XAPIVerb;
  object_type: string;
  object_id: string | null;
  result_score: number | null;
  result_success: boolean | null;
  result_duration: string | null;
  result_response: string | null;
  context_data: Record<string, unknown>;
  created_at: string;
}

export function useTrackEvent() {
  const { user } = useAuth();
  const { companyId } = useCompanyId();

  return useMutation({
    mutationFn: async (event: {
      module_id?: string;
      verb: XAPIVerb;
      object_type: string;
      object_id?: string;
      result_score?: number;
      result_success?: boolean;
      result_duration?: string;
      result_response?: string;
      context_data?: Record<string, unknown>;
    }) => {
      if (!user || !companyId) return;
      const { error } = await supabase.from('xapi_events').insert({
        company_id: companyId,
        user_id: user.id,
        module_id: event.module_id || null,
        verb: event.verb,
        object_type: event.object_type,
        object_id: event.object_id || null,
        result_score: event.result_score ?? null,
        result_success: event.result_success ?? null,
        result_duration: event.result_duration || null,
        result_response: event.result_response || null,
        context_data: event.context_data || {},
      });
      if (error) throw error;
    },
  });
}

export function useModuleEvents(moduleId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['xapi-events', moduleId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('xapi_events')
        .select('*')
        .eq('module_id', moduleId!)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as XAPIEvent[];
    },
    enabled: !!moduleId && !!user,
  });
}

export function useModuleEventsSummary(moduleId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['xapi-summary', moduleId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('xapi_events')
        .select('verb, result_score, result_success, created_at')
        .eq('module_id', moduleId!)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;

      const events = data || [];
      const launched = events.find(e => e.verb === 'launched');
      const completed = events.find(e => e.verb === 'completed');
      const lastScore = events.find(e => e.result_score !== null);
      const attempts = events.filter(e => e.verb === 'launched').length;

      return {
        hasStarted: !!launched,
        hasCompleted: !!completed,
        lastScore: lastScore?.result_score ?? null,
        passed: events.some(e => e.verb === 'passed'),
        attempts,
        firstLaunch: launched?.created_at ?? null,
        completedAt: completed?.created_at ?? null,
      };
    },
    enabled: !!moduleId && !!user,
  });
}
