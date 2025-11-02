import { useLocation, Link } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Home } from 'lucide-react';

const routeLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  workflow: 'Workflow',
  assess: 'Assess',
  plan: 'Plan',
  execute: 'Execute',
  track: 'Track',
  diagnostic: 'Skills Diagnostic',
  'performance-evaluation': 'Performance Review',
  benchmark: 'Industry Benchmark',
  'ai-plan-builder': 'AI Plan Builder',
  'module-studio': 'Module Studio',
  marketplace: 'Course Marketplace',
  analytics: 'Analytics',
  'certificate-generator': 'Certificates',
  'user-management': 'User Management',
  'team-collaboration': 'Team Collaboration',
  manage: 'Management',
  settings: 'Settings',
  profile: 'Profile',
};

export const Breadcrumbs = () => {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);

  if (pathSegments.length === 0) {
    return null;
  }

  return (
    <div className="border-b bg-card">
      <div className="container mx-auto px-6 py-3">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/dashboard">
                  <Home className="h-4 w-4" />
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>

            {pathSegments.map((segment, index) => {
              const path = `/${pathSegments.slice(0, index + 1).join('/')}`;
              const isLast = index === pathSegments.length - 1;
              const label = routeLabels[segment] || segment.replace(/-/g, ' ');

              return (
                <div key={path} className="flex items-center gap-2">
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage className="capitalize">{label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link to={path} className="capitalize">
                          {label}
                        </Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </div>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </div>
  );
};
