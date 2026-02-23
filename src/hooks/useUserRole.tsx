import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'admin' | 'hr_manager' | 'trainer' | 'employee' | null;

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

      try {
        const { data: userRoles, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .limit(1)
          .single();

        if (error) {
          console.error('Error fetching user role:', error);
          setRole('employee');
        } else if (userRoles?.role) {
          setRole(userRoles.role as UserRole);
        } else {
          setRole('employee');
        }
      } catch (error) {
        console.error('Error in fetchUserRole:', error);
        setRole('employee');
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);

  return { role, loading };
};
