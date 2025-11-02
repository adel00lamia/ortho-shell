import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
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
} from 'lucide-react';
import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface NavItem {
  path: string;
  label: string;
  icon: any;
  badge?: string;
  roles?: string[];
}

interface NavSection {
  title: string;
  items: NavItem[];
  roles?: string[];
}

export const HierarchicalSidebar = () => {
  const { signOut } = useAuth();
  const { role } = useUserRole();
  const location = useLocation();
  const [openSections, setOpenSections] = useState<string[]>(['workflow', 'assess']);

  const toggleSection = (section: string) => {
    setOpenSections((prev) =>
      prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]
    );
  };

  const navSections: NavSection[] = [
    {
      title: 'Assess',
      roles: ['admin', 'hr_manager'],
      items: [
        { path: '/workflow/assess/diagnostic', label: 'Skills Diagnostic', icon: ClipboardCheck },
        { path: '/workflow/assess/performance', label: 'Performance Review', icon: FileText },
        { path: '/workflow/assess/benchmark', label: 'Industry Benchmark', icon: TrendingUp },
      ],
    },
    {
      title: 'Plan',
      roles: ['admin', 'hr_manager'],
      items: [
        { path: '/workflow/plan/builder', label: 'AI Plan Builder', icon: Lightbulb, badge: 'AI' },
        { path: '/workflow/plan/plans', label: 'My Plans', icon: Target },
      ],
    },
    {
      title: 'Execute',
      items: [
        { path: '/workflow/execute/modules', label: 'Module Studio', icon: BookOpen },
        { path: '/workflow/execute/marketplace', label: 'Course Marketplace', icon: ShoppingBag },
      ],
    },
    {
      title: 'Track & Certify',
      items: [
        { path: '/workflow/track/analytics', label: 'Analytics & ROI', icon: BarChart3 },
        { path: '/workflow/track/progress', label: 'Progress Tracking', icon: TrendingUp },
        { path: '/workflow/track/certificates', label: 'Certificates', icon: Award },
      ],
    },
  ];

  const managementSection: NavSection = {
    title: 'Management',
    roles: ['admin', 'hr_manager'],
    items: [
      { path: '/manage/users', label: 'User Management', icon: Users, roles: ['admin', 'hr_manager'] },
      { path: '/manage/team', label: 'Team Collaboration', icon: Building2 },
      { path: '/manage/settings', label: 'Settings', icon: Settings },
    ],
  };

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  const canViewSection = (section: NavSection) => {
    if (!section.roles) return true;
    return role && section.roles.includes(role);
  };

  const canViewItem = (item: NavItem) => {
    if (!item.roles) return true;
    return role && item.roles.includes(role);
  };

  return (
    <aside className="w-64 h-screen bg-sidebar-background border-r border-sidebar-border flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">TP</span>
          </div>
          <div>
            <h2 className="font-semibold text-sidebar-foreground text-sm">TrainPro</h2>
            <p className="text-xs text-sidebar-foreground/60">Academy</p>
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
          <span className="text-sm font-medium">Dashboard</span>
        </NavLink>

        <div className="pt-4">
          <p className="px-3 text-xs font-semibold text-sidebar-foreground/60 mb-2">WORKFLOW</p>
          
          {/* Workflow Sections */}
          {navSections.map((section) => {
            if (!canViewSection(section)) return null;
            
            return (
              <Collapsible
                key={section.title}
                open={openSections.includes(section.title.toLowerCase())}
                onOpenChange={() => toggleSection(section.title.toLowerCase())}
              >
                <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/50 rounded-lg transition-colors">
                  <span>{section.title}</span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                      openSections.includes(section.title.toLowerCase()) ? 'rotate-180' : ''
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
                          <span>{item.label}</span>
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
            <p className="px-3 text-xs font-semibold text-sidebar-foreground/60 mb-2">MANAGEMENT</p>
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
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border space-y-2">
        <NavLink
          to="/profile"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
        >
          <UserCog className="h-4 w-4" />
          <span>Profile</span>
        </NavLink>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent/50"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4 mr-3" />
          Sign Out
        </Button>
        <p className="text-xs text-sidebar-foreground/40 text-center pt-2">v2.0.0</p>
      </div>
    </aside>
  );
};
