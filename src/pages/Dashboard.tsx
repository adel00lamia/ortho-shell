import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard, 
  Users, 
  Target, 
  TrendingUp,
  BookOpen,
  Award,
  BarChart3,
  Settings,
  ClipboardCheck,
  Lightbulb,
  PlayCircle,
  CheckCircle2,
  ArrowRight,
  Building2,
  GraduationCap,
  ShieldCheck
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const Dashboard = () => {
  // AUTHENTICATION TEMPORARILY DISABLED FOR DEVELOPMENT
  // const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();

  // useEffect(() => {
  //   if (!authLoading && !user) {
  //     navigate('/auth', { replace: true });
  //   }
  // }, [user, authLoading, navigate]);

  if (roleLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const roleConfig = {
    admin: {
      title: 'Admin Dashboard',
      badge: 'Administrator',
      icon: ShieldCheck,
      actions: [
        { title: 'User Management', desc: 'Manage users and permissions', icon: Users, path: '/manage/users', variant: 'default' as const },
        { title: 'Platform Analytics', desc: 'View system-wide metrics', icon: BarChart3, path: '/workflow/track/analytics', variant: 'default' as const },
        { title: 'Company Overview', desc: 'Monitor all companies', icon: Building2, path: '/manage/companies', variant: 'secondary' as const },
        { title: 'Settings', desc: 'Configure platform', icon: Settings, path: '/manage/settings', variant: 'secondary' as const },
      ],
      stats: [
        { label: 'Total Users', value: '1,284', icon: Users, trend: '+12%' },
        { label: 'Active Companies', value: '47', icon: Building2, trend: '+5%' },
        { label: 'Training Plans', value: '156', icon: Target, trend: '+18%' },
        { label: 'Completion Rate', value: '87%', icon: TrendingUp, trend: '+3%' },
      ]
    },
    hr_manager: {
      title: 'HR Manager Dashboard',
      badge: 'HR Manager',
      icon: Target,
      actions: [
        { title: 'Skills Assessment', desc: 'Start new diagnostic', icon: ClipboardCheck, path: '/workflow/assess/diagnostic', variant: 'default' as const },
        { title: 'Build Training Plan', desc: 'AI-powered plan generation', icon: Lightbulb, path: '/workflow/plan/builder', variant: 'default' as const },
        { title: 'Track Progress', desc: 'Monitor team performance', icon: TrendingUp, path: '/workflow/track/analytics', variant: 'secondary' as const },
        { title: 'Team Management', desc: 'Manage your team', icon: Users, path: '/manage/team', variant: 'secondary' as const },
      ],
      stats: [
        { label: 'Team Members', value: '48', icon: Users, trend: '+4' },
        { label: 'Active Plans', value: '12', icon: Target, trend: '+2' },
        { label: 'Avg Progress', value: '72%', icon: TrendingUp, trend: '+8%' },
        { label: 'Certificates', value: '34', icon: Award, trend: '+6' },
      ]
    },
    trainer: {
      title: 'Trainer Dashboard',
      badge: 'Trainer',
      icon: GraduationCap,
      actions: [
        { title: 'Module Studio', desc: 'Create training content', icon: BookOpen, path: '/workflow/execute/modules', variant: 'default' as const },
        { title: 'Course Marketplace', desc: 'Browse existing courses', icon: PlayCircle, path: '/workflow/execute/marketplace', variant: 'default' as const },
        { title: 'Student Progress', desc: 'Track learner performance', icon: BarChart3, path: '/workflow/track/progress', variant: 'secondary' as const },
        { title: 'Certificates', desc: 'Issue certificates', icon: Award, path: '/workflow/track/certificates', variant: 'secondary' as const },
      ],
      stats: [
        { label: 'Active Courses', value: '8', icon: BookOpen, trend: '+2' },
        { label: 'Total Students', value: '124', icon: Users, trend: '+15' },
        { label: 'Completion Rate', value: '85%', icon: CheckCircle2, trend: '+5%' },
        { label: 'Avg Rating', value: '4.7', icon: Award, trend: '+0.2' },
      ]
    },
    employee: {
      title: 'My Learning Dashboard',
      badge: 'Employee',
      icon: GraduationCap,
      actions: [
        { title: 'My Training', desc: 'View assigned courses', icon: BookOpen, path: '/workflow/execute/my-courses', variant: 'default' as const },
        { title: 'Browse Marketplace', desc: 'Explore available courses', icon: PlayCircle, path: '/workflow/execute/marketplace', variant: 'secondary' as const },
        { title: 'My Progress', desc: 'Track your learning', icon: TrendingUp, path: '/workflow/track/my-progress', variant: 'secondary' as const },
        { title: 'Certificates', desc: 'View earned certificates', icon: Award, path: '/workflow/track/certificates', variant: 'secondary' as const },
      ],
      stats: [
        { label: 'Assigned Courses', value: '5', icon: BookOpen, trend: '+1' },
        { label: 'In Progress', value: '3', icon: PlayCircle, trend: '0' },
        { label: 'Completed', value: '12', icon: CheckCircle2, trend: '+2' },
        { label: 'Certificates', value: '8', icon: Award, trend: '+2' },
      ]
    }
  };

  const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.employee;
  const RoleIcon = config.icon;

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              {config.title}
            </h1>
            <Badge variant="secondary" className="text-sm">
              <RoleIcon className="w-3 h-3 mr-1" />
              {config.badge}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening with your training.
          </p>
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
            Training Workflow
          </h2>
          <div className="grid gap-4 md:grid-cols-4">
            {[
              { step: '1', title: 'Assess', desc: 'Skills & needs', icon: ClipboardCheck, path: '/workflow/assess/diagnostic' },
              { step: '2', title: 'Plan', desc: 'Training strategy', icon: Lightbulb, path: '/workflow/plan/builder' },
              { step: '3', title: 'Execute', desc: 'Create content', icon: PlayCircle, path: '/workflow/execute/modules' },
              { step: '4', title: 'Track', desc: 'Monitor results', icon: BarChart3, path: '/workflow/track/analytics' },
            ].map((workflow) => {
              const WorkflowIcon = workflow.icon;
              return (
                <Button
                  key={workflow.step}
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-start gap-2 hover:bg-primary/5"
                  onClick={() => navigate(workflow.path)}
                >
                  <div className="flex items-center gap-2 w-full">
                    <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                      {workflow.step}
                    </div>
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
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
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
                    Get started <ArrowRight className="ml-1 h-4 w-4" />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {[
            { title: 'New diagnostic completed', time: '2 hours ago', type: 'success' },
            { title: 'Training plan "Leadership Skills" updated', time: '5 hours ago', type: 'info' },
            { title: 'Module "Communication Basics" published', time: '1 day ago', type: 'success' },
            { title: 'Performance review scheduled', time: '2 days ago', type: 'warning' },
          ].map((activity, index) => (
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
