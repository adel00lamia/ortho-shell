import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

export type UserRole = 'admin' | 'company' | 'trainer' | 'hr_manager' | null;

export const useUserRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        setRole(null);
        setLoading(false);
        return;
      }

      // TODO: Once the database migration completes, fetch actual role from user_roles table
      // For now, default all authenticated users to 'company' role
      setRole('company');
      setLoading(false);
    };

    fetchUserRole();
  }, [user]);

  return { role, loading };
};
