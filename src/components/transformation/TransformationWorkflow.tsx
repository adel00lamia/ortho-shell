import { Check, CircleAlert, CircleDashed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export type WorkflowStep = { id: string; label: string; count: number; complete: boolean; warning?: boolean };

export function TransformationWorkflow({ steps, active, onChange, fr }: { steps: WorkflowStep[]; active: string; onChange: (id: string) => void; fr: boolean }) {
  const completed = steps.filter((step) => step.complete).length;
  return (
    <aside className="transformation-panel min-w-0 p-4 lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)]">
      <div className="mb-5">
        <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase text-muted-foreground">
          <span>{fr ? 'Progression' : 'Progress'}</span><span>{completed}/{steps.length}</span>
        </div>
        <Progress value={(completed / steps.length) * 100} className="h-1.5" />
      </div>
      <nav aria-label={fr ? 'Parcours de transformation' : 'Transformation workflow'} className="space-y-1">
        {steps.map((step, index) => {
          const Icon = step.complete ? Check : step.warning ? CircleAlert : CircleDashed;
          return (
            <Button key={step.id} variant="ghost" onClick={() => onChange(step.id)} className={cn('h-auto w-full justify-start whitespace-normal px-2 py-2.5 text-left', active === step.id && 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground')}>
              <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px]', active === step.id ? 'border-primary-foreground/40' : 'border-border')}>
                {step.complete ? <Icon className="h-3.5 w-3.5" /> : index + 1}
              </span>
              <span className="min-w-0 flex-1"><span className="block text-sm font-medium">{step.label}</span><span className={cn('block text-[11px]', active === step.id ? 'text-primary-foreground/75' : 'text-muted-foreground')}>{step.count} {fr ? 'élément(s)' : 'item(s)'}</span></span>
            </Button>
          );
        })}
      </nav>
      <div className="mt-5 border-t border-border pt-4 text-xs text-muted-foreground">
        <p className="font-semibold text-foreground">{fr ? 'Prochaine action' : 'Next action'}</p>
        <p className="mt-1">{steps.find((step) => !step.complete)?.label ?? (fr ? 'Revoir les scénarios' : 'Review scenarios')}</p>
      </div>
    </aside>
  );
}