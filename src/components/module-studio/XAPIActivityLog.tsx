import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useModuleEvents, useModuleEventsSummary } from '@/hooks/useXAPIEvents';
import { Loader2, Activity, CheckCircle2, XCircle, Play, Pause, SkipForward } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface XAPIActivityLogProps {
  moduleId: string;
}

const verbIcons: Record<string, React.ReactNode> = {
  launched: <Play className="h-3 w-3 text-blue-500" />,
  completed: <CheckCircle2 className="h-3 w-3 text-green-500" />,
  passed: <CheckCircle2 className="h-3 w-3 text-green-600" />,
  failed: <XCircle className="h-3 w-3 text-red-500" />,
  progressed: <SkipForward className="h-3 w-3 text-amber-500" />,
  answered: <Activity className="h-3 w-3 text-purple-500" />,
  suspended: <Pause className="h-3 w-3 text-muted-foreground" />,
  resumed: <Play className="h-3 w-3 text-blue-400" />,
};

const verbColors: Record<string, string> = {
  launched: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  passed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-700',
  progressed: 'bg-amber-100 text-amber-700',
  answered: 'bg-purple-100 text-purple-700',
  suspended: 'bg-gray-100 text-gray-600',
  resumed: 'bg-blue-50 text-blue-600',
};

export function XAPIActivityLog({ moduleId }: XAPIActivityLogProps) {
  const { language } = useLanguage();
  const fr = language === 'fr';
  const { data: events = [], isLoading } = useModuleEvents(moduleId);
  const { data: summary } = useModuleEventsSummary(moduleId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-3">
            <div className="text-xs text-muted-foreground">{fr ? 'Tentatives' : 'Attempts'}</div>
            <div className="text-xl font-bold">{summary.attempts}</div>
          </Card>
          <Card className="p-3">
            <div className="text-xs text-muted-foreground">{fr ? 'Statut' : 'Status'}</div>
            <div className="text-xl font-bold">
              {summary.hasCompleted
                ? (fr ? 'Terminé' : 'Completed')
                : summary.hasStarted
                  ? (fr ? 'En cours' : 'In Progress')
                  : (fr ? 'Non commencé' : 'Not Started')}
            </div>
          </Card>
          <Card className="p-3">
            <div className="text-xs text-muted-foreground">{fr ? 'Dernier score' : 'Last Score'}</div>
            <div className="text-xl font-bold">
              {summary.lastScore !== null ? `${summary.lastScore}%` : '—'}
            </div>
          </Card>
          <Card className="p-3">
            <div className="text-xs text-muted-foreground">{fr ? 'Réussi' : 'Passed'}</div>
            <div className="text-xl font-bold">
              {summary.passed
                ? <CheckCircle2 className="h-6 w-6 text-green-500" />
                : <XCircle className="h-6 w-6 text-muted-foreground/30" />}
            </div>
          </Card>
        </div>
      )}

      {/* Event log */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4" />
            {fr ? 'Journal d\'activité xAPI' : 'xAPI Activity Log'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {fr ? 'Aucune activité enregistrée' : 'No activity recorded yet'}
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {events.map(event => (
                <div key={event.id} className="flex items-center gap-3 text-sm py-1.5 border-b last:border-0">
                  <div className="flex items-center gap-1.5">
                    {verbIcons[event.verb] || <Activity className="h-3 w-3" />}
                    <Badge variant="outline" className={`text-xs ${verbColors[event.verb] || ''}`}>
                      {event.verb}
                    </Badge>
                  </div>
                  <span className="text-muted-foreground text-xs">{event.object_type}</span>
                  {event.result_score !== null && (
                    <Badge variant="secondary" className="text-xs">
                      {event.result_score}%
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground ml-auto">
                    {new Date(event.created_at).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
