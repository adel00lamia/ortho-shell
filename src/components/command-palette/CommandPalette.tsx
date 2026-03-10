import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command';
import {
  LayoutDashboard,
  ClipboardCheck,
  FileText,
  TrendingUp,
  Lightbulb,
  Target,
  BookOpen,
  ShoppingBag,
  BarChart3,
  Award,
  Users,
  Settings,
  Building2,
} from 'lucide-react';

interface CommandRoute {
  path: string;
  label: string;
  icon: React.ElementType;
  keywords: string[];
  group: string;
}

export const CommandPalette = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const routes: CommandRoute[] = [
    { path: '/dashboard', label: t.nav.dashboard, icon: LayoutDashboard, keywords: ['home', 'accueil', 'tableau'], group: 'Navigation' },
    { path: '/company-profile', label: t.nav.companyProfile, icon: Building2, keywords: ['company', 'entreprise', 'profil'], group: 'Navigation' },
    { path: '/workflow/assess/diagnostic', label: t.nav.skillsDiagnostic, icon: ClipboardCheck, keywords: ['diagnostic', 'skills', 'competences', 'assess'], group: 'Assess' },
    { path: '/workflow/assess/performance', label: t.nav.performanceReview, icon: FileText, keywords: ['performance', 'evaluation', 'review'], group: 'Assess' },
    { path: '/workflow/assess/benchmark', label: t.nav.industryBenchmark, icon: TrendingUp, keywords: ['benchmark', 'industry', 'compare'], group: 'Assess' },
    { path: '/workflow/plan/builder', label: t.nav.aiPlanBuilder, icon: Lightbulb, keywords: ['plan', 'ai', 'builder', 'generate', 'create'], group: 'Plan' },
    { path: '/workflow/plan/plans', label: t.nav.myPlans, icon: Target, keywords: ['plans', 'training', 'formation'], group: 'Plan' },
    { path: '/workflow/execute/modules', label: t.nav.moduleStudio, icon: BookOpen, keywords: ['module', 'studio', 'create', 'content'], group: 'Execute' },
    { path: '/workflow/execute/marketplace', label: t.nav.courseMarketplace, icon: ShoppingBag, keywords: ['marketplace', 'courses', 'shop'], group: 'Execute' },
    { path: '/workflow/track/analytics', label: t.nav.analyticsROI, icon: BarChart3, keywords: ['analytics', 'roi', 'stats', 'reports'], group: 'Track' },
    { path: '/workflow/track/certificates', label: t.nav.certificates, icon: Award, keywords: ['certificate', 'certificat', 'award'], group: 'Track' },
    { path: '/workflow/track/reimbursement', label: t.nav.ofpptReimbursement, icon: FileText, keywords: ['ofppt', 'reimbursement', 'remboursement'], group: 'Track' },
    { path: '/manage/users', label: t.nav.userManagement, icon: Users, keywords: ['users', 'utilisateurs', 'manage', 'admin'], group: 'Management' },
    { path: '/manage/settings', label: t.common.settings, icon: Settings, keywords: ['settings', 'parametres', 'config'], group: 'Management' },
    { path: '/billing', label: 'Billing', icon: FileText, keywords: ['billing', 'facturation', 'subscription', 'payment'], group: 'Management' },
    { path: '/referrals', label: 'Referrals', icon: FileText, keywords: ['referral', 'parrainage', 'invite', 'reward'], group: 'Management' },
  ];

  const handleSelect = useCallback(
    (path: string) => {
      setOpen(false);
      navigate(path);
    },
    [navigate]
  );

  const groups = [...new Set(routes.map((r) => r.group))];

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search pages... (Ctrl+K)" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {groups.map((group, idx) => (
          <div key={group}>
            {idx > 0 && <CommandSeparator />}
            <CommandGroup heading={group}>
              {routes
                .filter((r) => r.group === group)
                .map((route) => {
                  const Icon = route.icon;
                  return (
                    <CommandItem
                      key={route.path}
                      value={`${route.label} ${route.keywords.join(' ')}`}
                      onSelect={() => handleSelect(route.path)}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      <span>{route.label}</span>
                    </CommandItem>
                  );
                })}
            </CommandGroup>
          </div>
        ))}
      </CommandList>
    </CommandDialog>
  );
};
