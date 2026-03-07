import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  ClipboardCheck,
  Target,
  TrendingUp,
  Lightbulb,
  BookOpen,
  PlayCircle,
  BarChart3,
  Award,
  Users,
  Settings,
  LogOut,
  ChevronDown,
  ShoppingBag,
  FileText,
  Building2,
  UserCog,
  Languages,
} from 'lucide-react';
import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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

export const HierarchicalSidebar = () => {
  const { signOut } = useAuth();
  const { role } = useUserRole();
  const { t, language, setLanguage } = useLanguage();
  const location = useLocation();
  const [openSections, setOpenSections] = useState<string[]>(['workflow', 'assess']);

  const toggleSection = (section: string) => {
    setOpenSections((prev) =>
      prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]
    );
  };

  const navSections: NavSection[] = [
    {
      titleKey: 'assess',
      roles: ['admin', 'hr_manager'],
      items: [
        { path: '/company-profile', labelKey: 'companyProfile', icon: Building2 },
        { path: '/workflow/assess/diagnostic', labelKey: 'skillsDiagnostic', icon: ClipboardCheck },
        { path: '/workflow/assess/performance', labelKey: 'performanceReview', icon: FileText },
        { path: '/workflow/assess/benchmark', labelKey: 'industryBenchmark', icon: TrendingUp },
      ],
    },
    {
      titleKey: 'plan',
      roles: ['admin', 'hr_manager'],
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
        { path: '/workflow/track/analytics', labelKey: 'analyticsROI', icon: BarChart3 },
        { path: '/workflow/track/progress', labelKey: 'progressTracking', icon: TrendingUp },
        { path: '/workflow/track/certificates', labelKey: 'certificates', icon: Award },
        { path: '/workflow/track/reimbursement', labelKey: 'ofpptReimbursement', icon: FileText, roles: ['admin', 'hr_manager'] },
      ],
    },
  ];

  const managementSection: NavSection = {
    titleKey: 'management',
    roles: ['admin', 'hr_manager'],
    items: [
      { path: '/manage/users', labelKey: 'userManagement', icon: Users, roles: ['admin', 'hr_manager'] },
      { path: '/manage/team', labelKey: 'teamCollaboration', icon: Building2 },
      { path: '/manage/settings', labelKey: 'settings', icon: Settings },
    ],
  };

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

  const getItemLabel = (key: string) => {
    return (t.nav as any)[key] || key;
  };

  const canViewSection = (section: NavSection) => {
    if (!section.roles) return true;
    return role && section.roles.includes(role);
  };

  const canViewItem = (item: NavItem) => {
    if (!item.roles) return true;
    return role && item.roles.includes(role);
  };

  return (
    <aside className="w-64 h-screen bg-sidebar border-r border-sidebar-border flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">TP</span>
          </div>
          <div>
            <h2 className="font-semibold text-sidebar-foreground text-sm">TrainPro Academy</h2>
            <p className="text-xs text-sidebar-foreground/60">Formation intelligente</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
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

        <div className="pt-4">
          <p className="px-3 text-xs font-semibold text-sidebar-foreground/60 mb-2">{t.nav.workflow}</p>
          
          {navSections.map((section) => {
            if (!canViewSection(section)) return null;
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
                <CollapsibleContent className="space-y-1 pl-3 mt-1">
                  {section.items.map((item) => {
                    if (!canViewItem(item)) return null;
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
        {canViewSection(managementSection) && (
          <div className="pt-4">
            <p className="px-3 text-xs font-semibold text-sidebar-foreground/60 mb-2">{getSectionTitle('management')}</p>
            {managementSection.items.map((item) => {
              if (!canViewItem(item)) return null;
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
        )}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border space-y-2">
        {/* Language Selector */}
        <div className="flex items-center gap-2 px-3 py-2">
          <Languages className="h-4 w-4 text-sidebar-foreground/60" />
          <div className="flex gap-1">
            <button
              onClick={() => setLanguage('fr')}
              className={`text-xs px-2 py-1 rounded transition-colors ${
                language === 'fr'
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
              }`}
            >
              FR
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`text-xs px-2 py-1 rounded transition-colors ${
                language === 'en'
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
              }`}
            >
              EN
            </button>
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
        <p className="text-xs text-sidebar-foreground/40 text-center pt-2">{t.common.version}</p>
      </div>
    </aside>
  );
};
