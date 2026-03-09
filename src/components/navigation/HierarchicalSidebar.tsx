import { NavLink } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole, type UserRole } from '@/hooks/useUserRole';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard, ClipboardCheck, Target, TrendingUp, Lightbulb, BookOpen,
  PlayCircle, BarChart3, Award, Users, Settings, LogOut, ChevronDown,
  ShoppingBag, FileText, Building2, UserCog, Languages, Gauge, ShieldCheck,
  GraduationCap,
} from 'lucide-react';
import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';

interface NavItem {
  path: string;
  labelKey: string;
  icon: any;
  badge?: string;
  roles?: string[];
}

interface NavSection {
  titleKey: string;
  items: NavItem[];
  roles?: string[];
}

// Role shell configurations
const SHELL_CONFIG: Record<string, { icon: any; color: string; label: string; labelFr: string }> = {
  admin: { icon: ShieldCheck, color: 'from-red-500 to-orange-500', label: 'Admin', labelFr: 'Admin' },
  hr_manager: { icon: Target, color: 'from-blue-500 to-cyan-500', label: 'HR Manager', labelFr: 'Resp. RH' },
  trainer: { icon: GraduationCap, color: 'from-purple-500 to-pink-500', label: 'Trainer', labelFr: 'Formateur' },
  employee: { icon: BookOpen, color: 'from-green-500 to-emerald-500', label: 'Learner', labelFr: 'Apprenant' },
};

export const HierarchicalSidebar = () => {
  const { signOut } = useAuth();
  const { role } = useUserRole();
  const { t, language, setLanguage } = useLanguage();
  const [openSections, setOpenSections] = useState<string[]>(['workflow', 'assess']);

  const toggleSection = (section: string) => {
    setOpenSections((prev) =>
      prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]
    );
  };

  const shell = SHELL_CONFIG[role || 'employee'];
  const ShellIcon = shell.icon;
  const shellLabel = language === 'fr' ? shell.labelFr : shell.label;

  // Role-specific navigation structures
  const getNavSections = (): NavSection[] => {
    if (role === 'employee') {
      return [
        {
          titleKey: 'execute',
          items: [
            { path: '/workflow/execute/modules', labelKey: 'moduleStudio', icon: BookOpen },
            { path: '/workflow/execute/marketplace', labelKey: 'courseMarketplace', icon: ShoppingBag },
          ],
        },
        {
          titleKey: 'trackCertify',
          items: [
            { path: '/workflow/track/analytics', labelKey: 'progressTracking', icon: TrendingUp },
            { path: '/workflow/track/certificates', labelKey: 'certificates', icon: Award },
          ],
        },
      ];
    }

    if (role === 'trainer') {
      return [
        {
          titleKey: 'execute',
          items: [
            { path: '/workflow/execute/modules', labelKey: 'moduleStudio', icon: BookOpen },
            { path: '/workflow/execute/marketplace', labelKey: 'courseMarketplace', icon: ShoppingBag },
          ],
        },
        {
          titleKey: 'trackCertify',
          items: [
            { path: '/workflow/track/analytics', labelKey: 'analyticsROI', icon: BarChart3 },
            { path: '/workflow/track/certificates', labelKey: 'certificates', icon: Award },
          ],
        },
      ];
    }

    // admin / hr_manager — full navigation
    return [
      {
        titleKey: 'assess',
        items: [
          { path: '/company-profile', labelKey: 'companyProfile', icon: Building2 },
          { path: '/workflow/assess/diagnostic', labelKey: 'skillsDiagnostic', icon: ClipboardCheck },
          { path: '/workflow/assess/performance', labelKey: 'performanceReview', icon: FileText },
          { path: '/workflow/assess/benchmark', labelKey: 'industryBenchmark', icon: TrendingUp },
        ],
      },
      {
        titleKey: 'plan',
        items: [
          { path: '/workflow/plan/builder', labelKey: 'aiPlanBuilder', icon: Lightbulb, badge: 'AI' },
          { path: '/workflow/plan/plans', labelKey: 'myPlans', icon: Target },
        ],
      },
      {
        titleKey: 'execute',
        items: [
          { path: '/workflow/execute/modules', labelKey: 'moduleStudio', icon: BookOpen },
          { path: '/workflow/execute/marketplace', labelKey: 'courseMarketplace', icon: ShoppingBag },
        ],
      },
      {
        titleKey: 'trackCertify',
        items: [
          { path: '/manager', labelKey: 'managerDashboard', icon: Gauge },
          { path: '/workflow/track/analytics', labelKey: 'analyticsROI', icon: BarChart3 },
          { path: '/workflow/track/progress', labelKey: 'progressTracking', icon: TrendingUp },
          { path: '/workflow/track/certificates', labelKey: 'certificates', icon: Award },
          { path: '/workflow/track/reimbursement', labelKey: 'ofpptReimbursement', icon: FileText },
        ],
      },
    ];
  };

  const getManagementItems = (): NavItem[] => {
    if (role === 'admin') {
      return [
        { path: '/manage/users', labelKey: 'userManagement', icon: Users },
        { path: '/manage/team', labelKey: 'teamCollaboration', icon: Building2 },
        { path: '/manage/settings', labelKey: 'settings', icon: Settings },
      ];
    }
    if (role === 'hr_manager') {
      return [
        { path: '/manage/team', labelKey: 'teamCollaboration', icon: Building2 },
        { path: '/manage/settings', labelKey: 'settings', icon: Settings },
      ];
    }
    // trainer + employee just get settings
    return [
      { path: '/manage/settings', labelKey: 'settings', icon: Settings },
    ];
  };

  const navSections = getNavSections();
  const managementItems = getManagementItems();

  const getSectionTitle = (key: string) => {
    const map: Record<string, string> = {
      assess: t.nav.assess,
      plan: t.nav.plan,
      execute: t.nav.execute,
      trackCertify: t.nav.trackCertify,
      management: t.nav.management,
    };
    return map[key] || key;
  };

  const getItemLabel = (key: string) => (t.nav as any)[key] || key;

  return (
    <aside className="w-64 h-screen bg-sidebar border-r border-sidebar-border flex flex-col overflow-y-auto sticky top-0">
      {/* Header with role shell indicator */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">TP</span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-sidebar-foreground text-sm truncate">TrainPro Academy</h2>
            <div className="flex items-center gap-1.5">
              <div className={`h-2 w-2 rounded-full bg-gradient-to-r ${shell.color}`} />
              <span className="text-xs text-sidebar-foreground/60 truncate">{shellLabel}</span>
            </div>
          </div>
          <NotificationCenter />
        </div>
      </div>

      {/* Search hint */}
      <div className="px-4 py-2">
        <button
          onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}
          className="flex items-center gap-2 w-full px-3 py-2 text-xs text-sidebar-foreground/50 bg-sidebar-accent/30 rounded-lg hover:bg-sidebar-accent/50 transition-colors"
        >
          <span>{t.common.search}...</span>
          <kbd className="ml-auto text-[10px] bg-sidebar-accent px-1.5 py-0.5 rounded font-mono">Ctrl+K</kbd>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1">
        {/* Dashboard */}
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              isActive
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
            }`
          }
        >
          <LayoutDashboard className="h-4 w-4" />
          <span className="text-sm font-medium">{t.nav.dashboard}</span>
        </NavLink>

        <div className="pt-3">
          <p className="px-3 text-xs font-semibold text-sidebar-foreground/60 mb-2">{t.nav.workflow}</p>

          {navSections.map((section) => {
            const sectionId = section.titleKey.toLowerCase();

            return (
              <Collapsible
                key={section.titleKey}
                open={openSections.includes(sectionId)}
                onOpenChange={() => toggleSection(sectionId)}
              >
                <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/50 rounded-lg transition-colors">
                  <span>{getSectionTitle(section.titleKey)}</span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                      openSections.includes(sectionId) ? 'rotate-180' : ''
                    }`}
                  />
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-0.5 pl-3 mt-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                          `flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                            isActive
                              ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                              : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                          }`
                        }
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="h-4 w-4" />
                          <span>{getItemLabel(item.labelKey)}</span>
                        </div>
                        {item.badge && (
                          <Badge variant="secondary" className="text-xs">
                            {item.badge}
                          </Badge>
                        )}
                      </NavLink>
                    );
                  })}
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>

        {/* Management Section */}
        <div className="pt-3">
          <p className="px-3 text-xs font-semibold text-sidebar-foreground/60 mb-2">{getSectionTitle('management')}</p>
          {managementItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                <span>{getItemLabel(item.labelKey)}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border space-y-1">
        {/* Language Selector */}
        <div className="flex items-center gap-2 px-3 py-2">
          <Languages className="h-4 w-4 text-sidebar-foreground/60" />
          <div className="flex gap-1">
            {(['fr', 'en'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  language === lang
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                }`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <NavLink
          to="/profile"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
        >
          <UserCog className="h-4 w-4" />
          <span>{t.common.profile}</span>
        </NavLink>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent/50"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4 mr-3" />
          {t.common.signOut}
        </Button>
        <p className="text-xs text-sidebar-foreground/40 text-center pt-1">{t.common.version}</p>
      </div>
    </aside>
  );
};
