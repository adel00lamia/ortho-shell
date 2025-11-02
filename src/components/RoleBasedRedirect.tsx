import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';

export const RoleBasedRedirect = () => {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading || roleLoading) return;

    if (!user) {
      navigate('/auth', { replace: true });
      return;
    }

    if (role) {
      // All roles now go to unified dashboard
      navigate('/dashboard', { replace: true });
    }
  }, [user, role, authLoading, roleLoading, navigate]);

  return null;
};
