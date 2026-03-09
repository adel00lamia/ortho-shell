import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight, X } from 'lucide-react';

export const TrialBanner = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const fr = language === 'fr';
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!user) return;
    const dismissKey = `trial_banner_dismissed_${user.id}`;
    if (sessionStorage.getItem(dismissKey)) {
      setDismissed(true);
      return;
    }

    const check = async () => {
      const { data } = await supabase
        .from('subscriptions')
        .select('status, current_period_end')
        .eq('user_id', user.id)
        .eq('status', 'trialing')
        .limit(1)
        .maybeSingle();

      if (data?.current_period_end) {
        const end = new Date(data.current_period_end);
        const days = Math.ceil((end.getTime() - Date.now()) / 86_400_000);
        setDaysLeft(Math.max(0, days));
      }
    };
    check();
  }, [user]);

  if (dismissed || daysLeft === null) return null;

  const urgent = daysLeft <= 3;

  return (
    <div
      className={`relative flex items-center justify-between gap-4 px-4 py-2.5 text-sm ${
        urgent
          ? 'bg-destructive/10 border-b border-destructive/20 text-destructive'
          : 'bg-primary/5 border-b border-primary/10 text-primary'
      }`}
    >
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 shrink-0" />
        <span className="font-medium">
          {urgent
            ? fr
              ? `Votre essai se termine dans ${daysLeft} jour${daysLeft !== 1 ? 's' : ''} !`
              : `Your trial ends in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}!`
            : fr
              ? `${daysLeft} jours restants dans votre essai gratuit`
              : `${daysLeft} days left in your free trial`}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant={urgent ? 'destructive' : 'default'}
          className="h-7 text-xs gap-1"
          onClick={() => navigate('/pricing')}
        >
          {fr ? 'Passer au plan' : 'Upgrade Now'}
          <ArrowRight className="h-3 w-3" />
        </Button>
        <button
          onClick={() => {
            setDismissed(true);
            if (user) sessionStorage.setItem(`trial_banner_dismissed_${user.id}`, 'true');
          }}
          className="p-1 hover:bg-black/5 rounded"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
};
