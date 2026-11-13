import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ClipboardList, ExternalLink, MessagesSquare, Sparkles, Stethoscope } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDiagnostics } from '@/hooks/useRootCauseDiagnostics';
import { useCompanyEvidencePulses } from '@/hooks/useEvidencePulse';

/**
 * Evidence hub: every field-evidence collection attached to a diagnostic.
 * Only aggregate counts are read here — no respondent-level rows.
 */
export default function EvidenceHub() {
  const { language } = useLanguage();
  const fr = language === 'fr';
  const { data: diagnostics, isLoading: loadingDiag } = useDiagnostics();
  const { data: pulses, isLoading: loadingPulses } = useCompanyEvidencePulses();

  const loading = loadingDiag || loadingPulses;
  const byDiagnostic = (pulses ?? []).reduce<Record<string, typeof pulses>>((acc, p) => {
    acc[p.diagnostic_id] = [...(acc[p.diagnostic_id] ?? []), p];
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{fr ? 'Preuves terrain' : 'Field evidence'}</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {fr
              ? 'Toutes les collectes de preuves rattachées à vos diagnostics. Vous ne voyez que des résultats regroupés et des réponses sans nom.'
              : 'All evidence collections attached to your diagnostics. You only see grouped results and unnamed answers.'}
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/workflow/assess/ai-hr">
            <Sparkles className="mr-2 h-4 w-4" />
            {fr ? 'Qimatak Pulse (atelier)' : 'Qimatak Pulse (workshop)'}
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : (diagnostics ?? []).length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{fr ? 'Aucun diagnostic pour l’instant' : 'No diagnostic yet'}</CardTitle>
            <CardDescription>
              {fr
                ? 'Commencez par décrire un problème de performance : vous pourrez ensuite collecter des preuves terrain.'
                : 'Start by describing a performance problem, then collect field evidence for it.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild size="sm">
              <Link to="/workflow/assess/root-cause">
                <Stethoscope className="mr-2 h-4 w-4" />
                {fr ? 'Diagnostiquer un problème' : 'Diagnose a problem'}
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {(diagnostics ?? []).map((d) => {
            const list = byDiagnostic[d.id] ?? [];
            const responses = list.reduce((s, p) => s + p.responses, 0);
            return (
              <Card key={d.id}>
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">{d.title}</CardTitle>
                      <CardDescription className="mt-1 flex flex-wrap items-center gap-3 text-xs">
                        <span className="inline-flex items-center gap-1">
                          <ClipboardList className="h-3.5 w-3.5" />
                          {list.length} {fr ? 'collecte(s)' : 'collection(s)'}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MessagesSquare className="h-3.5 w-3.5" />
                          {responses} {fr ? 'réponse(s)' : 'response(s)'}
                        </span>
                      </CardDescription>
                    </div>
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/workflow/assess/root-cause?diagnostic=${d.id}`}>
                        <ExternalLink className="mr-2 h-3.5 w-3.5" />
                        {fr ? 'Ouvrir' : 'Open'}
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {list.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      {fr
                        ? 'Aucune preuve collectée. Ouvrez le diagnostic pour lancer une collecte.'
                        : 'No evidence collected yet. Open the diagnostic to start a collection.'}
                    </p>
                  ) : (
                    list.map((p) => (
                      <div
                        key={p.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{p.title}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {p.kind === 'capability'
                              ? fr
                                ? 'Vérification de compétence — réponses écrites relues'
                                : 'Capability check — written answers reviewed'
                              : fr
                                ? 'Questions terrain — résultats regroupés'
                                : 'Field questions — grouped results'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={p.is_open ? 'default' : 'secondary'}>
                            {p.is_open ? (fr ? 'Ouverte' : 'Open') : fr ? 'Fermée' : 'Closed'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {p.responses} {fr ? 'rép.' : 'resp.'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
