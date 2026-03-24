import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Clock } from 'lucide-react';
import { useDeadlineAlerts } from '@/hooks/useDeadlineAlerts';
import { useLanguage } from '@/contexts/LanguageContext';

export function OFPPTDeadlineAlert() {
  const alerts = useDeadlineAlerts();
  const { language } = useLanguage();
  const active = alerts.filter((a) => a.variant === 'urgent' || a.variant === 'warning');
  if (active.length === 0) return null;

  return (
    <div className="space-y-2">
      {active.map((alert) => (
        <Alert
          key={alert.key}
          className={alert.variant === 'urgent' ? 'border-red-500 bg-red-50 text-red-900' : 'border-yellow-500 bg-yellow-50 text-yellow-900'}
        >
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span className="font-medium">
              {language === 'fr' ? alert.labelFr : alert.labelEn}
            </span>
            <span className="flex items-center gap-1 text-sm">
              <Clock className="h-3 w-3" />
              {alert.daysUntil <= 0
                ? (language === 'fr' ? 'Échéance dépassée' : 'Deadline passed')
                : language === 'fr'
                ? `J-${alert.daysUntil}`
                : `${alert.daysUntil}d left`}
            </span>
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
}
