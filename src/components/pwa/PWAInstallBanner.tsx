import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePWA } from '@/hooks/usePWA';
import { Download, X, WifiOff } from 'lucide-react';

export function PWAInstallBanner() {
  const { language } = useLanguage();
  const fr = language === 'fr';
  const { canInstall, isOnline, promptInstall } = usePWA();
  const [dismissed, setDismissed] = useState(false);

  // Offline indicator
  if (!isOnline) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-amber-500 text-white px-4 py-2 flex items-center justify-center gap-2 text-sm">
        <WifiOff className="h-4 w-4" />
        {fr ? 'Mode hors ligne — certaines fonctionnalités sont limitées' : 'Offline mode — some features are limited'}
      </div>
    );
  }

  // Install prompt
  if (!canInstall || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 bg-card border shadow-lg rounded-lg p-4 flex items-center gap-3">
      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Download className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">
          {fr ? 'Installer Qimatak' : 'Install Qimatak'}
        </p>
        <p className="text-xs text-muted-foreground">
          {fr ? 'Accédez à vos formations hors ligne' : 'Access your training offline'}
        </p>
      </div>
      <div className="flex gap-1">
        <Button size="sm" onClick={promptInstall}>
          {fr ? 'Installer' : 'Install'}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setDismissed(true)}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
