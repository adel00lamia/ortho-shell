import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// import { useAuth } from '@/hooks/useAuth';
// import { useUserRole } from '@/hooks/useUserRole';

// AUTHENTICATION TEMPORARILY DISABLED FOR DEVELOPMENT
export const RoleBasedRedirect = () => {
  // const { user, loading: authLoading } = useAuth();
  // const { role, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();

  useEffect(() => {
    // Skip auth checks - go directly to dashboard
    navigate('/dashboard', { replace: true });
    
    /* ORIGINAL AUTH CODE - UNCOMMENT TO RE-ENABLE:
    if (authLoading || roleLoading) return;

    if (!user) {
      navigate('/auth', { replace: true });
      return;
    }

    if (role) {
      // All roles now go to unified dashboard
      navigate('/dashboard', { replace: true });
    }
    */
  }, [navigate]);

  return null;
};
