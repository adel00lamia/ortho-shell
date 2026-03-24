import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Calendar } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import type { IngenierieAction } from '@/hooks/useIngenierie';

interface Props {
  actions: IngenierieAction[];
  exerciseYear: number;
  onNext: () => void;
  onPrev: () => void;
}

// Exercise year runs Jul(Y-1) → Jun(Y) for GIAC
function getExerciseMonths(exerciseYear: number) {
  const months = [];
  for (let i = 6; i <= 11; i++) {
    months.push(new Date(exerciseYear - 1, i, 1));
  }
  for (let i = 0; i <= 5; i++) {
    months.push(new Date(exerciseYear, i, 1));
  }
  return months;
}

const COLORS = [
  'bg-blue-400', 'bg-purple-400', 'bg-green-400', 'bg-orange-400',
  'bg-pink-400', 'bg-teal-400', 'bg-red-400', 'bg-indigo-400',
];

function actionSpansMonth(action: IngenierieAction, month: Date): boolean {
  if (!action.planned_start_date || !action.planned_end_date) return false;
  const start = new Date(action.planned_start_date);
  const end = new Date(action.planned_end_date);
  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
  const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  return start <= monthEnd && end >= monthStart;
}

export function CalendrierStep({ actions, exerciseYear, onNext, onPrev }: Props) {
  const { language } = useLanguage();
  const fr = language === 'fr';
  const months = getExerciseMonths(exerciseYear);

  const MONTH_NAMES_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
  const MONTH_NAMES_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const monthLabels = months.map((m) => {
    const name = fr ? MONTH_NAMES_FR[m.getMonth()] : MONTH_NAMES_EN[m.getMonth()];
    return `${name} ${m.getFullYear().toString().slice(2)}`;
  });

  const scheduledActions = actions.filter((a) => a.planned_start_date && a.planned_end_date);
  const unscheduledActions = actions.filter((a) => !a.planned_start_date || !a.planned_end_date);

  return (
    <div className="space-y-6">
      {unscheduledActions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-muted-foreground">{fr ? 'À planifier :' : 'To schedule:'}</span>
          {unscheduledActions.map((a) => (
            <Badge key={a.id} variant="outline" className="text-xs text-orange-600 border-orange-300">
              <Calendar className="h-3 w-3 mr-1" />
              {a.title}
            </Badge>
          ))}
        </div>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">
            {fr ? `Calendrier prévisionnel ${exerciseYear - 1}/${exerciseYear}` : `Planned calendar ${exerciseYear - 1}/${exerciseYear}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {scheduledActions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {fr ? 'Aucune action planifiée. Renseignez les dates dans l\'étape précédente.' : 'No scheduled actions. Add dates in the previous step.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[700px]">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4 font-medium w-48">{fr ? 'Action' : 'Action'}</th>
                    {monthLabels.map((label, i) => (
                      <th key={i} className="text-center py-2 px-1 font-medium w-12 whitespace-nowrap">{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {scheduledActions.map((action, actionIndex) => (
                    <tr key={action.id} className="border-b last:border-0">
                      <td className="py-2 pr-4">
                        <div className="flex items-center gap-1.5">
                          <div className={cn('h-2 w-2 rounded-full shrink-0', COLORS[actionIndex % COLORS.length])} />
                          <span className="truncate max-w-[160px]">{action.title}</span>
                        </div>
                      </td>
                      {months.map((month, mIndex) => {
                        const spans = actionSpansMonth(action, month);
                        return (
                          <td key={mIndex} className="py-2 px-1 text-center">
                            {spans ? (
                              <div className={cn('h-4 rounded', COLORS[actionIndex % COLORS.length], 'opacity-80')} />
                            ) : (
                              <div className="h-4" />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      {scheduledActions.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {scheduledActions.map((action, i) => (
            <div key={action.id} className="flex items-center gap-1.5 text-xs">
              <div className={cn('h-3 w-6 rounded', COLORS[i % COLORS.length])} />
              <span className="text-muted-foreground truncate max-w-[140px]">{action.title}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrev}><ArrowLeft className="h-4 w-4 mr-2" />{fr ? 'Précédent' : 'Previous'}</Button>
        <Button onClick={onNext}>{fr ? 'Suivant' : 'Next'}<ArrowRight className="h-4 w-4 ml-2" /></Button>
      </div>
    </div>
  );
}
