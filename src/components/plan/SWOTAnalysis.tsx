import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, TrendingUp, AlertTriangle, Target } from 'lucide-react';

interface SWOTData {
  strengths?: string[];
  weaknesses?: string[];
  opportunities?: string[];
  threats?: string[];
  strategic_implications?: string;
}

interface SWOTAnalysisProps {
  data: SWOTData;
}

const quadrants = [
  {
    key: 'strengths' as const,
    label: 'Strengths',
    icon: Shield,
    bgClass: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    borderClass: 'border-emerald-500/30',
    textClass: 'text-emerald-700 dark:text-emerald-400',
    badgeBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
    dotClass: 'bg-emerald-500',
    corner: 'rounded-tl-2xl',
  },
  {
    key: 'weaknesses' as const,
    label: 'Weaknesses',
    icon: AlertTriangle,
    bgClass: 'bg-amber-500/10 dark:bg-amber-500/20',
    borderClass: 'border-amber-500/30',
    textClass: 'text-amber-700 dark:text-amber-400',
    badgeBg: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
    dotClass: 'bg-amber-500',
    corner: 'rounded-tr-2xl',
  },
  {
    key: 'opportunities' as const,
    label: 'Opportunities',
    icon: TrendingUp,
    bgClass: 'bg-sky-500/10 dark:bg-sky-500/20',
    borderClass: 'border-sky-500/30',
    textClass: 'text-sky-700 dark:text-sky-400',
    badgeBg: 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300',
    dotClass: 'bg-sky-500',
    corner: 'rounded-bl-2xl',
  },
  {
    key: 'threats' as const,
    label: 'Threats',
    icon: Target,
    bgClass: 'bg-rose-500/10 dark:bg-rose-500/20',
    borderClass: 'border-rose-500/30',
    textClass: 'text-rose-700 dark:text-rose-400',
    badgeBg: 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300',
    dotClass: 'bg-rose-500',
    corner: 'rounded-br-2xl',
  },
];

export function SWOTAnalysis({ data }: SWOTAnalysisProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            SWOT Analysis
          </CardTitle>
          <CardDescription>
            Strategic assessment of internal strengths/weaknesses and external opportunities/threats
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* 2×2 Quadrant Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border rounded-2xl overflow-hidden">
            {quadrants.map((q) => {
              const Icon = q.icon;
              const items = data[q.key] || [];
              return (
                <div key={q.key} className={`${q.bgClass} p-5 ${q.corner}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`p-1.5 rounded-md ${q.badgeBg}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <h3 className={`font-semibold ${q.textClass}`}>{q.label}</h3>
                    <Badge variant="secondary" className="ml-auto text-xs">{items.length}</Badge>
                  </div>
                  <ul className="space-y-2">
                    {items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className={`w-1.5 h-1.5 ${q.dotClass} rounded-full mt-1.5 shrink-0`} />
                        <span className="text-foreground/90">{item}</span>
                      </li>
                    ))}
                    {items.length === 0 && (
                      <li className="text-sm text-muted-foreground italic">No data available</li>
                    )}
                  </ul>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {data.strategic_implications && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Strategic Implications</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">{data.strategic_implications}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
