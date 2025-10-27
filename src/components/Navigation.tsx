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
  MessageSquare
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

  const navigationItems: NavigationItem[] = [
    {
      path: '/',
      label: 'Dashboard',
      icon: <Home className="w-4 h-4" />,
      description: 'Overview and quick access'
    },
    {
      path: '/ai-plan-builder',
      label: 'AI Plan Builder',
      icon: <Brain className="w-4 h-4" />,
      description: 'Create AI-powered training plans',
      badge: 'New'
    },
    {
      path: '/diagnostic',
      label: 'Training Diagnostic',
      icon: <Target className="w-4 h-4" />,
      description: 'Assess training needs'
    },
    {
      path: '/performance-evaluation',
      label: 'Performance Reviews',
      icon: <Target className="w-4 h-4" />,
      description: 'Manage employee evaluations'
    },
    {
      path: '/benchmark',
      label: 'Industry Benchmark',
      icon: <BarChart3 className="w-4 h-4" />,
      description: 'Compare with industry standards',
      badge: 'New'
    },
    {
      path: '/marketplace',
      label: 'Course Marketplace',
      icon: <ShoppingCart className="w-4 h-4" />,
      description: 'Browse external courses'
    },
    {
      path: '/certificate-generator',
      label: 'Certificates',
      icon: <Award className="w-4 h-4" />,
      description: 'Generate certificates and badges'
    },
    {
      path: '/analytics',
      label: 'Analytics',
      icon: <BarChart3 className="w-4 h-4" />,
      description: 'Performance metrics and ROI'
    },
    {
      path: '/user-management',
      label: 'User Management',
      icon: <Users className="w-4 h-4" />,
      description: 'Manage users and permissions'
    },
    {
      path: '/team-collaboration',
      label: 'Team Collaboration',
      icon: <MessageSquare className="w-4 h-4" />,
      description: 'Projects and team communication'
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
            <h2 className="text-xl font-bold">LMF Academy</h2>
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

          {/* Navigation Items */}
          <div className="space-y-2">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
              Navigation
            </h3>
            {navigationItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`
                  block p-3 rounded-lg transition-colors hover:bg-muted
                  ${isCurrentPage(item.path) ? 'bg-primary/10 border border-primary/20' : ''}
                `}
              >
                <div className="flex items-center gap-3">
                  <div className={`
                    ${isCurrentPage(item.path) ? 'text-primary' : 'text-muted-foreground'}
                  `}>
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`
                        font-medium text-sm
                        ${isCurrentPage(item.path) ? 'text-primary' : ''}
                      `}>
                        {item.label}
                      </span>
                      {item.badge && (
                        <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                          {item.badge}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {item.description}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
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
              LMF Academy v1.0
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