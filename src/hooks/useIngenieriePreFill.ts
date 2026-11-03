import { useQuery } from '@tanstack/react-query';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

// Maps company industry values to GIAC sectors
const INDUSTRY_TO_GIAC: Record<string, string> = {
  'Technology': 'Technologies', 'TIC': 'Technologies', 'Informatique': 'Technologies', 'IT': 'Technologies',
  'Tourisme': 'Tourisme', 'Hôtellerie': 'Tourisme', 'Restauration': 'Tourisme',
  'Manufacturing': 'IMMEE', 'Industrie': 'IMMEE', 'Métallurgie': 'IMMEE', 'Électronique': 'IMMEE',
  'Textile': 'Textile-Cuir', 'Cuir': 'Textile-Cuir', 'Habillement': 'Textile-Cuir',
  'Agroalimentaire': 'Agroalimentaire', 'Agriculture': 'Agroalimentaire', 'Alimentaire': 'Agroalimentaire',
  'Transport': 'TRANSLOG', 'Logistique': 'TRANSLOG', 'Transit': 'TRANSLOG',
  'Commerce': 'Tertiaire', 'Finance': 'Tertiaire', 'Services': 'Tertiaire',
  'Banque': 'Tertiaire', 'Assurance': 'Tertiaire', 'Conseil': 'Tertiaire',
  'BTP': 'BTP', 'Construction': 'BTP', 'Immobilier': 'BTP',
  'Pêche': 'Pêches-Maritimes', 'Maritime': 'Pêches-Maritimes',
};

export function mapIndustryToGiac(industry: string | null): string {
  if (!industry) return '';
  return INDUSTRY_TO_GIAC[industry] ?? '';
}

// ─── Step 1: Fiche Signalétique ───────────────────────────────────────────────

export function useFicheSignaletiquePreFill() {
  const { companyId } = useCompanyId();
  const { user } = useAuth();

  const companyQuery = useQuery({
    queryKey: ['company-prefill', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('name, phone, contact_email, industry')
        .eq('id', companyId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });

  const profileQuery = useQuery({
    queryKey: ['profile-prefill', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  const company = companyQuery.data;
  const profile = profileQuery.data;
  const contactName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ');

  return {
    isLoading: companyQuery.isLoading || profileQuery.isLoading,
    defaults: {
      contact_name: contactName,
      contact_email: user?.email ?? company?.contact_email ?? '',
      contact_phone: company?.phone ?? '',
      giac_sector: mapIndustryToGiac(company?.industry ?? null),
    },
  };
}

// ─── Step 2: SWOT Suggestions ─────────────────────────────────────────────────

export function useSWOTSuggestions() {
  const { companyId } = useCompanyId();

  return useQuery({
    queryKey: ['swot-suggestions', companyId],
    queryFn: async () => {
      const [evalsRes, plansRes] = await Promise.all([
        supabase
          .from('performance_evaluations')
          .select('strengths, areas_for_improvement')
          .eq('company_id', companyId!),
        supabase
          .from('training_plans')
          .select('target_skills, objectives, description')
          .eq('company_id', companyId!),
      ]);

      const evals = evalsRes.data ?? [];
      const plans = plansRes.data ?? [];

      const strengths = [...new Set(evals.flatMap(e => e.strengths ?? []).filter(Boolean))];
      const weaknesses = [...new Set(evals.flatMap(e => e.areas_for_improvement ?? []).filter(Boolean))];
      const opportunities = [...new Set(
        plans.flatMap(p => [...(p.target_skills ?? []), ...(p.objectives ?? [])]).filter(Boolean)
      )];

      return { strengths, weaknesses, opportunities };
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Step 3: Training Needs Suggestions ──────────────────────────────────────

export type NeedSuggestion = {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  targetGroup?: string;
};

export function useNeedsSuggestions() {
  const { companyId } = useCompanyId();

  return useQuery({
    queryKey: ['needs-suggestions', companyId],
    queryFn: async () => {
      const [evalsRes, plansRes] = await Promise.all([
        supabase
          .from('performance_evaluations')
          .select('employee_name, department, training_recommendations, overall_rating')
          .eq('company_id', companyId!),
        supabase
          .from('training_plans')
          .select('title, objectives, target_skills')
          .eq('company_id', companyId!),
      ]);

      const evals = evalsRes.data ?? [];
      const plans = plansRes.data ?? [];

      // Individual: one need per employee recommendation
      const individualNeeds: NeedSuggestion[] = evals.flatMap(e =>
        (e.training_recommendations ?? []).map(rec => ({
          id: crypto.randomUUID(),
          title: rec,
          description: '',
          priority: ((e.overall_rating ?? 3) <= 2 ? 'high' : 'medium') as NeedSuggestion['priority'],
          targetGroup: [e.employee_name, e.department].filter(Boolean).join(' — '),
        }))
      );

      // Collective: group same recommendation across employees
      const recMap = new Map<string, { count: number; depts: Set<string> }>();
      evals.forEach(e =>
        (e.training_recommendations ?? []).forEach(rec => {
          const entry = recMap.get(rec) ?? { count: 0, depts: new Set<string>() };
          entry.count++;
          if (e.department) entry.depts.add(e.department);
          recMap.set(rec, entry);
        })
      );
      const collectiveNeeds: NeedSuggestion[] = [...recMap.entries()]
        .filter(([, v]) => v.count >= 2)
        .map(([title, v]) => ({
          id: crypto.randomUUID(),
          title,
          description: `${v.count} employés concernés`,
          priority: (v.count >= 3 ? 'high' : 'medium') as NeedSuggestion['priority'],
          targetGroup: [...v.depts].join(', ') || undefined,
        }));

      // Strategic: from training plan objectives
      const strategicNeeds: NeedSuggestion[] = plans.flatMap(p =>
        (p.objectives ?? []).map(obj => ({
          id: crypto.randomUUID(),
          title: obj,
          description: `Plan : ${p.title}`,
          priority: 'medium' as NeedSuggestion['priority'],
        }))
      );

      return { individualNeeds, collectiveNeeds, strategicNeeds };
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Step 4: Actions from Training Plans ─────────────────────────────────────

export type ActionSuggestion = {
  title: string;
  content_outline: string;
  duration_days: number | null;
  duration_hours: number | null;
  cost_ht: number | null;
  is_planned: boolean;
  provider_type: 'internal' | 'external' | 'mixed';
  source_need_type: 'individual' | 'collective' | 'strategic';
};

export function useActionsFromTrainingPlans() {
  const { companyId } = useCompanyId();

  return useQuery({
    queryKey: ['actions-from-plans', companyId],
    queryFn: async () => {
      const { data: plans, error } = await supabase
        .from('training_plans')
        .select('title, description, objectives, budget, duration_months, status')
        .eq('company_id', companyId!);
      if (error) throw error;

      return (plans ?? []).map<ActionSuggestion>(p => ({
        title: p.title,
        content_outline: [p.description, ...(p.objectives ?? [])].filter(Boolean).join('\n'),
        duration_days: p.duration_months ? p.duration_months * 20 : null,
        duration_hours: p.duration_months ? p.duration_months * 160 : null,
        cost_ht: p.budget ?? null,
        is_planned: p.status === 'active' || p.status === 'completed',
        provider_type: 'external',
        source_need_type: 'strategic',
      }));
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}
