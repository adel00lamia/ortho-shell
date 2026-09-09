import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Building2,
  ClipboardCheck,
  Lightbulb,
  Users,
  CreditCard,
  CheckCircle2,
  Circle,
  X,
  ChevronUp,
  ChevronDown,
  BookOpen,
  ShoppingBag,
  GraduationCap,
} from 'lucide-react';

interface Step {
  id: string;
  label: string;
  labelFr: string;
  description: string;
  descriptionFr: string;
  icon: React.ElementType;
  path: string;
  roles?: string[];
  checkFn: () => Promise<boolean>;
}

export const OnboardingChecklist = () => {
  const { user } = useAuth();
  const { companyId } = useCompanyId();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);

  const allSteps: Step[] = [
    {
      id: 'company',
      label: 'Set up company profile',
      labelFr: 'Configurer le profil entreprise',
      description: 'Add your company details, CNSS, and industry',
      descriptionFr: 'Ajoutez les détails de votre entreprise, CNSS, et secteur',
      icon: Building2,
      path: '/company-profile',
      roles: ['admin', 'hr_manager'],
      checkFn: async () => {
        if (!companyId) return false;
        const { data } = await supabase.from('companies').select('name, industry').eq('id', companyId).single();
        return !!(data?.name && data?.industry);
      },
    },
    {
      id: 'diagnostic',
      label: 'Run first diagnostic',
      labelFr: 'Lancer le premier diagnostic',
      description: 'Create job descriptions and evaluate skills',
      descriptionFr: 'Créez des fiches de poste et évaluez les compétences',
      icon: ClipboardCheck,
      path: '/workflow/assess/workforce',
      roles: ['admin', 'hr_manager'],
      checkFn: async () => {
        if (!companyId) return false;
        const { count } = await supabase.from('job_descriptions').select('id', { count: 'exact', head: true }).eq('company_id', companyId);
        return (count || 0) > 0;
      },
    },
    {
      id: 'plan',
      label: 'Generate a training plan',
      labelFr: 'Générer un plan de formation',
      description: 'Use AI to build your annual training plan',
      descriptionFr: 'Utilisez l\'IA pour créer votre plan de formation annuel',
      icon: Lightbulb,
      path: '/workflow/plan/builder',
      roles: ['admin', 'hr_manager'],
      checkFn: async () => {
        if (!companyId) return false;
        const { count } = await supabase.from('training_plans').select('id', { count: 'exact', head: true }).eq('company_id', companyId);
        return (count || 0) > 0;
      },
    },
    {
      id: 'team',
      label: 'Invite team members',
      labelFr: 'Inviter des membres',
      description: 'Add HR managers and trainers to your team',
      descriptionFr: 'Ajoutez des responsables RH et formateurs à votre équipe',
      icon: Users,
      path: '/manage/users',
      roles: ['admin', 'hr_manager'],
      checkFn: async () => {
        if (!companyId) return false;
        const { count } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('company_id', companyId);
        return (count || 0) > 1;
      },
    },
    {
      id: 'first_module',
      label: 'Create your first module',
      labelFr: 'Créer votre premier module',
      description: 'Build training content for your team',
      descriptionFr: 'Créez du contenu de formation pour votre équipe',
      icon: BookOpen,
      path: '/workflow/execute/modules',
      roles: ['trainer'],
      checkFn: async () => {
        if (!user) return false;
        const { count } = await supabase.from('training_modules').select('id', { count: 'exact', head: true }).eq('created_by', user.id);
        return (count || 0) > 0;
      },
    },
    {
      id: 'explore_courses',
      label: 'Explore available courses',
      labelFr: 'Explorer les cours disponibles',
      description: 'Browse and start learning',
      descriptionFr: 'Parcourez et commencez à apprendre',
      icon: ShoppingBag,
      path: '/workflow/execute/marketplace',
      roles: ['employee'],
      checkFn: async () => false, // Always show as todo
    },
    {
      id: 'billing',
      label: 'Choose a plan',
      labelFr: 'Choisir un abonnement',
      description: 'Start your 14-day free trial',
      descriptionFr: 'Commencez votre essai gratuit de 14 jours',
      icon: CreditCard,
      path: '/pricing',
      roles: ['admin', 'hr_manager'],
      checkFn: async () => {
        if (!user) return false;
        const { data } = await supabase.from('subscriptions').select('id').eq('user_id', user.id).in('status', ['trialing', 'active']).limit(1).maybeSingle();
        return !!data;
      },
    },
  ];

  // Get user role from localStorage cache or default
  const userRole = localStorage.getItem('user_role') || 'employee';
  const steps = useMemo(
    () => allSteps.filter(s => !s.roles || s.roles.includes(userRole)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userRole, companyId, user]
  );

  useEffect(() => {
    const dismissKey = `onboarding_dismissed_${user?.id}`;
    if (localStorage.getItem(dismissKey)) {
      setDismissed(true);
      setChecking(false);
      return;
    }

    // Show welcome modal on very first login
    const welcomeKey = `welcome_shown_${user?.id}`;
    if (user && !localStorage.getItem(welcomeKey)) {
      setShowWelcome(true);
      localStorage.setItem(welcomeKey, 'true');
    }

    const checkSteps = async () => {
      const completed: string[] = [];
      for (const step of steps) {
        try {
          if (await step.checkFn()) completed.push(step.id);
        } catch {}
      }
      setCompletedSteps(completed);
      if (completed.length === steps.length) setDismissed(true);
      setChecking(false);
    };

    if (user) checkSteps();
    else setChecking(false);
  }, [user, companyId, steps]);

  if (checking || !user) return null;

  const percent = Math.round((completedSteps.length / steps.length) * 100);
  const fr = language === 'fr';

  const getStepLabel = (step: Step) => fr ? step.labelFr : step.label;
  const getStepDesc = (step: Step) => fr ? step.descriptionFr : step.description;

  const handleDismiss = () => {
    localStorage.setItem(`onboarding_dismissed_${user.id}`, 'true');
    setDismissed(true);
  };

  const welcomeTitle = fr ? 'Bienvenue sur Qimatak !' : 'Welcome to Qimatak!';
  const welcomeDesc = fr
    ? 'Votre plateforme intelligente de gestion de formation. Suivez les étapes pour commencer.'
    : 'Your intelligent training management platform. Follow the steps to get started.';
  const welcomeBtn = fr ? 'C\'est parti' : 'Let\'s go';

  // Welcome modal
  if (showWelcome) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <Card className="w-full max-w-md mx-4 p-8 text-center space-y-6">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <GraduationCap className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">{welcomeTitle}</h2>
            <p className="text-muted-foreground">{welcomeDesc}</p>
          </div>
          <Button size="lg" onClick={() => setShowWelcome(false)} className="w-full">
            {welcomeBtn}
          </Button>
        </Card>
      </div>
    );
  }

  if (dismissed) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80">
      <Card className="shadow-lg border-primary/20">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">
              {fr ? 'Démarrage rapide' : 'Quick Start'}
            </span>
            <span className="text-xs text-muted-foreground">
              {completedSteps.length}/{steps.length}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setCollapsed(!collapsed)}>
              {collapsed ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleDismiss}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {!collapsed && (
          <div className="p-4 space-y-3">
            <Progress value={percent} className="h-2" />

            <div className="space-y-2">
              {steps.map((step) => {
                const done = completedSteps.includes(step.id);
                return (
                  <button
                    key={step.id}
                    onClick={() => !done && navigate(step.path)}
                    className={`flex items-start gap-3 w-full text-start p-2 rounded-lg transition-colors ${
                      done ? 'opacity-60' : 'hover:bg-muted/50 cursor-pointer'
                    }`}
                    disabled={done}
                  >
                    {done ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                    )}
                    <div>
                      <p className={`text-sm font-medium ${done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        {getStepLabel(step)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {getStepDesc(step)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
