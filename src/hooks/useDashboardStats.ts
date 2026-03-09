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
  recentActivity: {
    title: string;
    time: string;
    type: 'success' | 'info' | 'warning';
  }[];
}

async function fetchDashboardStats(userId: string): Promise<DashboardStats> {
  // Fetch profile to get company_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', userId)
    .maybeSingle();

  const companyId = profile?.company_id;

  // Fetch training plans count
  let plansQuery = supabase.from('training_plans').select('id, status, modules', { count: 'exact' });
  if (companyId) plansQuery = plansQuery.eq('company_id', companyId);
  const { data: plans, count: plansCount } = await plansQuery;

  const activePlans = plans?.filter(p => p.status === 'active').length || 0;
  const completedPlans = plans?.filter(p => p.status === 'completed').length || 0;
  const totalPlans = plansCount || 0;
  const completionRate = totalPlans > 0 ? Math.round((completedPlans / totalPlans) * 100) : 0;

  // Fetch training modules count
  const modulesQuery = supabase.from('training_modules').select('id, completed', { count: 'exact' });
  const { data: modules, count: modulesCount } = await modulesQuery;
  const completedModules = modules?.filter(m => m.completed).length || 0;

  // Fetch team members (profiles in same company)
  let teamCount = 0;
  if (companyId) {
    const { count } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId);
    teamCount = count || 0;
  }

  // Fetch evaluations for recent activity
  let evalsQuery = supabase.from('performance_evaluations').select('id, employee_name, evaluation_date, created_at');
  if (companyId) evalsQuery = evalsQuery.eq('company_id', companyId);
  const { data: evals } = await evalsQuery.order('created_at', { ascending: false }).limit(4);

  // Build recent activity from real data
  type ActivityType = 'success' | 'info' | 'warning';
  const recentActivity: { title: string; time: string; type: ActivityType }[] = (evals || []).map(ev => ({
    title: `Evaluation: ${ev.employee_name}`,
    time: ev.created_at ? formatTimeAgo(new Date(ev.created_at)) : '',
    type: 'success' as ActivityType,
  }));

  if (plans && recentActivity.length < 4) {
    const recentPlans = plans.slice(0, 4 - recentActivity.length);
    recentPlans.forEach(() => {
      recentActivity.push({
        title: 'Plan de formation cree',
        time: '',
        type: 'info' as ActivityType,
      });
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
