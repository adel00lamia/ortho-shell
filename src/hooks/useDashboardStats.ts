import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useCompanyProfile, CompanyContext } from '@/hooks/useCompanyProfile';
import { supabase } from '@/integrations/supabase/client';

export interface DashboardStats {
  totalUsers: number;
  activeCompanies: number;
  trainingPlans: number;
  completionRate: number;
  teamMembers: number;
  activePlans: number;
  avgProgress: number;
  certificates: number;
  activeCourses: number;
  totalStudents: number;
  // Company profile integration
  totalEmployees: number;
  totalDepartments: number;
  totalEvaluations: number;
  totalJDs: number;
  avgRating: number;
  criticalPositions: number;
  topSkillGaps: string[];
  topTrainingNeeds: string[];
  // Skills taxonomy
  totalSkills: number;
  totalSkillCategories: number;
  recentActivity: {
    title: string;
    time: string;
    type: 'success' | 'info' | 'warning';
  }[];
}

/** Fetch only plan/module data that useCompanyProfile doesn't cover */
async function fetchPlanStats(companyId: string | null): Promise<{
  totalPlans: number;
  activePlans: number;
  completionRate: number;
  modulesCount: number;
  completedModules: number;
  teamCount: number;
  totalSkills: number;
  totalSkillCategories: number;
  recentEvals: { employee_name: string; created_at: string | null }[];
}> {
  const [plansRes, modulesRes, teamRes, evalsRes, skillsRes, catRes] = await Promise.all([
    (() => {
      let q = supabase.from('training_plans').select('id, status', { count: 'exact' });
      if (companyId) q = q.eq('company_id', companyId);
      return q;
    })(),
    supabase.from('training_modules').select('id, completed', { count: 'exact' }),
    companyId
      ? supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('company_id', companyId)
      : Promise.resolve({ count: 0 }),
    (() => {
      let q = supabase.from('performance_evaluations').select('employee_name, created_at');
      if (companyId) q = q.eq('company_id', companyId);
      return q.order('created_at', { ascending: false }).limit(4);
    })(),
    companyId
      ? supabase.from('skills').select('id', { count: 'exact', head: true }).eq('company_id', companyId)
      : Promise.resolve({ count: 0 }),
    companyId
      ? supabase.from('skill_categories').select('id', { count: 'exact', head: true }).eq('company_id', companyId)
      : Promise.resolve({ count: 0 }),
  ]);

  const plans = plansRes.data || [];
  const activePlans = plans.filter(p => p.status === 'active').length;
  const completedPlans = plans.filter(p => p.status === 'completed').length;
  const totalPlans = plansRes.count || 0;
  const completionRate = totalPlans > 0 ? Math.round((completedPlans / totalPlans) * 100) : 0;

  const modules = modulesRes.data || [];
  const completedModules = modules.filter(m => m.completed).length;
  const modulesCount = modulesRes.count || 0;
  const teamCount = teamRes.count || 0;

  return {
    totalPlans,
    activePlans,
    completionRate,
    modulesCount,
    completedModules,
    teamCount,
    recentEvals: (evalsRes.data || []) as { employee_name: string; created_at: string | null }[],
  };
}

/** Merge useCompanyProfile context + plan stats into DashboardStats */
function buildDashboardStats(
  context: CompanyContext | null,
  planStats: Awaited<ReturnType<typeof fetchPlanStats>>,
  companyId: string | null,
): DashboardStats {
  const { totalPlans, activePlans, completionRate, modulesCount, completedModules, teamCount, recentEvals } = planStats;

  // Derive from company context (single source of truth)
  const companyStats = context?.stats;

  // Recent activity from evaluations
  type ActivityType = 'success' | 'info' | 'warning';
  const recentActivity: { title: string; time: string; type: ActivityType }[] =
    recentEvals.map(ev => ({
      title: `Evaluation: ${ev.employee_name}`,
      time: ev.created_at ? formatTimeAgo(new Date(ev.created_at)) : '',
      type: 'success' as ActivityType,
    }));

  return {
    totalUsers: teamCount,
    activeCompanies: companyId ? 1 : 0,
    trainingPlans: totalPlans,
    completionRate,
    teamMembers: teamCount,
    activePlans,
    avgProgress: modulesCount ? Math.round((completedModules / (modulesCount || 1)) * 100) : 0,
    certificates: completedModules,
    activeCourses: modulesCount || 0,
    totalStudents: teamCount,
    // From centralized company context — no duplicate queries
    totalEmployees: companyStats?.totalEmployees ?? 0,
    totalDepartments: companyStats?.totalDepartments ?? 0,
    totalEvaluations: companyStats?.totalEvaluations ?? 0,
    totalJDs: companyStats?.totalJDs ?? 0,
    avgRating: companyStats?.avgRating ?? 0,
    criticalPositions: companyStats?.criticalPositions ?? 0,
    topSkillGaps: companyStats?.skillGaps ?? [],
    topTrainingNeeds: companyStats?.topTrainingNeeds ?? [],
    recentActivity,
  };
}

export const useDashboardStats = (role: string | null) => {
  const { user } = useAuth();
  const { context, companyId } = useCompanyProfile();

  const { data: planStats, isLoading: planLoading } = useQuery({
    queryKey: ['dashboard-plan-stats', companyId, user?.id],
    queryFn: () => fetchPlanStats(companyId),
    enabled: !!user && !!role,
    staleTime: 1000 * 60 * 2,
  });

  const stats = planStats ? buildDashboardStats(context, planStats, companyId) : null;

  return { stats, loading: planLoading };
};

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return "A l'instant";
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays === 1) return 'Hier';
  return `Il y a ${diffDays} jours`;
}
