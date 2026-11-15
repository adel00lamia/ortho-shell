import type { ReactNode } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { WorkspaceModel } from '@/lib/hrWorkspace/model';

export type Setter = (fn: (m: WorkspaceModel) => WorkspaceModel) => void;
export interface ViewProps { m: WorkspaceModel; set: Setter; go: (view: ViewId) => void; demo: boolean }
export type ViewId = 'synthese' | 'organisation' | 'processus' | 'diagnostic' | 'scenarios' | 'feuille';

let seq = 0;
const fid = (label: string) => `f-${label.replace(/\W+/g, '-').toLowerCase()}-${++seq}`;

export function TextField({ label, value, onChange, multiline, placeholder, className }: { label: string; value: string; onChange: (v: string) => void; multiline?: boolean; placeholder?: string; className?: string }) {
  const id = fid(label);
  return (
    <div className={cn('space-y-1', className)}>
      <Label htmlFor={id} className="text-xs font-medium text-muted-foreground">{label}</Label>
      {multiline
        ? <Textarea id={id} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} rows={2} />
        : <Input id={id} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />}
    </div>
  );
}

export function NumField({ label, value, onChange, min = 0, max, step = 1, suffix, className }: { label: string; value: number | null; onChange: (v: number) => void; min?: number; max?: number; step?: number; suffix?: string; className?: string }) {
  const id = fid(label);
  const invalid = value !== null && (value < min || (max !== undefined && value > max));
  return (
    <div className={cn('space-y-1', className)}>
      <Label htmlFor={id} className="text-xs font-medium text-muted-foreground">{label}{suffix ? ` (${suffix})` : ''}</Label>
      <Input id={id} type="number" inputMode="decimal" min={min} max={max} step={step} value={value ?? ''} aria-invalid={invalid}
        className={cn(invalid && 'border-destructive')}
        onChange={(e) => { const v = e.target.value === '' ? 0 : Number(e.target.value); if (Number.isFinite(v)) onChange(v); }} />
      {invalid && <p className="text-xs text-destructive">Valeur attendue entre {min} et {max ?? '∞'}.</p>}
    </div>
  );
}

export function SelectField<T extends string>({ label, value, onChange, options, className }: { label: string; value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; className?: string }) {
  const id = fid(label);
  return (
    <div className={cn('space-y-1', className)}>
      <Label htmlFor={id} className="text-xs font-medium text-muted-foreground">{label}</Label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value as T)}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

export function Panel({ title, subtitle, children, actions, className }: { title: string; subtitle?: string; children: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <section className={cn('rounded-lg border bg-card p-4 md:p-5', className)}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

export function Tag({ kind, children }: { kind: 'input' | 'estimate' | 'missing' | 'priority' | 'human'; children: ReactNode }) {
  const map = {
    input: 'bg-primary/10 text-primary border-primary/20',
    estimate: 'bg-secondary text-secondary-foreground border-border',
    missing: 'bg-muted text-muted-foreground border-dashed border-muted-foreground/40',
    priority: 'bg-accent/20 text-accent-foreground border-accent/40',
    human: 'bg-foreground text-background border-foreground',
  } as const;
  return <span className={cn('inline-flex items-center rounded border px-1.5 py-0.5 text-[11px] font-medium', map[kind])}>{children}</span>;
}

export function Metric({ label, value, tag, hint }: { label: string; value: string; tag?: ReactNode; hint?: string }) {
  return (
    <div className="rounded-md border bg-background p-3">
      <div className="flex items-center justify-between gap-2"><p className="text-xs text-muted-foreground">{label}</p>{tag}</div>
      <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
