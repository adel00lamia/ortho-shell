import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export const RoleBasedRedirect = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!loading && user && !redirecting) {
      handleRedirect();
    }
  }, [user, loading, redirecting]);

  const handleRedirect = async () => {
    if (!user) return;
    
    setRedirecting(true);
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (data && !error) {
        const role = data.role || 'employee';
        
        switch (role) {
          case 'admin':
            navigate('/admin');
            break;
          case 'trainer':
            navigate('/dashboard/trainer');
            break;
          default:
            navigate('/dashboard/company');
            break;
        }
      } else {
        // Default redirect if role not found
        navigate('/dashboard/company');
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
      navigate('/dashboard/company');
    }
  };

  if (loading || redirecting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl text-blue-600">Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  return null;
};