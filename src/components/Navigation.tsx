import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Home, 
  Brain, 
  Target, 
  ShoppingCart, 
  BookOpen, 
  Award, 
  BarChart3, 
  Calendar,
  Settings,
  Menu,
  X,
  Users,
  MessageSquare,
  ClipboardCheck
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface NavigationItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  badge?: string;
}

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuth();

  // Organized by workflow stages
  const assessmentItems: NavigationItem[] = [
    {
      path: '/diagnostic',
      label: 'Skills Diagnostic',
      icon: <Target className="w-4 h-4" />,
      description: 'Identify skill gaps & training needs',
      badge: 'Start Here'
    },
    {
      path: '/performance-evaluation',
      label: 'Performance Reviews',
      icon: <ClipboardCheck className="w-4 h-4" />,
      description: 'Evaluate employee performance'
    },
    {
      path: '/benchmark',
      label: 'Industry Benchmark',
      icon: <BarChart3 className="w-4 h-4" />,
      description: 'Compare with market standards'
    }
  ];

  const planningItems: NavigationItem[] = [
    {
      path: '/ai-plan-builder',
      label: 'AI Plan Builder',
      icon: <Brain className="w-4 h-4" />,
      description: 'Generate smart training plans',
      badge: 'AI'
    }
  ];

  const executionItems: NavigationItem[] = [
    {
      path: '/module-studio',
      label: 'Module Studio',
      icon: <BookOpen className="w-4 h-4" />,
      description: 'Create training content'
    },
    {
      path: '/marketplace',
      label: 'Course Marketplace',
      icon: <ShoppingCart className="w-4 h-4" />,
      description: 'Browse external courses'
    }
  ];

  const trackingItems: NavigationItem[] = [
    {
      path: '/analytics',
      label: 'Analytics & ROI',
      icon: <BarChart3 className="w-4 h-4" />,
      description: 'Track progress & measure impact'
    },
    {
      path: '/certificate-generator',
      label: 'Certificates',
      icon: <Award className="w-4 h-4" />,
      description: 'Issue digital credentials'
    }
  ];

  const managementItems: NavigationItem[] = [
    {
      path: '/user-management',
      label: 'User Management',
      icon: <Users className="w-4 h-4" />,
      description: 'Manage users & permissions'
    },
    {
      path: '/team-collaboration',
      label: 'Team Collaboration',
      icon: <MessageSquare className="w-4 h-4" />,
      description: 'Projects & communication'
    }
  ];

  const comingSoonItems = [
    {
      label: 'Calendar & Bookings',
      icon: <Calendar className="w-4 h-4" />,
      description: 'Schedule training sessions'
    },
    {
      label: 'Admin Settings',
      icon: <Settings className="w-4 h-4" />,
      description: 'System configuration'
    }
  ];

  const isCurrentPage = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="fixed top-4 left-4 z-50 lg:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="bg-background/80 backdrop-blur-sm"
        >
          {isOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </Button>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Navigation Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full w-80 bg-background border-r z-50 transform transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        <div className="p-6 space-y-6 h-full overflow-y-auto">
          {/* Header */}
          <div className="space-y-2">
            <h2 className="text-xl font-bold">FLM Academy</h2>
            {user && (
              <p className="text-sm text-muted-foreground">
                Welcome, {user.user_metadata?.first_name || user.email}
              </p>
            )}
          </div>

          {/* Quick Stats */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-medium text-sm">Quick Stats</h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="text-center">
                  <div className="font-bold text-lg">3</div>
                  <div className="text-muted-foreground">Active Plans</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-lg">12</div>
                  <div className="text-muted-foreground">Modules</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-lg">85%</div>
                  <div className="text-muted-foreground">Completion</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-lg">24</div>
                  <div className="text-muted-foreground">Certificates</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Home */}
          <Link
            to="/"
            onClick={() => setIsOpen(false)}
            className={`
              block p-3 rounded-lg transition-colors hover:bg-muted mb-4
              ${isCurrentPage('/') ? 'bg-primary/10 border border-primary/20' : ''}
            `}
          >
            <div className="flex items-center gap-3">
              <div className={`${isCurrentPage('/') ? 'text-primary' : 'text-muted-foreground'}`}>
                <Home className="w-4 h-4" />
              </div>
              <span className={`font-medium text-sm ${isCurrentPage('/') ? 'text-primary' : ''}`}>
                Home Dashboard
              </span>
            </div>
          </Link>

          {/* Navigation Items - Organized by Workflow */}
          <div className="space-y-4">
            {/* Step 1: Assess */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-2">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">1</div>
                <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                  Assess
                </h3>
              </div>
              {assessmentItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`
                    block p-2.5 rounded-lg transition-colors hover:bg-muted
                    ${isCurrentPage(item.path) ? 'bg-primary/10 border border-primary/20' : ''}
                  `}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`${isCurrentPage(item.path) ? 'text-primary' : 'text-muted-foreground'}`}>
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium text-xs ${isCurrentPage(item.path) ? 'text-primary' : ''}`}>
                          {item.label}
                        </span>
                        {item.badge && (
                          <Badge variant="secondary" className="text-[10px] px-1 py-0">
                            {item.badge}
                          </Badge>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Step 2: Plan */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-2">
                <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">2</div>
                <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                  Plan
                </h3>
              </div>
              {planningItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`
                    block p-2.5 rounded-lg transition-colors hover:bg-muted
                    ${isCurrentPage(item.path) ? 'bg-primary/10 border border-primary/20' : ''}
                  `}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`${isCurrentPage(item.path) ? 'text-primary' : 'text-muted-foreground'}`}>
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium text-xs ${isCurrentPage(item.path) ? 'text-primary' : ''}`}>
                          {item.label}
                        </span>
                        {item.badge && (
                          <Badge variant="secondary" className="text-[10px] px-1 py-0">
                            {item.badge}
                          </Badge>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Step 3: Execute */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-2">
                <div className="w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold">3</div>
                <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                  Execute
                </h3>
              </div>
              {executionItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`
                    block p-2.5 rounded-lg transition-colors hover:bg-muted
                    ${isCurrentPage(item.path) ? 'bg-primary/10 border border-primary/20' : ''}
                  `}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`${isCurrentPage(item.path) ? 'text-primary' : 'text-muted-foreground'}`}>
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium text-xs ${isCurrentPage(item.path) ? 'text-primary' : ''}`}>
                          {item.label}
                        </span>
                        {item.badge && (
                          <Badge variant="secondary" className="text-[10px] px-1 py-0">
                            {item.badge}
                          </Badge>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Step 4: Track */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-2">
                <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-xs font-bold">4</div>
                <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                  Track & Certify
                </h3>
              </div>
              {trackingItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`
                    block p-2.5 rounded-lg transition-colors hover:bg-muted
                    ${isCurrentPage(item.path) ? 'bg-primary/10 border border-primary/20' : ''}
                  `}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`${isCurrentPage(item.path) ? 'text-primary' : 'text-muted-foreground'}`}>
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium text-xs ${isCurrentPage(item.path) ? 'text-primary' : ''}`}>
                          {item.label}
                        </span>
                        {item.badge && (
                          <Badge variant="secondary" className="text-[10px] px-1 py-0">
                            {item.badge}
                          </Badge>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Management */}
            <div className="space-y-2">
              <h3 className="font-medium text-xs text-muted-foreground uppercase tracking-wider px-2">
                Management
              </h3>
              {managementItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`
                    block p-2.5 rounded-lg transition-colors hover:bg-muted
                    ${isCurrentPage(item.path) ? 'bg-primary/10 border border-primary/20' : ''}
                  `}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`${isCurrentPage(item.path) ? 'text-primary' : 'text-muted-foreground'}`}>
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium text-xs ${isCurrentPage(item.path) ? 'text-primary' : ''}`}>
                          {item.label}
                        </span>
                        {item.badge && (
                          <Badge variant="secondary" className="text-[10px] px-1 py-0">
                            {item.badge}
                          </Badge>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Coming Soon */}
          <div className="space-y-2">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
              Coming Soon
            </h3>
            {comingSoonItems.map((item, index) => (
              <div
                key={index}
                className="p-3 rounded-lg bg-muted/50 opacity-60"
              >
                <div className="flex items-center gap-3">
                  <div className="text-muted-foreground">
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {item.label}
                      </span>
                      <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                        Soon
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="pt-4 space-y-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={signOut}
              className="w-full"
            >
              Sign Out
            </Button>
            <div className="text-xs text-center text-muted-foreground">
              FLM Academy v1.0
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Margin for Desktop */}
      <style>{`
        @media (min-width: 1024px) {
          .main-content {
            margin-left: 320px;
          }
        }
      `}</style>
    </>
  );
}