import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useCompanyId } from '@/hooks/useCompanyId';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const db = supabase as any;

export function useSyncJobTitleSkills() {
  const { user } = useAuth();
  const { companyId } = useCompanyId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user?.email || !companyId) throw new Error('Missing context');

      // Get employee record
      const { data: emp } = await supabase
        .from('company_employees')
        .select('full_name, position, department')
        .eq('company_id', companyId)
        .eq('email', user.email)
        .eq('status', 'active')
        .maybeSingle();

      if (!emp?.position) throw new Error('No position found for your profile');

      // Find matching job descriptions
      const { data: jds } = await supabase
        .from('job_descriptions')
        .select('required_skills, competencies')
        .eq('company_id', companyId)
        .or(`title.ilike.%${emp.position}%,department.eq.${emp.department || ''}`);

      if (!jds || jds.length === 0) throw new Error('No matching job descriptions found');

      // Extract skill names from JDs
      const skillNames = new Set<string>();
      for (const jd of jds) {
        const required = Array.isArray(jd.required_skills) ? jd.required_skills : [];
        const comps = Array.isArray(jd.competencies) ? jd.competencies : [];
        for (const s of required) {
          const name = typeof s === 'string' ? s : (s as any)?.name;
          if (name) skillNames.add(name.toLowerCase().trim());
        }
        for (const c of comps) {
          const name = typeof c === 'string' ? c : (c as any)?.name;
          if (name) skillNames.add(name.toLowerCase().trim());
        }
      }

      if (skillNames.size === 0) throw new Error('No skills found in matching job descriptions');

      // Find matching skills in catalog
      const { data: catalogSkills } = await db
        .from('skills')
        .select('id, name_en, name_fr')
        .eq('company_id', companyId);

      const matched = (catalogSkills || []).filter((cs: any) =>
        [...skillNames].some(
          sn => cs.name_en?.toLowerCase().includes(sn) || cs.name_fr?.toLowerCase().includes(sn) ||
                sn.includes(cs.name_en?.toLowerCase() || '') || sn.includes(cs.name_fr?.toLowerCase() || '')
        )
      );

      if (matched.length === 0) throw new Error('No matching skills found in catalog');

      // Upsert inferred skills
      let inserted = 0;
      for (const skill of matched) {
        const { data: existing } = await supabase
          .from('inferred_skills')
          .select('id')
          .eq('company_id', companyId)
          .eq('user_id', user.id)
          .eq('skill_id', skill.id)
          .maybeSingle();

        if (!existing) {
          const { error } = await supabase.from('inferred_skills').insert({
            company_id: companyId,
            user_id: user.id,
            skill_id: skill.id,
            confidence: 65,
            inferred_from: `job_title:${emp.position}`,
          });
          if (!error) inserted++;
        }
      }

      return { inserted, total: matched.length };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['my-inferred-skills'] });
      toast.success(`Synced ${result.inserted} new skills from job title (${result.total} matched)`);
    },
    onError: (e: any) => toast.error(e.message),
  });
}
