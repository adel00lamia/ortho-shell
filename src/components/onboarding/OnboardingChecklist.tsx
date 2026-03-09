import { useState, useEffect } from 'react';
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
} from 'lucide-react';

interface Step {
  id: string;
  label: string;
  labelFr: string;
  description: string;
  descriptionFr: string;
  icon: React.ElementType;
  path: string;
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

  const steps: Step[] = [
    {
      id: 'company',
      label: 'Set up company profile',
      labelFr: 'Configurer le profil entreprise',
      description: 'Add your company details, CNSS, and industry',
      descriptionFr: 'Ajoutez les details de votre entreprise, CNSS, et secteur',
      icon: Building2,
      path: '/company-profile',
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
      descriptionFr: 'Creez des fiches de poste et evaluez les competences',
      icon: ClipboardCheck,
      path: '/workflow/assess/diagnostic',
      checkFn: async () => {
        if (!companyId) return false;
        const { count } = await supabase.from('job_descriptions').select('id', { count: 'exact', head: true }).eq('company_id', companyId);
        return (count || 0) > 0;
      },
    },
    {
      id: 'plan',
      label: 'Generate a training plan',
      labelFr: 'Generer un plan de formation',
      description: 'Use AI to build your annual training plan',
      descriptionFr: 'Utilisez l\'IA pour creer votre plan de formation annuel',
      icon: Lightbulb,
      path: '/workflow/plan/builder',
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
      descriptionFr: 'Ajoutez des responsables RH et formateurs a votre equipe',
      icon: Users,
      path: '/manage/users',
      checkFn: async () => {
        if (!companyId) return false;
        const { count } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('company_id', companyId);
        return (count || 0) > 1;
      },
    },
    {
      id: 'billing',
      label: 'Choose a plan',
      labelFr: 'Choisir un abonnement',
      description: 'Start your 14-day free trial',
      descriptionFr: 'Commencez votre essai gratuit de 14 jours',
      icon: CreditCard,
      path: '/pricing',
      checkFn: async () => {
        if (!user) return false;
        const { data } = await supabase.from('subscriptions').select('id').eq('user_id', user.id).in('status', ['trialing', 'active']).limit(1).maybeSingle();
        return !!data;
      },
    },
  ];

  useEffect(() => {
    const dismissKey = `onboarding_dismissed_${user?.id}`;
    if (localStorage.getItem(dismissKey)) {
      setDismissed(true);
      setChecking(false);
      return;
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
  }, [user, companyId]);

  if (dismissed || checking || !user) return null;

  const percent = Math.round((completedSteps.length / steps.length) * 100);
  const fr = language === 'fr';

  const handleDismiss = () => {
    localStorage.setItem(`onboarding_dismissed_${user.id}`, 'true');
    setDismissed(true);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80">
      <Card className="shadow-lg border-primary/20">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">
              {fr ? 'Demarrage rapide' : 'Quick Start'}
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
                const Icon = step.icon;
                const done = completedSteps.includes(step.id);
                return (
                  <button
                    key={step.id}
                    onClick={() => !done && navigate(step.path)}
                    className={`flex items-start gap-3 w-full text-left p-2 rounded-lg transition-colors ${
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
                        {fr ? step.labelFr : step.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {fr ? step.descriptionFr : step.description}
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
