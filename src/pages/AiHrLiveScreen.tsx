import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Users, Gauge, Sparkles } from 'lucide-react';
import { useDiagnosticRealtime, useDiagnosticSession, useSessionParticipants } from '@/hooks/useDiagnosticEngine';
import { buildCohortInsights } from '@/lib/diagnosticAggregate';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

export default function AiHrLiveScreen() {
  const { code } = useParams<{ code: string }>();
  const { data: session } = useDiagnosticSession(code);
  const { data: participants = [] } = useSessionParticipants(session?.id, 15000);
  useDiagnosticRealtime(session?.id);
  const insights = useMemo(() => buildCohortInsights(participants), [participants]);

  const url = `${window.location.origin}/pulse/${code}`;

  return (
    <div className="min-h-screen bg-background p-6 lg:p-10">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-6">
        <div>
          <div className="mb-1.5 flex items-center gap-2">
            <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-sm font-extrabold text-primary">Qimatak</span>
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">AI × HR Live</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground lg:text-4xl">
            {session?.title ?? 'Session'}
          </h1>
          <p className="text-sm text-muted-foreground">Résultats agrégés et anonymes — mise à jour automatique</p>
        </div>
        <div className="flex items-center gap-4 rounded-2xl border border-border/60 bg-card/60 p-4">
          <div className="rounded-xl bg-white p-2"><QRCodeSVG value={url} size={92} /></div>
          <div className="text-xs">
            <p className="font-bold text-foreground">Scannez pour participer</p>
            <p className="font-mono text-muted-foreground">{code}</p>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <StatCard icon={Users} value={String(insights.count)} label="Participants" />
        <StatCard icon={Gauge} value={`${insights.averageScore}/100`} label="Opportunity Score moyen" />
        <StatCard
          icon={Sparkles}
          value={insights.roles[0]?.label ?? '—'}
          label="Fonction la plus représentée"
          small
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <BigList title="Top irritants du groupe" items={insights.painPoints.slice(0, 8)} total={insights.count} />
        <BigList title="Cas d’usage IA les plus demandés" items={insights.useCases.slice(0, 8)} total={insights.count} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-lg">Maturité IA</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {insights.maturity.map((m) => (
              <div key={m.label} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{m.label}</span>
                  <span className="font-bold text-foreground">{m.count}</span>
                </div>
                <Progress value={insights.count ? (m.count / insights.count) * 100 : 0} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-lg">Fonctions présentes</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {insights.roles.length === 0 && <p className="text-sm text-muted-foreground">En attente de participants…</p>}
            {insights.roles.map((r) => (
              <Badge key={r.key} variant="secondary" className="text-sm">{r.label} · {r.count}</Badge>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, value, label, small }: { icon: typeof Users; value: string; label: string; small?: boolean }) {
  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-card">
      <CardContent className="flex items-center gap-5 p-6">
        <Icon className="h-10 w-10 shrink-0 text-primary" />
        <div className="min-w-0">
          <p className={small ? 'truncate text-xl font-extrabold text-foreground' : 'text-4xl font-extrabold text-foreground'}>
            {value}
          </p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function BigList({ title, items, total }: { title: string; items: { label: string; count: number }[]; total: number }) {
  const highest = Math.max(1, ...items.map((i) => i.count));
  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">{title}</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 && <p className="text-sm text-muted-foreground">En attente de réponses…</p>}
        {items.map((i, idx) => (
          <motion.div
            key={i.label}
            layout
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-1"
          >
            <div className="flex justify-between gap-4 text-sm">
              <span className="text-foreground">{idx + 1}. {i.label}</span>
              <span className="shrink-0 font-bold text-primary">
                {i.count}{total ? ` (${Math.round((i.count / total) * 100)}%)` : ''}
              </span>
            </div>
            <Progress value={(i.count / highest) * 100} className="h-2" />
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
}
