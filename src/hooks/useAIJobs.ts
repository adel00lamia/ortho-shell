import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

export type AIJobType = 'plan_generation' | 'skill_analysis' | 'report_generation' | 'content_suggestion' | 'benchmark_analysis';
export type AIJobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface AIJob {
  id: string;
  company_id: string;
  user_id: string;
  job_type: AIJobType;
  status: AIJobStatus;
  input_data: Record<string, any>;
  output_data: Record<string, any> | null;
  error_message: string | null;
  progress: number;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export function useAIJobs() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['ai-jobs', user?.id],
    enabled: !!user,
    refetchInterval: (query) => {
      // Poll every 3s while any job is pending/processing
      const data = query.state.data as AIJob[] | undefined;
      if (data?.some(j => j.status === 'pending' || j.status === 'processing')) return 3000;
      return false;
    },
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('ai_jobs')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data || []) as AIJob[];
    },
  });
}

export function useCreateAIJob() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ jobType, inputData, companyId }: {
      jobType: AIJobType;
      inputData: Record<string, any>;
      companyId: string;
    }) => {
      const { data, error } = await supabase
        .from('ai_jobs')
        .insert({
          user_id: user!.id,
          company_id: companyId,
          job_type: jobType,
          input_data: inputData,
        })
        .select()
        .single();
      if (error) throw error;
      return data as AIJob;
    },
    onSuccess: (job) => {
      queryClient.invalidateQueries({ queryKey: ['ai-jobs'] });
      toast({ title: 'AI job queued', description: `${job.job_type} is being processed...` });
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });
}

export function useCancelAIJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await supabase
        .from('ai_jobs')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', jobId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-jobs'] });
    },
  });
}

/** Hook to poll a specific job until it completes */
export function useAIJobStatus(jobId: string | null) {
  return useQuery({
    queryKey: ['ai-job', jobId],
    enabled: !!jobId,
    refetchInterval: (query) => {
      const job = query.state.data as AIJob | undefined;
      if (job && (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled')) return false;
      return 2000;
    },
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_jobs')
        .select('*')
        .eq('id', jobId!)
        .single();
      if (error) throw error;
      return data as AIJob;
    },
  });
}
