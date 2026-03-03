import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Landmark, 
  DollarSign, 
  Users, 
  Cpu, 
  Leaf, 
  Scale 
} from 'lucide-react';

interface PESTELData {
  political?: string[];
  economic?: string[];
  social?: string[];
  technological?: string[];
  environmental?: string[];
  legal?: string[];
  key_implications?: string;
}

interface PESTELAnalysisProps {
  data: PESTELData;
}

const factors = [
  {
    key: 'political' as const,
    label: 'Political',
    letter: 'P',
    icon: Landmark,
    color: 'bg-indigo-500',
    lightBg: 'bg-indigo-500/10 dark:bg-indigo-500/20',
    textColor: 'text-indigo-700 dark:text-indigo-400',
    dotColor: 'bg-indigo-500',
  },
  {
    key: 'economic' as const,
    label: 'Economic',
    letter: 'E',
    icon: DollarSign,
    color: 'bg-emerald-500',
    lightBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    textColor: 'text-emerald-700 dark:text-emerald-400',
    dotColor: 'bg-emerald-500',
  },
  {
    key: 'social' as const,
    label: 'Social',
    letter: 'S',
    icon: Users,
    color: 'bg-amber-500',
    lightBg: 'bg-amber-500/10 dark:bg-amber-500/20',
    textColor: 'text-amber-700 dark:text-amber-400',
    dotColor: 'bg-amber-500',
  },
  {
    key: 'technological' as const,
    label: 'Technological',
    letter: 'T',
    icon: Cpu,
    color: 'bg-sky-500',
    lightBg: 'bg-sky-500/10 dark:bg-sky-500/20',
    textColor: 'text-sky-700 dark:text-sky-400',
    dotColor: 'bg-sky-500',
  },
  {
    key: 'environmental' as const,
    label: 'Environmental',
    letter: 'E',
    icon: Leaf,
    color: 'bg-teal-500',
    lightBg: 'bg-teal-500/10 dark:bg-teal-500/20',
    textColor: 'text-teal-700 dark:text-teal-400',
    dotColor: 'bg-teal-500',
  },
  {
    key: 'legal' as const,
    label: 'Legal',
    letter: 'L',
    icon: Scale,
    color: 'bg-rose-500',
    lightBg: 'bg-rose-500/10 dark:bg-rose-500/20',
    textColor: 'text-rose-700 dark:text-rose-400',
    dotColor: 'bg-rose-500',
  },
];

export function PESTELAnalysis({ data }: PESTELAnalysisProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            PESTEL Analysis
          </CardTitle>
          <CardDescription>
            Macro-environmental factors influencing the training strategy
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* PESTEL Letter Bar */}
          <div className="flex gap-1 mb-6">
            {factors.map((f) => (
              <div
                key={f.key}
                className={`flex-1 ${f.color} text-white text-center py-2 text-sm font-bold first:rounded-l-lg last:rounded-r-lg`}
              >
                {f.letter}
              </div>
            ))}
          </div>

          {/* Factor Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {factors.map((f) => {
              const Icon = f.icon;
              const items = data[f.key] || [];
              return (
                <div
                  key={f.key}
                  className={`${f.lightBg} rounded-xl p-4 border border-transparent`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`${f.color} text-white p-1.5 rounded-md`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <h3 className={`font-semibold text-sm ${f.textColor}`}>{f.label}</h3>
                    <Badge variant="secondary" className="ml-auto text-xs">{items.length}</Badge>
                  </div>
                  <ul className="space-y-2">
                    {items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className={`w-1.5 h-1.5 ${f.dotColor} rounded-full mt-1.5 shrink-0`} />
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

      {data.key_implications && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Key Implications</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">{data.key_implications}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
