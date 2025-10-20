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
      switch (role) {
        case 'admin':
          navigate('/admin', { replace: true });
          break;
        case 'trainer':
          navigate('/dashboard/trainer', { replace: true });
          break;
        case 'company':
        case 'hr_manager':
          navigate('/dashboard/company', { replace: true });
          break;
        default:
          navigate('/', { replace: true });
      }
    }
  }, [user, role, authLoading, roleLoading, navigate]);

  return null;
};
