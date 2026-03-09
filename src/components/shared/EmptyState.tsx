import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  /** Optional feature highlights shown as bullet points */
  highlights?: string[];
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  highlights,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center max-w-md mx-auto">
      <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
        <Icon className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{description}</p>
      {highlights && highlights.length > 0 && (
        <ul className="text-sm text-muted-foreground mb-6 space-y-1.5 text-start w-full">
          {highlights.map((h, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-primary mt-0.5">&#10003;</span>
              <span>{h}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-3">
        {actionLabel && onAction && (
          <Button onClick={onAction}>{actionLabel}</Button>
        )}
        {secondaryLabel && onSecondary && (
          <Button variant="outline" onClick={onSecondary}>{secondaryLabel}</Button>
        )}
      </div>
    </div>
  );
}
