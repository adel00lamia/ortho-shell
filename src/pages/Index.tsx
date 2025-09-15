import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('Index component - Auth state:', { user: user?.email, loading });
    if (!loading && !user) {
      console.log('Redirecting to auth page');
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-xl text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <h1 className="mb-4 text-4xl font-bold">Welcome to TrainPro Academy</h1>
        <p className="text-xl text-muted-foreground">
          Hello, {user.user_metadata?.first_name || user.email}!
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Button onClick={() => navigate('/diagnostic')} variant="default">
            🎯 Start Training Diagnostic
          </Button>
          <Button onClick={() => navigate('/marketplace')} variant="default">
            🛒 Browse Marketplace
          </Button>
          <Button onClick={() => navigate('/pricing')} variant="outline">
            💰 View Pricing
          </Button>
          <Button onClick={signOut} variant="outline">
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
