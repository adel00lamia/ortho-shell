import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

export type UserRole = 'admin' | 'hr_manager' | 'trainer' | 'employee' | null;

// AUTHENTICATION TEMPORARILY DISABLED FOR DEVELOPMENT
export const useUserRole = () => {
  // const { user } = useAuth();
  const [role] = useState<UserRole>('admin'); // Mock role for development
  const [loading] = useState(false);

  /* ORIGINAL CODE - UNCOMMENT TO RE-ENABLE:
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
        // Fetch user role from user_roles table (security best practice)
        const { data: userRoles, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .limit(1)
          .single();

        if (error) {
          console.error('Error fetching user role:', error);
          // Default to employee role if there's an error
          setRole('employee');
        } else if (userRoles?.role) {
          setRole(userRoles.role as UserRole);
        } else {
          // Default to employee role if no role is found
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
  */

  return { role, loading };
};
