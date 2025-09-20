import { useState, useEffect } from 'react';
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
  FileCheck,
  TrendingUp,
  User,
  Palette,
  Shield,
  Database
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface NavigationItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  badge?: string;
}

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [userRole, setUserRole] = useState<string>('');
  const location = useLocation();
  const { user, signOut } = useAuth();

  useEffect(() => {
    if (user) {
      fetchUserRole();
    }
  }, [user]);

  const fetchUserRole = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (data && !error) {
        setUserRole(data.role || 'employee');
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  };

  const getNavigationItems = (): NavigationItem[] => {
    if (userRole === 'admin') {
      return [
        {
          path: '/admin',
          label: 'Admin Dashboard',
          icon: <Home className="w-4 h-4" />,
          description: 'Platform overview'
        },
        {
          path: '/admin/users',
          label: 'User Management',
          icon: <Users className="w-4 h-4" />,
          description: 'Manage companies & trainers'
        },
        {
          path: '/admin/marketplace',
          label: 'Marketplace Control',
          icon: <ShoppingCart className="w-4 h-4" />,
          description: 'Approve trainer profiles'
        },
        {
          path: '/admin/analytics',
          label: 'Platform Analytics',
          icon: <BarChart3 className="w-4 h-4" />,
          description: 'Usage & revenue metrics'
        }
      ];
    }

    if (userRole === 'trainer') {
      return [
        {
          path: '/dashboard/trainer',
          label: 'Trainer Dashboard',
          icon: <Home className="w-4 h-4" />,
          description: 'Overview and bookings'
        },
        {
          path: '/dashboard/trainer/profile',
          label: 'Profile Manager',
          icon: <User className="w-4 h-4" />,
          description: 'Edit public profile'
        },
        {
          path: '/dashboard/trainer/catalog',
          label: 'Training Catalog',
          icon: <BookOpen className="w-4 h-4" />,
          description: 'Manage offerings'
        },
        {
          path: '/dashboard/trainer/studio',
          label: 'AI Studio',
          icon: <Palette className="w-4 h-4" />,
          description: 'Digitize content & slides',
          badge: 'AI'
        },
        {
          path: '/dashboard/trainer/compliance',
          label: 'Evaluation Forms',
          icon: <FileCheck className="w-4 h-4" />,
          description: 'Assessment helpers'
        },
        {
          path: '/dashboard/trainer/certificates',
          label: 'Badge Manager',
          icon: <Award className="w-4 h-4" />,
          description: 'Co-branded certificates'
        }
      ];
    }

    // Default: company role
    return [
      {
        path: '/dashboard/company',
        label: 'Company Dashboard',
        icon: <Home className="w-4 h-4" />,
        description: 'Overview & insights'
      },
      {
        path: '/dashboard/company/diagnostic',
        label: 'AI Diagnostic',
        icon: <Brain className="w-4 h-4" />,
        description: 'Skills assessment & plans',
        badge: 'AI'
      },
      {
        path: '/dashboard/company/compliance',
        label: 'Compliance Tracker',
        icon: <Shield className="w-4 h-4" />,
        description: 'OFPPT/GIAC dossiers'
      },
      {
        path: '/dashboard/company/kpi',
        label: 'KPI Dashboard',
        icon: <TrendingUp className="w-4 h-4" />,
        description: 'ROI & performance metrics'
      },
      {
        path: '/dashboard/company/certificates',
        label: 'Certificate Manager',
        icon: <Award className="w-4 h-4" />,
        description: 'Issue digital badges'
      },
      {
        path: '/marketplace',
        label: 'Trainer Marketplace',
        icon: <ShoppingCart className="w-4 h-4" />,
        description: 'Find training providers'
      }
    ];
  };

  const navigationItems = getNavigationItems();

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