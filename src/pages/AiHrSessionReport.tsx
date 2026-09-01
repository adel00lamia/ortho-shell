import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Printer } from 'lucide-react';
import { useDiagnosticSession, useSessionParticipants } from '@/hooks/useDiagnosticEngine';
import { buildCohortInsights } from '@/lib/diagnosticAggregate';
import { CohortInsightsView } from '@/components/diagnostic/CohortInsightsView';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MODULES } from '@/config/diagnosticEngine';

export default function AiHrSessionReport() {
  const { code } = useParams<{ code: string }>();
  const { data: session } = useDiagnosticSession(code);
  const { data: participants = [] } = useSessionParticipants(session?.id);
  const insights = useMemo(() => buildCohortInsights(participants), [participants]);

  const priorities = insights.modules.slice(0, 4).map((m) => ({
    title: m.label,
    summary: MODULES.find((x) => x.title === m.label)?.summary ?? '',
    count: m.count,
  }));

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-6 print:p-0">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">QimataQ · AI × HR Diagnostic Engine</p>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Rapport de diagnostic de session</h1>
          <p className="text-sm text-muted-foreground">
            {session?.title ?? '—'}
            {session?.city ? ` · ${session.city}` : ''}
            {session?.event_date ? ` · ${new Date(session.event_date).toLocaleDateString('fr-FR')}` : ''}
          </p>
        </div>
        <Button variant="outline" className="gap-2 print:hidden" onClick={() => window.print()}>
          <Printer className="h-4 w-4" /> Imprimer / PDF
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Synthèse exécutive</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm leading-relaxed text-muted-foreground">
          <p>
            {insights.count} participant(s) ont réalisé le diagnostic AI × HR. Le score d’opportunité moyen
            s’élève à <strong className="text-foreground">{insights.averageScore}/100</strong>, ce qui traduit
            un potentiel {insights.averageScore >= 60 ? 'élevé' : insights.averageScore >= 40 ? 'significatif' : 'modéré'}
            {' '}de gain de temps grâce à l’IA sur les processus RH observés.
          </p>
          {insights.painPoints[0] && (
            <p>
              L’irritant le plus cité est <strong className="text-foreground">{insights.painPoints[0].label}</strong>.
              {insights.useCases[0] && (
                <> Le cas d’usage le plus prioritaire pour ce groupe est <strong className="text-foreground">{insights.useCases[0].label}</strong>.</>
              )}
            </p>
          )}
          <p className="text-xs">
            Les estimations de gain de temps sont indicatives. Les données présentées sont agrégées et anonymes.
          </p>
        </CardContent>
      </Card>

      <CohortInsightsView insights={insights} />

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Priorités recommandées pour l’atelier</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {priorities.length === 0 && <p className="text-sm text-muted-foreground">Aucune donnée disponible.</p>}
          {priorities.map((p, i) => (
            <div key={p.title} className="rounded-xl border border-border/60 p-3.5">
              <p className="text-sm font-bold text-foreground">{i + 1}. {p.title}</p>
              {p.summary && <p className="text-xs leading-relaxed text-muted-foreground">{p.summary}</p>}
              <p className="mt-1 text-[11px] font-semibold text-primary">Recommandé pour {p.count} participant(s)</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <p className="pt-4 text-center text-[11px] text-muted-foreground">
        © {new Date().getFullYear()} QimataQ — Diagnostiquer → Prioriser → Apprendre → Expérimenter → Mesurer
      </p>
    </div>
  );
}
