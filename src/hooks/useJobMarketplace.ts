import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useCompanyId } from '@/hooks/useCompanyId';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useOpenJobs() {
  const { companyId } = useCompanyId();

  return useQuery({
    queryKey: ['open-jobs', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_descriptions')
        .select('*')
        .eq('company_id', companyId!)
        .eq('is_open', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });
}

export function useMyApplications() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-applications', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_applications')
        .select('*')
        .eq('user_id', user!.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
}

export function useApplyToJob() {
  const { user } = useAuth();
  const { companyId } = useCompanyId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ jobId, matchScore }: { jobId: string; matchScore: number }) => {
      const { error } = await supabase.from('job_applications').insert({
        company_id: companyId!,
        job_description_id: jobId,
        user_id: user!.id,
        match_score: matchScore,
        status: 'interested',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-applications'] });
      toast.success('Application submitted!');
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useWithdrawApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (applicationId: string) => {
      const { error } = await supabase
        .from('job_applications')
        .delete()
        .eq('id', applicationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-applications'] });
      toast.success('Application withdrawn');
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useJobsWithApplicants() {
  const { companyId } = useCompanyId();

  return useQuery({
    queryKey: ['jobs-with-applicants', companyId],
    queryFn: async () => {
      // Get open jobs
      const { data: jobs } = await supabase
        .from('job_descriptions')
        .select('*')
        .eq('company_id', companyId!)
        .eq('is_open', true);

      if (!jobs || jobs.length === 0) return [];

      // Get all applications for these jobs
      const jobIds = jobs.map(j => j.id);
      const { data: applications } = await supabase
        .from('job_applications')
        .select('*')
        .eq('company_id', companyId!)
        .in('job_description_id', jobIds);

      // Get applicant profiles
      const userIds = [...new Set((applications || []).map(a => a.user_id))];
      let profiles: any[] = [];
      if (userIds.length > 0) {
        const { data } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url')
          .in('id', userIds);
        profiles = data || [];
      }

      return jobs.map(job => ({
        ...job,
        applicants: (applications || [])
          .filter(a => a.job_description_id === job.id)
          .map(a => {
            const profile = profiles.find(p => p.id === a.user_id);
            return {
              ...a,
              name: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown' : 'Unknown',
              avatarUrl: profile?.avatar_url,
            };
          })
          .sort((a: any, b: any) => b.match_score - a.match_score),
      }));
    },
    enabled: !!companyId,
  });
}
