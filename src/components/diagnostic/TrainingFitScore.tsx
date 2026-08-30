import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Props {
  score: number;
  label: string;
  verdict?: string;
  size?: number;
}

export function TrainingFitScore({ score, label, verdict, size = 148 }: Props) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(100, Math.max(0, score));
  const tone = pct < 40 ? 'text-destructive' : pct < 70 ? 'text-amber-500' : 'text-primary';

  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={10}
            className="stroke-muted"
            fill="none"
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={10}
            strokeLinecap="round"
            fill="none"
            className={cn('stroke-current', tone)}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - (pct / 100) * circumference }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            style={{ strokeDasharray: circumference }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('text-3xl font-extrabold', tone)}>{pct}</span>
          <span className="text-xs text-muted-foreground">/100</span>
        </div>
      </div>
      <p className="text-sm font-semibold text-foreground">{label}</p>
      {verdict && <p className="max-w-xs text-xs text-muted-foreground">{verdict}</p>}
    </div>
  );
}
