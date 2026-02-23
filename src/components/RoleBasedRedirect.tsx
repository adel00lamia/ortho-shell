import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// AUTHENTICATION TEMPORARILY DISABLED FOR DEVELOPMENT
export const RoleBasedRedirect = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/dashboard', { replace: true });
  }, [navigate]);

  return null;
};
