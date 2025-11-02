import { ReactNode } from 'react';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  showBreadcrumbs?: boolean;
}

export const DashboardLayout = ({ 
  children, 
  title, 
  description,
  showBreadcrumbs = true 
}: DashboardLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      {showBreadcrumbs && <Breadcrumbs />}
      
      <div className="container mx-auto p-6 space-y-6">
        {(title || description) && (
          <div className="space-y-2">
            {title && (
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                {title}
              </h1>
            )}
            {description && (
              <p className="text-muted-foreground">
                {description}
              </p>
            )}
          </div>
        )}
        
        {children}
      </div>
    </div>
  );
};
