import { useUserRole } from '@/hooks/useUserRole';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard, Users, Target, TrendingUp, BookOpen, Award, BarChart3, Settings,
  ClipboardCheck, Lightbulb, PlayCircle, CheckCircle2, ArrowRight, Building2, GraduationCap, ShieldCheck
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardStats } from '@/hooks/useDashboardStats';

const Dashboard = () => {
  const { role, loading: roleLoading } = useUserRole();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { stats, loading: statsLoading } = useDashboardStats(role);

  if (roleLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  const d = t.dashboard;

  const roleConfig = {
    admin: {
      title: d.adminDashboard,
      badge: d.administrator,
      icon: ShieldCheck,
      actions: [
        { title: d.userManagement, desc: d.manageUsersPerms, icon: Users, path: '/manage/users', variant: 'default' as const },
        { title: d.platformAnalytics, desc: d.viewMetrics, icon: BarChart3, path: '/workflow/track/analytics', variant: 'default' as const },
        { title: d.companyOverview, desc: d.monitorCompanies, icon: Building2, path: '/workflow/track/analytics', variant: 'secondary' as const },
        { title: t.common.settings, desc: d.configurePlatform, icon: Settings, path: '/manage/settings', variant: 'secondary' as const },
      ],
      stats: [
        { label: d.totalUsers, value: '1,284', icon: Users, trend: '+12%' },
        { label: d.activeCompanies, value: '47', icon: Building2, trend: '+5%' },
        { label: d.trainingPlans, value: '156', icon: Target, trend: '+18%' },
        { label: d.completionRate, value: '87%', icon: TrendingUp, trend: '+3%' },
      ]
    },
    hr_manager: {
      title: d.hrDashboard,
      badge: d.hrManager,
      icon: Target,
      actions: [
        { title: d.skillsAssessment, desc: d.startDiagnostic, icon: ClipboardCheck, path: '/workflow/assess/diagnostic', variant: 'default' as const },
        { title: d.buildTrainingPlan, desc: d.aiPlanGeneration, icon: Lightbulb, path: '/workflow/plan/builder', variant: 'default' as const },
        { title: d.trackProgress, desc: d.monitorTeam, icon: TrendingUp, path: '/workflow/track/analytics', variant: 'secondary' as const },
        { title: d.teamManagement, desc: d.manageTeam, icon: Users, path: '/manage/team', variant: 'secondary' as const },
      ],
      stats: [
        { label: d.teamMembers, value: '48', icon: Users, trend: '+4' },
        { label: d.activePlans, value: '12', icon: Target, trend: '+2' },
        { label: d.avgProgress, value: '72%', icon: TrendingUp, trend: '+8%' },
        { label: t.nav.certificates, value: '34', icon: Award, trend: '+6' },
      ]
    },
    trainer: {
      title: d.trainerDashboard,
      badge: d.trainer,
      icon: GraduationCap,
      actions: [
        { title: d.moduleStudio, desc: d.createContent, icon: BookOpen, path: '/workflow/execute/modules', variant: 'default' as const },
        { title: t.nav.courseMarketplace, desc: d.browseExisting, icon: PlayCircle, path: '/workflow/execute/marketplace', variant: 'default' as const },
        { title: d.studentProgress, desc: d.trackLearner, icon: BarChart3, path: '/workflow/track/progress', variant: 'secondary' as const },
        { title: t.nav.certificates, desc: d.issueCertificates, icon: Award, path: '/workflow/track/certificates', variant: 'secondary' as const },
      ],
      stats: [
        { label: d.activeCourses, value: '8', icon: BookOpen, trend: '+2' },
        { label: d.totalStudents, value: '124', icon: Users, trend: '+15' },
        { label: d.completionRate, value: '85%', icon: CheckCircle2, trend: '+5%' },
        { label: d.avgRating, value: '4.7', icon: Award, trend: '+0.2' },
      ]
    },
    employee: {
      title: d.learningDashboard,
      badge: d.employee,
      icon: GraduationCap,
      actions: [
        { title: d.myTraining, desc: d.viewAssigned, icon: BookOpen, path: '/workflow/execute/modules', variant: 'default' as const },
        { title: d.browseMarketplace, desc: d.exploreAvailable, icon: PlayCircle, path: '/workflow/execute/marketplace', variant: 'secondary' as const },
        { title: d.myProgress, desc: d.trackLearning, icon: TrendingUp, path: '/workflow/track/analytics', variant: 'secondary' as const },
        { title: t.nav.certificates, desc: d.viewCertificates, icon: Award, path: '/workflow/track/certificates', variant: 'secondary' as const },
      ],
      stats: [
        { label: d.assignedCourses, value: '5', icon: BookOpen, trend: '+1' },
        { label: d.inProgress, value: '3', icon: PlayCircle, trend: '0' },
        { label: d.completed, value: '12', icon: CheckCircle2, trend: '+2' },
        { label: t.nav.certificates, value: '8', icon: Award, trend: '+2' },
      ]
    }
  };

  const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.employee;
  const RoleIcon = config.icon;

  const workflowSteps = [
    { step: '1', title: t.nav.assess, desc: d.skillsNeeds, icon: ClipboardCheck, path: '/workflow/assess/diagnostic' },
    { step: '2', title: t.nav.plan, desc: d.trainingStrategy, icon: Lightbulb, path: '/workflow/plan/builder' },
    { step: '3', title: t.nav.execute, desc: d.createContentShort, icon: PlayCircle, path: '/workflow/execute/modules' },
    { step: '4', title: t.nav.trackCertify.split(' ')[0], desc: d.monitorResults, icon: BarChart3, path: '/workflow/track/analytics' },
  ];

  const activities = [
    { title: d.newDiagnosticCompleted, time: d.hoursAgo(2), type: 'success' },
    { title: d.planUpdated, time: d.hoursAgo(5), type: 'info' },
    { title: d.modulePublished, time: d.dayAgo, type: 'success' },
    { title: d.reviewScheduled, time: d.daysAgo(2), type: 'warning' },
  ];

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold tracking-tight text-foreground">{config.title}</h1>
            <Badge variant="secondary" className="text-sm">
              <RoleIcon className="w-3 h-3 mr-1" />
              {config.badge}
            </Badge>
          </div>
          <p className="text-muted-foreground">{d.welcomeBack}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {config.stats.map((stat) => {
          const StatIcon = stat.icon;
          return (
            <Card key={stat.label} className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-green-600">{stat.trend}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <StatIcon className="h-6 w-6 text-primary" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Workflow Steps */}
      {(role === 'hr_manager' || role === 'admin') && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5" />
            {d.trainingWorkflow}
          </h2>
          <div className="grid gap-4 md:grid-cols-4">
            {workflowSteps.map((workflow) => {
              const WorkflowIcon = workflow.icon;
              return (
                <Button key={workflow.step} variant="outline" className="h-auto p-4 flex flex-col items-start gap-2 hover:bg-primary/5" onClick={() => navigate(workflow.path)}>
                  <div className="flex items-center gap-2 w-full">
                    <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">{workflow.step}</div>
                    <WorkflowIcon className="h-4 w-4 ml-auto text-muted-foreground" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-foreground">{workflow.title}</p>
                    <p className="text-xs text-muted-foreground">{workflow.desc}</p>
                  </div>
                </Button>
              );
            })}
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">{d.quickActions}</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {config.actions.map((action) => {
            const ActionIcon = action.icon;
            return (
              <Card key={action.title} className="p-6 hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => navigate(action.path)}>
                <div className="space-y-3">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <ActionIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{action.title}</h3>
                    <p className="text-sm text-muted-foreground">{action.desc}</p>
                  </div>
                  <div className="flex items-center text-sm text-primary group-hover:translate-x-1 transition-transform">
                    {t.common.getStarted} <ArrowRight className="ml-1 h-4 w-4" />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">{d.recentActivity}</h2>
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
              <div className="flex items-center gap-3">
                <div className={`h-2 w-2 rounded-full ${
                  activity.type === 'success' ? 'bg-green-500' : 
                  activity.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                }`} />
                <p className="text-sm text-foreground">{activity.title}</p>
              </div>
              <span className="text-xs text-muted-foreground">{activity.time}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
