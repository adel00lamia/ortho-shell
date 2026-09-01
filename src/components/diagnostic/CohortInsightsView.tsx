import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import type { CohortInsights } from '@/lib/diagnosticAggregate';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
} from 'recharts';
import { Users, Gauge } from 'lucide-react';

function RankedList({ title, items, max }: { title: string; items: { label: string; count: number }[]; max?: number }) {
  const top = max ? items.slice(0, max) : items;
  const highest = Math.max(1, ...top.map((i) => i.count));
  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-sm">{title}</CardTitle></CardHeader>
      <CardContent className="space-y-2.5">
        {top.length === 0 && <p className="text-xs text-muted-foreground">Aucune donnée.</p>}
        {top.map((i) => (
          <div key={i.label} className="space-y-1">
            <div className="flex items-start justify-between gap-3 text-xs">
              <span className="text-muted-foreground">{i.label}</span>
              <span className="shrink-0 font-bold text-foreground">{i.count}</span>
            </div>
            <Progress value={(i.count / highest) * 100} className="h-1" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function CohortInsightsView({ insights, compact = false }: { insights: CohortInsights; compact?: boolean }) {
  const radar = insights.averageDimensions.map((d) => ({ dim: d.short, value: d.value }));

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex items-center gap-4 p-5">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <p className="text-3xl font-extrabold text-foreground">{insights.count}</p>
              <p className="text-xs text-muted-foreground">Participants</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex items-center gap-4 p-5">
            <Gauge className="h-8 w-8 text-primary" />
            <div>
              <p className="text-3xl font-extrabold text-foreground">{insights.averageScore}<span className="text-base text-muted-foreground">/100</span></p>
              <p className="text-xs text-muted-foreground">Opportunity Score moyen</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Profil moyen du groupe</CardTitle></CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radar} outerRadius="70%">
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="dim" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.35} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Maturité IA du groupe</CardTitle></CardHeader>
          <CardContent className="space-y-2.5">
            {insights.maturity.map((m) => (
              <div key={m.label} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{m.label}</span>
                  <span className="font-bold text-foreground">{m.count}</span>
                </div>
                <Progress value={insights.count ? (m.count / insights.count) * 100 : 0} className="h-1.5" />
              </div>
            ))}
            <div className="flex flex-wrap gap-1.5 pt-2">
              {insights.roles.map((r) => (
                <Badge key={r.key} variant="secondary" className="text-[10px]">{r.label} · {r.count}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <RankedList title="Top 10 irritants" items={insights.painPoints} max={10} />
        <RankedList title="Top 10 cas d’usage IA demandés" items={insights.useCases} max={10} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <RankedList title="Modules de formation les plus recommandés" items={insights.modules} max={10} />
        <RankedList title="Principales préoccupations vis-à-vis de l’IA" items={insights.concerns} max={8} />
      </div>

      {!compact && insights.openAnswers.length > 0 && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Verbatims (anonymes)</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {insights.openAnswers.slice(0, 12).map((a, i) => (
              <p key={i} className="rounded-lg bg-muted/40 p-2.5 text-xs italic leading-relaxed text-muted-foreground">
                « {a} »
              </p>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
