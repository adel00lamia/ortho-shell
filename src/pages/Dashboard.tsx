import { useState, useEffect } from 'react';
import { useUserRole } from '@/hooks/useUserRole';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  LayoutDashboard, Users, Target, TrendingUp, BookOpen, Award, BarChart3, Settings,
  ClipboardCheck, Lightbulb, PlayCircle, CheckCircle2, ArrowRight, Building2, GraduationCap, ShieldCheck, AlertCircle,
  SlidersHorizontal, RotateCcw, Eye, EyeOff, GripVertical, Sun, Moon, Sunset, Database, Loader2,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useCompanyProfile } from '@/hooks/useCompanyProfile';
import { useAuth } from '@/hooks/useAuth';
import { useDashboardLayout } from '@/hooks/useDashboardLayout';
import { useSeedDemoData } from '@/hooks/useSeedDemoData';
import { PROFILE_FIELDS } from '@/data/diagnosticConstants';
import { motion } from 'framer-motion';
import { FeatureErrorBoundary } from '@/components/error-boundaries/FeatureErrorBoundary';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.4, delay: i * 0.05, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
};

// PROFILE_FIELDS imported from diagnosticConstants

function getGreeting(fr: boolean): { text: string; icon: typeof Sun } {
  const hour = new Date().getHours();
  if (hour < 12) return { text: fr ? 'Bonjour' : 'Good morning', icon: Sun };
  if (hour < 18) return { text: fr ? 'Bon après-midi' : 'Good afternoon', icon: Sunset };
  return { text: fr ? 'Bonsoir' : 'Good evening', icon: Moon };
}

const Dashboard = () => {
  const { role, loading: roleLoading } = useUserRole();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { stats, loading: statsLoading } = useDashboardStats(role);
  const { companyId } = useCompanyId();
  const { context: companyContext } = useCompanyProfile();
  const { widgets, toggleWidget, moveWidget, resetLayout, isVisible } = useDashboardLayout();
  const { seedDemoData, isSeeding, progress: seedProgress } = useSeedDemoData();
  const [customizing, setCustomizing] = useState(false);

  const fr = language === 'fr';
  const greeting = getGreeting(fr);
  const GreetingIcon = greeting.icon;
  const firstName = user?.user_metadata?.first_name || '';

  // Derive profile completion from company context — no extra Supabase call
  const profileCompletion = (() => {
    if (!companyId) return { percent: 0, missing: PROFILE_FIELDS.map(f => f.label) };
    const company = companyContext?.company;
    if (!company) return { percent: 0, missing: PROFILE_FIELDS.map(f => f.label) };
    const missing: string[] = [];
    PROFILE_FIELDS.forEach(f => {
      if (!(company as any)[f.key] && !(company as any)[f.key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())]) {
        missing.push(f.label);
      }
    });
    const filled = PROFILE_FIELDS.length - missing.length;
    return { percent: Math.round((filled / PROFILE_FIELDS.length) * 100), missing };
  })();

  if (roleLoading || statsLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-48 rounded-xl" />
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
        { label: d.totalUsers, value: String(stats?.totalUsers || 0), icon: Users, trend: '' },
        { label: d.activeCompanies, value: String(stats?.activeCompanies || 0), icon: Building2, trend: '' },
        { label: d.trainingPlans, value: String(stats?.trainingPlans || 0), icon: Target, trend: '' },
        { label: d.completionRate, value: `${stats?.completionRate || 0}%`, icon: TrendingUp, trend: '' },
      ]
    },
    hr_manager: {
      title: d.hrDashboard,
      badge: d.hrManager,
      icon: Target,
      actions: [
        { title: d.skillsAssessment, desc: d.startDiagnostic, icon: ClipboardCheck, path: '/workflow/assess/skills', variant: 'default' as const },
        { title: d.buildTrainingPlan, desc: d.aiPlanGeneration, icon: Lightbulb, path: '/workflow/plan/builder', variant: 'default' as const },
        { title: d.trackProgress, desc: d.monitorTeam, icon: TrendingUp, path: '/workflow/track/analytics', variant: 'secondary' as const },
        { title: d.teamManagement, desc: d.manageTeam, icon: Users, path: '/manage/team', variant: 'secondary' as const },
      ],
      stats: [
        { label: d.teamMembers, value: String(stats?.totalEmployees || stats?.teamMembers || 0), icon: Users, trend: '' },
        { label: d.activePlans, value: String(stats?.activePlans || 0), icon: Target, trend: '' },
        { label: d.avgProgress, value: `${stats?.avgProgress || 0}%`, icon: TrendingUp, trend: '' },
        { label: fr ? 'Évaluations' : 'Evaluations', value: String(stats?.totalEvaluations || 0), icon: ClipboardCheck, trend: '' },
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
        { label: d.activeCourses, value: String(stats?.activeCourses || 0), icon: BookOpen, trend: '' },
        { label: d.totalStudents, value: String(stats?.totalStudents || 0), icon: Users, trend: '' },
        { label: d.completionRate, value: `${stats?.avgProgress || 0}%`, icon: CheckCircle2, trend: '' },
        { label: d.avgRating, value: '-', icon: Award, trend: '' },
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
        { label: d.assignedCourses, value: String(stats?.activeCourses || 0), icon: BookOpen, trend: '' },
        { label: d.inProgress, value: String(stats?.activePlans || 0), icon: PlayCircle, trend: '' },
        { label: d.completed, value: String(stats?.certificates || 0), icon: CheckCircle2, trend: '' },
        { label: t.nav.certificates, value: String(stats?.certificates || 0), icon: Award, trend: '' },
      ]
    }
  };

  const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.employee;
  const RoleIcon = config.icon;

  const workflowSteps = [
    { step: '1', title: t.nav.assess, desc: d.skillsNeeds, icon: ClipboardCheck, path: '/workflow/assess/skills', color: 'from-blue-500 to-cyan-400' },
    { step: '2', title: t.nav.plan, desc: d.trainingStrategy, icon: Lightbulb, path: '/workflow/plan/builder', color: 'from-purple-500 to-pink-400' },
    { step: '3', title: t.nav.execute, desc: d.createContentShort, icon: PlayCircle, path: '/workflow/execute/modules', color: 'from-orange-500 to-amber-400' },
    { step: '4', title: t.nav.trackCertify.split(' ')[0], desc: d.monitorResults, icon: BarChart3, path: '/workflow/track/analytics', color: 'from-green-500 to-emerald-400' },
  ];

  const activities = stats?.recentActivity?.length ? stats.recentActivity : [
    { title: d.newDiagnosticCompleted || 'No recent activity', time: '', type: 'info' as const },
  ];

  const STAT_COLORS = [
    'from-primary/20 to-primary/5',
    'from-accent/20 to-accent/5',
    'from-blue-500/20 to-blue-500/5',
    'from-amber-500/20 to-amber-500/5',
  ];

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header with personalized greeting */}
      <motion.div initial="hidden" animate="visible" variants={fadeIn} custom={0} className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground" style={{ fontFamily: 'Plus Jakarta Sans' }}>
              <span className="inline-flex items-center gap-2">
                <GreetingIcon className="h-7 w-7 text-amber-500" />
                {greeting.text}{firstName ? `, ${firstName}` : ''}
              </span>
            </h1>
            <Badge variant="secondary" className="text-sm hidden sm:flex">
              <RoleIcon className="w-3 h-3 mr-1" />
              {config.badge}
            </Badge>
          </div>
          <p className="text-muted-foreground">{d.welcomeBack}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setCustomizing(!customizing)} className="gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          {customizing ? (t.common.save) : (fr ? 'Personnaliser' : 'Customize')}
        </Button>
      </motion.div>

      {/* Customization Panel */}
      {customizing && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">{fr ? 'Gérer les sections' : 'Manage Sections'}</h3>
            <Button variant="ghost" size="sm" onClick={resetLayout} className="gap-1 text-xs">
              <RotateCcw className="h-3 w-3" />
              {fr ? 'Réinitialiser' : 'Reset'}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {widgets.map((w, i) => {
              const labels: Record<string, Record<string, string>> = {
                stats: { en: 'Statistics', fr: 'Statistiques' },
                profile: { en: 'Company Profile', fr: 'Profil entreprise' },
                workflow: { en: 'Workflow Steps', fr: 'Étapes du workflow' },
                actions: { en: 'Quick Actions', fr: 'Actions rapides' },
                activity: { en: 'Recent Activity', fr: 'Activité récente' },
              };
              const label = labels[w.id]?.[language] || w.id;
              return (
                <button
                  key={w.id}
                  onClick={() => toggleWidget(w.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                    w.visible
                      ? 'bg-primary/10 border-primary/30 text-foreground'
                      : 'bg-muted/50 border-border text-muted-foreground'
                  }`}
                >
                  {w.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                  {label}
                  {i > 0 && (
                    <span
                      className="cursor-grab hover:text-primary"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        if (i > 0) moveWidget(i, i - 1);
                      }}
                    >
                      <GripVertical className="h-3 w-3" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {/* Stats Grid — enhanced with gradient backgrounds */}
      {isVisible('stats') && <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {config.stats.map((stat, i) => {
          const StatIcon = stat.icon;
          return (
            <motion.div key={stat.label} initial="hidden" animate="visible" variants={fadeIn} custom={i + 1}>
              <Card className="p-6 hover:shadow-md transition-all group relative overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-br ${STAT_COLORS[i % STAT_COLORS.length]} opacity-50 group-hover:opacity-70 transition-opacity`} />
                <div className="relative flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-3xl font-bold text-foreground" style={{ fontFamily: 'Plus Jakarta Sans' }}>{stat.value}</p>
                    {stat.trend && <p className="text-xs text-primary">{stat.trend}</p>}
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-background/80 backdrop-blur-sm flex items-center justify-center shadow-sm">
                    <StatIcon className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>}

      {/* Profile Completion */}
      {(role === 'hr_manager' || role === 'admin' || role === 'employee') && (
        <motion.div initial="hidden" animate="visible" variants={fadeIn} custom={4.5}>
          <Card className="p-6 border-dashed border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Database className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="font-semibold text-foreground">{fr ? 'Charger des données démo' : 'Load Demo Data'}</h3>
                <p className="text-sm text-muted-foreground">
                  {fr
                    ? 'Créez une entreprise fictive complète (Atlas Industries Maroc) avec 15 employés, 7 départements, fiches de poste et évaluations pour tester toutes les fonctionnalités.'
                    : 'Create a complete fictitious company (Atlas Industries Maroc) with 15 employees, 7 departments, job descriptions, and evaluations to test all features.'}
                </p>
                {seedProgress && <p className="text-xs text-primary font-medium flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" />{seedProgress}</p>}
                <Button onClick={seedDemoData} disabled={isSeeding} className="mt-1">
                  {isSeeding ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{fr ? 'Chargement...' : 'Loading...'}</> : <><Database className="h-4 w-4 mr-2" />{fr ? 'Charger les données démo' : 'Load Demo Data'}</>}
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {isVisible('profile') && profileCompletion && profileCompletion.percent < 100 && companyId && (role === 'hr_manager' || role === 'admin') && (
        <motion.div initial="hidden" animate="visible" variants={fadeIn} custom={5}>
          <Card className="p-6 border-primary/20 bg-primary/5">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="font-semibold text-foreground">{d.profileCompletion}</h3>
                    <p className="text-sm text-muted-foreground">{d.completeProfile}</p>
                  </div>
                  <Button size="sm" onClick={() => navigate('/company-profile')}>
                    {d.completeNow} <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-3">
                  <Progress value={profileCompletion.percent} className="flex-1 h-2" />
                  <span className="text-sm font-semibold text-foreground whitespace-nowrap">{profileCompletion.percent}%</span>
                </div>
                {profileCompletion.missing.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {d.missingFields}
                    </span>
                    {profileCompletion.missing.slice(0, 4).map(field => (
                      <Badge key={field} variant="outline" className="text-xs">{(d as any)[field] || field}</Badge>
                    ))}
                    {profileCompletion.missing.length > 4 && (
                      <Badge variant="outline" className="text-xs">+{profileCompletion.missing.length - 4} {t.common.more}</Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {isVisible('profile') && profileCompletion && profileCompletion.percent === 100 && (role === 'hr_manager' || role === 'admin') && (
        <motion.div initial="hidden" animate="visible" variants={fadeIn} custom={5}>
          <Card className="p-4 border-green-500/20 bg-green-500/5">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-700">{d.profileComplete}</span>
              <Progress value={100} className="flex-1 h-2 max-w-[200px]" />
            </div>
          </Card>
        </motion.div>
      )}

      {/* Company Insights — HR/Admin only */}
      {isVisible('profile') && (role === 'hr_manager' || role === 'admin') && companyId && stats && (stats.totalEmployees > 0 || stats.totalEvaluations > 0) && (
        <motion.div initial="hidden" animate="visible" variants={fadeIn} custom={5.5}>
          <FeatureErrorBoundary featureName="Company Insights">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ fontFamily: 'Plus Jakarta Sans' }}>
              <BarChart3 className="h-5 w-5 text-primary" />
              {fr ? 'Aperçu Entreprise' : 'Company Insights'}
            </h2>
            <div className="grid gap-3 grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
              {[
                { label: fr ? 'Employés' : 'Employees', value: stats.totalEmployees, icon: Users },
                { label: fr ? 'Départements' : 'Departments', value: stats.totalDepartments, icon: Building2 },
                { label: fr ? 'Évaluations' : 'Evaluations', value: stats.totalEvaluations, icon: ClipboardCheck },
                { label: fr ? 'Fiches de poste' : 'Job Descriptions', value: stats.totalJDs, icon: Target },
                { label: fr ? 'Note moy.' : 'Avg Rating', value: stats.avgRating > 0 ? `${stats.avgRating}/5` : '-', icon: Award },
                { label: fr ? 'Postes critiques' : 'Critical Positions', value: stats.criticalPositions, icon: AlertCircle },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                    <Icon className="h-4 w-4 text-primary shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                      <p className="text-sm font-semibold text-foreground">{item.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            {(stats.topSkillGaps.length > 0 || stats.topTrainingNeeds.length > 0) && (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {stats.topSkillGaps.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">{fr ? 'Principaux gaps de compétences' : 'Top Skill Gaps'}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {stats.topSkillGaps.map((g, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{g}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {stats.topTrainingNeeds.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">{fr ? 'Besoins de formation prioritaires' : 'Top Training Needs'}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {stats.topTrainingNeeds.map((t, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">{t}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
          </FeatureErrorBoundary>
        </motion.div>
      )}

      {/* Workflow Steps */}
      {isVisible('workflow') && (role === 'hr_manager' || role === 'admin') && (
        <motion.div initial="hidden" animate="visible" variants={fadeIn} custom={6}>
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2" style={{ fontFamily: 'Plus Jakarta Sans' }}>
              <LayoutDashboard className="h-5 w-5 text-primary" />
              {d.trainingWorkflow}
            </h2>
            <div className="grid gap-4 md:grid-cols-4">
              {workflowSteps.map((workflow, i) => {
                const WorkflowIcon = workflow.icon;
                return (
                  <motion.div key={workflow.step} initial="hidden" animate="visible" variants={fadeIn} custom={7 + i}>
                    <Button variant="outline" className="h-auto p-4 flex flex-col items-start gap-3 hover:bg-primary/5 hover:border-primary/30 transition-all w-full" onClick={() => navigate(workflow.path)}>
                      <div className="flex items-center gap-2 w-full">
                        <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${workflow.color} text-white flex items-center justify-center text-sm font-bold`}>{workflow.step}</div>
                        <WorkflowIcon className="h-4 w-4 ml-auto text-muted-foreground" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-foreground">{workflow.title}</p>
                        <p className="text-xs text-muted-foreground">{workflow.desc}</p>
                      </div>
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Quick Actions */}
      {isVisible('actions') && <motion.div initial="hidden" animate="visible" variants={fadeIn} custom={11}>
        <h2 className="text-xl font-semibold mb-4" style={{ fontFamily: 'Plus Jakarta Sans' }}>{d.quickActions}</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {config.actions.map((action, i) => {
            const ActionIcon = action.icon;
            return (
              <motion.div key={action.title} initial="hidden" animate="visible" variants={fadeIn} custom={12 + i}>
                <Card className="p-6 hover:shadow-lg transition-all cursor-pointer group hover:border-primary/20" onClick={() => navigate(action.path)}>
                  <div className="space-y-3">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <ActionIcon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">{action.title}</h3>
                      <p className="text-sm text-muted-foreground">{action.desc}</p>
                    </div>
                    <div className="flex items-center text-sm text-primary font-medium group-hover:translate-x-1 transition-transform">
                      {t.common.getStarted} <ArrowRight className="ml-1 h-4 w-4" />
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </motion.div>}

      {/* Recent Activity */}
      {isVisible('activity') && <motion.div initial="hidden" animate="visible" variants={fadeIn} custom={16}>
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4" style={{ fontFamily: 'Plus Jakarta Sans' }}>{d.recentActivity}</h2>
          <div className="space-y-1">
            {activities.map((activity, index) => (
              <div key={index} className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-muted/50 transition-colors border-b last:border-0 border-border/50">
                <div className="flex items-center gap-3">
                  <div className={`h-2.5 w-2.5 rounded-full ${
                    activity.type === 'success' ? 'bg-green-500' : 
                    activity.type === 'warning' ? 'bg-amber-500' : 'bg-primary'
                  }`} />
                  <p className="text-sm text-foreground">{activity.title}</p>
                </div>
                <span className="text-xs text-muted-foreground">{activity.time}</span>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>}
    </div>
  );
};

export default Dashboard;
