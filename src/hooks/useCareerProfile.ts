import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useCompanyId } from '@/hooks/useCompanyId';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const db = supabase as any;

export interface AggregatedSkill {
  skillId: string;
  skillName: string;
  categoryName: string;
  currentLevel: number;
  targetLevel: number;
  source: 'assessed' | 'inferred';
  confidence?: number;
  inferredFrom?: string;
  assessedAt?: string;
  isStale: boolean;
}

export interface CareerMatch {
  jobId: string;
  title: string;
  department: string | null;
  level: string | null;
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
}

export function isSkillStale(assessedAt: string | undefined): boolean {
  if (!assessedAt) return true;
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  return new Date(assessedAt) < twelveMonthsAgo;
}

export function useSkillDeclaration() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: declarationText = '', isLoading } = useQuery({
    queryKey: ['skill-declaration', user?.id],
    queryFn: async () => {
      if (!user) return '';
      const { data } = await supabase
        .from('profiles')
        .select('skill_declaration_text')
        .eq('id', user.id)
        .single();
      return data?.skill_declaration_text || '';
    },
    enabled: !!user,
  });

  const saveMutation = useMutation({
    mutationFn: async (text: string) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('profiles')
        .update({ skill_declaration_text: text })
        .eq('id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skill-declaration'] });
      toast.success('Skills declaration saved');
    },
    onError: (e: any) => toast.error(e.message),
  });

  return { declarationText, isLoading, saveDeclaration: saveMutation.mutate, saving: saveMutation.isPending };
}

export function useCareerProfile() {
  const { user } = useAuth();
  const { companyId } = useCompanyId();

  // Get employee record for current user
  const { data: employee } = useQuery({
    queryKey: ['my-employee-record', user?.email, companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from('company_employees')
        .select('*')
        .eq('company_id', companyId!)
        .eq('email', user!.email!)
        .eq('status', 'active')
        .maybeSingle();
      return data;
    },
    enabled: !!user?.email && !!companyId,
  });

  // Get assessed skills
  const { data: assessedSkills = [] } = useQuery({
    queryKey: ['my-assessed-skills', employee?.full_name, companyId],
    queryFn: async () => {
      const { data } = await db
        .from('employee_skills')
        .select('*, skill:skills(id, name_en, name_fr, category_id, category:skill_categories(name_en, name_fr))')
        .eq('company_id', companyId!)
        .eq('employee_name', employee!.full_name);
      return data || [];
    },
    enabled: !!employee?.full_name && !!companyId,
  });

  // Get inferred skills
  const { data: inferredSkills = [] } = useQuery({
    queryKey: ['my-inferred-skills', user?.id, companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from('inferred_skills')
        .select('*')
        .eq('company_id', companyId!)
        .eq('user_id', user!.id);

      if (!data || data.length === 0) return [];

      // Fetch skill details
      const skillIds = data.map((s: any) => s.skill_id);
      const { data: skillDetails } = await db
        .from('skills')
        .select('id, name_en, name_fr, category_id, category:skill_categories(name_en, name_fr)')
        .in('id', skillIds);

      return data.map((inf: any) => ({
        ...inf,
        skill: (skillDetails || []).find((s: any) => s.id === inf.skill_id),
      }));
    },
    enabled: !!user?.id && !!companyId,
  });

  // Aggregate all skills
  const aggregatedSkills: AggregatedSkill[] = [
    ...assessedSkills.map((s: any) => ({
      skillId: s.skill_id,
      skillName: s.skill?.name_en || 'Unknown',
      categoryName: s.skill?.category?.name_en || 'General',
      currentLevel: s.current_level,
      targetLevel: s.target_level,
      source: 'assessed' as const,
      assessedAt: s.assessed_at,
      isStale: isSkillStale(s.assessed_at),
    })),
    ...inferredSkills
      .filter((inf: any) => !assessedSkills.some((a: any) => a.skill_id === inf.skill_id))
      .map((inf: any) => ({
        skillId: inf.skill_id,
        skillName: inf.skill?.name_en || 'Unknown',
        categoryName: inf.skill?.category?.name_en || 'General',
        currentLevel: Math.round((inf.confidence / 100) * 5),
        targetLevel: 5,
        source: 'inferred' as const,
        confidence: inf.confidence,
        inferredFrom: inf.inferred_from,
        isStale: false,
      })),
  ];

  // Career path matching
  const { data: careerMatches = [] } = useQuery({
    queryKey: ['career-matches', companyId, aggregatedSkills.length],
    queryFn: async () => {
      const { data: jds } = await supabase
        .from('job_descriptions')
        .select('id, title, department, level, required_skills, competencies')
        .eq('company_id', companyId!);

      if (!jds) return [];

      const mySkillNames = aggregatedSkills.map(s => s.skillName.toLowerCase());

      return jds.map((jd: any): CareerMatch => {
        const required = [
          ...(Array.isArray(jd.required_skills) ? jd.required_skills : []),
          ...(Array.isArray(jd.competencies) ? (jd.competencies as any[]).map((c: any) => c.name || c) : []),
        ].map((s: any) => (typeof s === 'string' ? s : s.name || '').toLowerCase()).filter(Boolean);

        const matched = required.filter(r => mySkillNames.some(m => m.includes(r) || r.includes(m)));
        const missing = required.filter(r => !mySkillNames.some(m => m.includes(r) || r.includes(m)));
        const score = required.length > 0 ? Math.round((matched.length / required.length) * 100) : 0;

        return {
          jobId: jd.id,
          title: jd.title,
          department: jd.department,
          level: jd.level,
          matchScore: score,
          matchedSkills: matched,
          missingSkills: missing,
        };
      })
        .filter((m: CareerMatch) => m.matchScore > 0)
        .sort((a: CareerMatch, b: CareerMatch) => b.matchScore - a.matchScore);
    },
    enabled: !!companyId && aggregatedSkills.length > 0,
  });

  return { employee, aggregatedSkills, careerMatches, assessedSkills, inferredSkills };
}
