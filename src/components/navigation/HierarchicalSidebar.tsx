import { NavLink } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole, type UserRole } from '@/hooks/useUserRole';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  LayoutDashboard, ClipboardCheck, Target, TrendingUp, Lightbulb, BookOpen,
  PlayCircle, BarChart3, Award, Users, Settings, LogOut, ChevronDown,
  ShoppingBag, FileText, Building2, UserCog, Languages, Gauge, ShieldCheck,
  GraduationCap, Gift, CreditCard, PanelLeftClose, PanelLeft, Briefcase, UserCheck, Brain, Menu, X,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

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

const SHELL_CONFIG: Record<string, { icon: any; color: string; label: string; labelFr: string }> = {
  admin: { icon: ShieldCheck, color: 'from-red-500 to-orange-500', label: 'Admin', labelFr: 'Admin' },
  hr_manager: { icon: Target, color: 'from-blue-500 to-cyan-500', label: 'HR Manager', labelFr: 'Resp. RH' },
  trainer: { icon: GraduationCap, color: 'from-purple-500 to-pink-500', label: 'Trainer', labelFr: 'Formateur' },
  employee: { icon: BookOpen, color: 'from-green-500 to-emerald-500', label: 'Learner', labelFr: 'Apprenant' },
};

const SidebarContent = ({ collapsed, setCollapsed, onNavClick }: { collapsed: boolean; setCollapsed: (v: boolean) => void; onNavClick?: () => void }) => {
  const { signOut, user } = useAuth();
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

  const getNavSections = (): NavSection[] => {
    if (role === 'employee') {
      return [
        {
          titleKey: 'career',
          items: [
            { path: '/career', labelKey: 'myCareer', icon: UserCheck },
            { path: '/career/jobs', labelKey: 'jobBoard', icon: Briefcase },
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
            { path: '/workflow/track/analytics', labelKey: 'progressTracking', icon: TrendingUp },
            { path: '/workflow/track/certificates', labelKey: 'certificates', icon: Award },
          ],
        },
      ];
    }

    if (role === 'trainer') {
      return [
        {
          titleKey: 'career',
          items: [
            { path: '/career', labelKey: 'myCareer', icon: UserCheck },
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
            { path: '/workflow/track/certificates', labelKey: 'certificates', icon: Award },
          ],
        },
      ];
    }

    return [
      {
        titleKey: 'assess',
        items: [
          { path: '/company-profile', labelKey: 'companyProfile', icon: Building2 },
          { path: '/workflow/assess/workforce', labelKey: 'workforceOrg', icon: Users },
          { path: '/workflow/assess/performance', labelKey: 'performanceReview', icon: FileText },
          { path: '/workflow/assess/skills', labelKey: 'skillsGaps', icon: ClipboardCheck },
          { path: '/workflow/assess/report', labelKey: 'assessmentReport', icon: TrendingUp },
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
          { path: '/workflow/track/certificates', labelKey: 'certificates', icon: Award },
          { path: '/workflow/track/reimbursement', labelKey: 'ofpptReimbursement', icon: FileText },
        ],
      },
      {
        titleKey: 'knowledge',
        items: [
          { path: '/hr-knowledge', labelKey: 'hrKnowledge', icon: Brain, badge: 'AI' },
        ],
      },
    ];
  };

  const getManagementItems = (): NavItem[] => {
    if (role === 'admin') {
      return [
        { path: '/manage/talent', labelKey: 'talentPipeline', icon: Briefcase },
        { path: '/manage/users', labelKey: 'userManagement', icon: Users },
        { path: '/manage/team', labelKey: 'teamCollaboration', icon: Building2 },
        { path: '/billing', labelKey: 'billing', icon: CreditCard },
        { path: '/referrals', labelKey: 'referrals', icon: Gift },
        { path: '/manage/settings', labelKey: 'settings', icon: Settings },
      ];
    }
    if (role === 'hr_manager') {
      return [
        { path: '/manage/talent', labelKey: 'talentPipeline', icon: Briefcase },
        { path: '/manage/team', labelKey: 'teamCollaboration', icon: Building2 },
        { path: '/billing', labelKey: 'billing', icon: CreditCard },
        { path: '/referrals', labelKey: 'referrals', icon: Gift },
        { path: '/manage/settings', labelKey: 'settings', icon: Settings },
      ];
    }
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
      career: (t.nav as any).career || (language === 'fr' ? 'Carrière' : 'Career'),
      knowledge: language === 'fr' ? 'Connaissances' : 'Knowledge',
    };
    return map[key] || key;
  };

  const getItemLabel = (key: string) => (t.nav as any)[key] || key;

  // Get user initials for avatar
  const userInitials = user?.user_metadata?.first_name && user?.user_metadata?.last_name
    ? `${user.user_metadata.first_name[0]}${user.user_metadata.last_name[0]}`.toUpperCase()
    : user?.email?.[0]?.toUpperCase() || '?';
  const userName = user?.user_metadata?.first_name
    ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`
    : user?.email || '';

  const NavItemLink = ({ item }: { item: NavItem }) => {
    const Icon = item.icon;
    const label = getItemLabel(item.labelKey);

    const link = (
      <NavLink
        to={item.path}
        onClick={onNavClick}
        className={({ isActive }) =>
          `flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
            isActive
              ? 'bg-sidebar-accent text-sidebar-accent-foreground'
              : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
          } ${collapsed ? 'justify-center px-2' : ''}`
        }
      >
        <div className="flex items-center gap-3">
          <Icon className="h-4 w-4 shrink-0" />
          {!collapsed && <span>{label}</span>}
        </div>
        {!collapsed && item.badge && (
          <Badge variant="secondary" className="text-xs">
            {item.badge}
          </Badge>
        )}
      </NavLink>
    );

    if (collapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{link}</TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return link;
  };

  return (
    <aside className={`${collapsed ? 'w-16' : 'w-64'} h-screen bg-sidebar border-r border-sidebar-border flex flex-col overflow-y-auto sticky top-0 transition-all duration-300`}>
      {/* Header */}
      <div className="p-3 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <span className="text-primary-foreground font-bold text-sm">TP</span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-sidebar-foreground text-sm truncate">TrainPro Academy</h2>
              <div className="flex items-center gap-1.5">
                <div className={`h-2 w-2 rounded-full bg-gradient-to-r ${shell.color}`} />
                <span className="text-xs text-sidebar-foreground/60 truncate">{shellLabel}</span>
              </div>
            </div>
          )}
          {!collapsed && <NotificationCenter />}
        </div>
      </div>

      {/* Collapse toggle */}
      <div className={`px-3 py-2 flex ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {!collapsed && (
          <button
            onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}
            className="flex items-center gap-2 flex-1 px-3 py-2 text-xs text-sidebar-foreground/50 bg-sidebar-accent/30 rounded-lg hover:bg-sidebar-accent/50 transition-colors"
          >
            <span>{t.common.search}...</span>
            <kbd className="ml-auto text-[10px] bg-sidebar-accent px-1.5 py-0.5 rounded font-mono">Ctrl+K</kbd>
          </button>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className={`p-2 text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 rounded-lg transition-colors ${collapsed ? '' : 'ml-2'}`}
            >
              {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            {collapsed ? (language === 'fr' ? 'Déplier' : 'Expand') : (language === 'fr' ? 'Replier' : 'Collapse')}
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1">
        {/* Dashboard */}
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <NavLink
                to="/dashboard"
                onClick={onNavClick}
                className={({ isActive }) =>
                  `flex items-center justify-center gap-3 px-2 py-2 rounded-lg transition-colors ${
                    isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                  }`
                }
              >
                <LayoutDashboard className="h-4 w-4" />
              </NavLink>
            </TooltipTrigger>
            <TooltipContent side="right">{t.nav.dashboard}</TooltipContent>
          </Tooltip>
        ) : (
          <NavLink
            to="/dashboard"
            onClick={onNavClick}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
              }`
            }
          >
            <LayoutDashboard className="h-4 w-4" />
            <span className="text-sm font-medium">{t.nav.dashboard}</span>
          </NavLink>
        )}

        <div className="pt-3">
          {!collapsed && <p className="px-3 text-xs font-semibold text-sidebar-foreground/60 mb-2">{t.nav.workflow}</p>}

          {navSections.map((section) => {
            const sectionId = section.titleKey.toLowerCase();

            if (collapsed) {
              return (
                <div key={section.titleKey} className="space-y-0.5 mb-2">
                  {section.items.map((item) => (
                    <NavItemLink key={item.path} item={item} />
                  ))}
                </div>
              );
            }

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
                  {section.items.map((item) => (
                    <NavItemLink key={item.path} item={item} />
                  ))}
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>

        {/* Management Section */}
        <div className="pt-3">
          {!collapsed && <p className="px-3 text-xs font-semibold text-sidebar-foreground/60 mb-2">{getSectionTitle('management')}</p>}
          {managementItems.map((item) => (
            <NavItemLink key={item.path} item={item} />
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border space-y-1">
        {/* Language Selector */}
        {!collapsed && (
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
        )}

        {/* User profile card */}
        <div className={`flex items-center gap-3 px-3 py-2 rounded-lg bg-sidebar-accent/30 ${collapsed ? 'justify-center px-2' : ''}`}>
          <div className={`h-8 w-8 rounded-full bg-gradient-to-br ${shell.color} flex items-center justify-center shrink-0`}>
            <span className="text-xs font-bold text-white">{userInitials}</span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-sidebar-foreground truncate">{userName}</p>
              <p className="text-[10px] text-sidebar-foreground/50 truncate">{user?.email}</p>
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          className={`w-full text-sidebar-foreground hover:bg-sidebar-accent/50 ${collapsed ? 'justify-center px-2' : 'justify-start'}`}
          onClick={signOut}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span className="ml-3">{t.common.signOut}</span>}
        </Button>
        {!collapsed && <p className="text-xs text-sidebar-foreground/40 text-center pt-1">{t.common.version}</p>}
      </div>
    </aside>
  );
};

export const HierarchicalSidebar = () => {
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (isMobile) {
    return (
      <>
        <button
          onClick={() => setMobileOpen(true)}
          className="fixed top-3 left-3 z-50 p-2 rounded-lg bg-sidebar border border-sidebar-border text-sidebar-foreground shadow-lg"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="p-0 w-72 bg-sidebar border-sidebar-border">
            <SidebarContent collapsed={false} setCollapsed={() => {}} onNavClick={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return <SidebarContent collapsed={collapsed} setCollapsed={setCollapsed} />;
};
