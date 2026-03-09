import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'admin' | 'hr_manager' | 'trainer' | 'employee' | null;

export const useUserRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  const DISCOVERY_MODE = import.meta.env.DEV && import.meta.env.VITE_DISCOVERY_MODE === 'true';

  useEffect(() => {
    if (!user) {
      if (DISCOVERY_MODE) {
        setRole('admin');
        setLoading(false);
        return;
      }
      setRole(null);
      setLoading(false);
      return;
    }

    const fetchRole = async () => {
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error('Error fetching user role:', error);
          setRole('employee'); // fallback
        } else {
          setRole((data?.role as UserRole) || 'employee');
        }
      } catch (err) {
        console.error('Error fetching user role:', err);
        setRole('employee');
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, [user]);

  return { role, loading };
};
