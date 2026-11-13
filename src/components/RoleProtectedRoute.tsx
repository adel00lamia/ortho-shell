import { Navigate } from 'react-router-dom';
import { useUserRole, type UserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  /** Roles allowed to view this route. */
  allowedRoles: Exclude<UserRole, null>[];
  /** Where to send users who don't match. Defaults to /dashboard. */
  fallbackPath?: string;
}

/**
 * Guards a route so only users whose role is in `allowedRoles` may render it.
 * - Unauthenticated → /auth
 * - Wrong role     → fallbackPath (default /dashboard)
 * - Loading        → skeleton
 */
export const RoleProtectedRoute = ({
  children,
  allowedRoles,
  fallbackPath = '/dashboard',
}: RoleProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();

  if (authLoading || roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-4 w-full max-w-md p-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};
