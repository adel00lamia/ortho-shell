import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
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
  recentActivity: {
    title: string;
    time: string;
    type: 'success' | 'info' | 'warning';
  }[];
}

async function fetchDashboardStats(userId: string): Promise<DashboardStats> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', userId)
    .maybeSingle();

  const companyId = profile?.company_id;

  // Fetch all data in parallel
  const [plansRes, modulesRes, teamRes, evalsRes, employeesRes, deptsRes, positionsRes, jdsRes] = await Promise.all([
    (() => {
      let q = supabase.from('training_plans').select('id, status, modules', { count: 'exact' });
      if (companyId) q = q.eq('company_id', companyId);
      return q;
    })(),
    supabase.from('training_modules').select('id, completed', { count: 'exact' }),
    companyId
      ? supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('company_id', companyId)
      : Promise.resolve({ count: 0 }),
    (() => {
      let q = supabase.from('performance_evaluations').select('id, employee_name, overall_rating, areas_for_improvement, training_recommendations, created_at');
      if (companyId) q = q.eq('company_id', companyId);
      return q.order('created_at', { ascending: false }).limit(50);
    })(),
    companyId
      ? supabase.from('company_employees').select('id', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'active')
      : Promise.resolve({ count: 0 }),
    companyId
      ? supabase.from('departments').select('id', { count: 'exact', head: true }).eq('company_id', companyId)
      : Promise.resolve({ count: 0 }),
    companyId
      ? supabase.from('positions').select('id, is_critical', { count: 'exact' }).eq('company_id', companyId)
      : Promise.resolve({ data: null, count: 0 }),
    companyId
      ? supabase.from('job_descriptions').select('id', { count: 'exact', head: true }).eq('company_id', companyId)
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

  const evals = evalsRes.data || [];
  const ratings = evals.filter(e => e.overall_rating).map(e => e.overall_rating!);
  const avgRating = ratings.length > 0 ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10 : 0;

  // Aggregate skill gaps & training needs from evaluations
  const gapCounts: Record<string, number> = {};
  const needsCounts: Record<string, number> = {};
  evals.forEach(ev => {
    (ev.areas_for_improvement || []).forEach((g: string) => { gapCounts[g] = (gapCounts[g] || 0) + 1; });
    (ev.training_recommendations || []).forEach((t: string) => { needsCounts[t] = (needsCounts[t] || 0) + 1; });
  });
  const topSkillGaps = Object.entries(gapCounts).sort(([, a], [, b]) => b - a).slice(0, 5).map(([g]) => g);
  const topTrainingNeeds = Object.entries(needsCounts).sort(([, a], [, b]) => b - a).slice(0, 5).map(([t]) => t);

  const criticalPositions = (positionsRes.data || []).filter((p: any) => p.is_critical).length;

  // Build recent activity
  type ActivityType = 'success' | 'info' | 'warning';
  const recentActivity: { title: string; time: string; type: ActivityType }[] = evals.slice(0, 4).map(ev => ({
    title: `Evaluation: ${ev.employee_name}`,
    time: ev.created_at ? formatTimeAgo(new Date(ev.created_at)) : '',
    type: 'success' as ActivityType,
  }));

  if (plans.length > 0 && recentActivity.length < 4) {
    plans.slice(0, 4 - recentActivity.length).forEach(() => {
      recentActivity.push({ title: 'Plan de formation cree', time: '', type: 'info' as ActivityType });
    });
  }

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
    totalEmployees: employeesRes.count || 0,
    totalDepartments: deptsRes.count || 0,
    totalEvaluations: evals.length,
    totalJDs: jdsRes.count || 0,
    avgRating,
    criticalPositions,
    topSkillGaps,
    topTrainingNeeds,
    recentActivity,
  };
}

export const useDashboardStats = (role: string | null) => {
  const { user } = useAuth();

  const { data: stats = null, isLoading: loading } = useQuery({
    queryKey: ['dashboard-stats', user?.id, role],
    queryFn: () => fetchDashboardStats(user!.id),
    enabled: !!user && !!role,
    staleTime: 1000 * 60 * 2,
  });

  return { stats, loading };
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
