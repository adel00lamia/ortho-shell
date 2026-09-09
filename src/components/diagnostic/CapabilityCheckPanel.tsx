import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Copy, Loader2, ShieldQuestion, Save, Users } from 'lucide-react';
import { toast } from 'sonner';
import {
  useCreateEvidencePulse,
  useEvidencePulses,
  useSaveCapabilityVerification,
  useTogglePulseOpen,
} from '@/hooks/useEvidencePulse';
import { buildCapabilityScenarios, type PulseQuestion } from '@/lib/evidencePulse';
import type { DiagnosticRow } from '@/hooks/useRootCauseDiagnostics';

/**
 * Practical scenario-based capability verification: before recommending broad
 * training, ask a few job-realistic questions and read the written answers.
 * Deliberately not presented as a validated assessment.
 */
export function CapabilityCheckPanel({
  diagnostic,
  language = 'fr',
}: {
  diagnostic: DiagnosticRow;
  language?: 'fr' | 'en';
}) {
  const fr = language === 'fr';
  const { data: pulses = [], isLoading } = useEvidencePulses(diagnostic.id, 'capability');
  const create = useCreateEvidencePulse(diagnostic.id);
  const toggle = useTogglePulseOpen(diagnostic.id);
  const save = useSaveCapabilityVerification();

  const scenarios = useMemo<PulseQuestion[]>(
    () =>
      buildCapabilityScenarios(
        {
          problem: diagnostic.problem_description,
          population: diagnostic.affected_population,
          department: diagnostic.department,
        },
        fr
      ),
    [diagnostic.problem_description, diagnostic.affected_population, diagnostic.department, fr]
  );

  const [selected, setSelected] = useState<string[]>(scenarios.slice(0, 3).map((s) => s.id));
  const [edited, setEdited] = useState<Record<string, string>>({});
  const verification = (diagnostic.capability_verification ?? {}) as {
    respondents?: number;
    gap_confirmed?: number;
    trainable_headcount?: number;
    note?: string;
    verified_at?: string;
  };
  const [gapConfirmed, setGapConfirmed] = useState(String(verification.gap_confirmed ?? ''));
  const [note, setNote] = useState(verification.note ?? '');

  const questions = scenarios
    .filter((s) => selected.includes(s.id))
    .map((s) => ({ ...s, text: edited[s.id] ?? s.text }));

  const pulse = pulses[0];
  const respondents = pulse?.summary.responses ?? 0;
  const invited = diagnostic.headcount_affected ?? null;
  const gapPct =
    respondents > 0 && gapConfirmed !== '' ? Math.round((Number(gapConfirmed) / respondents) * 100) : null;
  const confidence =
    respondents === 0 ? null : respondents < 3 ? (fr ? 'faible' : 'low') : respondents < 8 ? (fr ? 'moyenne' : 'medium') : (fr ? 'bonne' : 'good');

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldQuestion className="h-4 w-4 text-primary" />
            {fr ? 'Vérifier la compétence avant de former' : 'Verify capability before training'}
          </CardTitle>
          <CardDescription>
            {fr
              ? 'Quelques mises en situation réelles, en réponses courtes écrites. Vérification pratique, non scientifiquement validée — elle sert à savoir si le manque de savoir-faire est réel.'
              : 'A few real work scenarios answered in short writing. A practical check, not scientifically validated — it tells you whether the know-how gap is real.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!pulse ? (
            <>
              <div className="space-y-2">
                <Label className="text-xs">{fr ? 'Mises en situation (2 à 5)' : 'Scenarios (2 to 5)'}</Label>
                {scenarios.map((s) => (
                  <div key={s.id} className="space-y-1.5 rounded-lg border border-border/60 p-2.5">
                    <label className="flex cursor-pointer items-start gap-2 text-sm">
                      <Checkbox
                        checked={selected.includes(s.id)}
                        onCheckedChange={() =>
                          setSelected((prev) =>
                            prev.includes(s.id) ? prev.filter((x) => x !== s.id) : prev.length >= 5 ? prev : [...prev, s.id]
                          )
                        }
                      />
                      <span className="text-muted-foreground">{fr ? 'Inclure' : 'Include'}</span>
                    </label>
                    <Textarea
                      rows={2}
                      value={edited[s.id] ?? s.text}
                      onChange={(e) => setEdited((prev) => ({ ...prev, [s.id]: e.target.value.slice(0, 300) }))}
                      disabled={!selected.includes(s.id)}
                    />
                  </div>
                ))}
              </div>
              <Button
                disabled={create.isPending || questions.length < 2}
                onClick={() =>
                  create.mutate({
                    title: fr ? 'Mises en situation — votre façon de travailler' : 'Work scenarios — how you work',
                    audience: 'employees',
                    locale: fr ? 'fr' : 'en',
                    questions,
                    allow_identity: false,
                    kind: 'capability',
                  })
                }
              >
                {create.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldQuestion className="mr-2 h-4 w-4" />}
                {fr ? 'Créer la vérification' : 'Create the check'}
              </Button>
            </>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={pulse.is_open ? 'default' : 'secondary'}>
                  {pulse.is_open ? (fr ? 'Ouverte' : 'Open') : fr ? 'Fermée' : 'Closed'}
                </Badge>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" />
                  {respondents} {fr ? 'réponse(s)' : 'response(s)'}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/preuves/${pulse.code}`);
                    toast.success(fr ? 'Lien copié' : 'Link copied');
                  }}
                >
                  <Copy className="mr-1.5 h-3.5 w-3.5" />
                  {pulse.code}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => toggle.mutate({ id: pulse.id, is_open: !pulse.is_open })}>
                  {pulse.is_open ? (fr ? 'Clôturer' : 'Close') : fr ? 'Réouvrir' : 'Reopen'}
                </Button>
              </div>

              <div className="grid gap-2 rounded-lg bg-muted/40 p-3 text-xs sm:grid-cols-3">
                <p className="text-muted-foreground">
                  {fr ? 'Invitées' : 'Invited'} :{' '}
                  <span className="font-semibold text-foreground">{invited ?? (fr ? 'non précisé' : 'not set')}</span>
                </p>
                <p className="text-muted-foreground">
                  {fr ? 'Réponses' : 'Responded'} : <span className="font-semibold text-foreground">{respondents}</span>
                </p>
                <p className="text-muted-foreground">
                  {fr ? 'Écart confirmé (provisoire)' : 'Confirmed gap (provisional)'} :{' '}
                  <span className="font-semibold text-foreground">
                    {gapPct === null ? (fr ? '—' : '—') : `${gapPct}%`}
                  </span>
                </p>
                <p className="text-muted-foreground sm:col-span-3">
                  {fr ? 'Fiabilité de l’échantillon' : 'Sample reliability'} :{' '}
                  <span className="font-semibold text-foreground">{confidence ?? (fr ? 'aucune donnée' : 'no data')}</span>
                  {' — '}
                  {fr
                    ? 'vérification pratique par mises en situation, méthodologie pilote, ce n’est pas un test psychométrique validé scientifiquement.'
                    : 'practical scenario-based verification, pilot methodology, not a scientifically validated psychometric test.'}
                </p>
              </div>

              {respondents === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {fr
                    ? 'Partagez le lien ci-dessus avec les personnes concernées : aucun compte n’est nécessaire.'
                    : 'Share the link above with the people concerned: no account is needed.'}
                </p>
              ) : (
                <div className="space-y-3">
                  <p className="text-[11px] text-muted-foreground">
                    {fr
                      ? 'Réponses regroupées et anonymes : aucune réponse individuelle n’est reliée à une personne.'
                      : 'Answers are grouped and anonymous: no individual answer is linked to a person.'}
                  </p>
                  {pulse.summary.questions.map((q) => (
                    <div key={q.id} className="space-y-1.5 rounded-lg border border-border/60 p-3">
                      <p className="text-xs font-semibold text-foreground">{q.question}</p>
                      {(q.texts ?? []).length === 0 ? (
                        <p className="text-xs text-muted-foreground">{fr ? 'Aucune réponse écrite.' : 'No written answer.'}</p>
                      ) : (
                        (q.texts ?? []).map((txt, i) => (
                          <p key={i} className="text-xs text-foreground">« {txt} »</p>
                        ))
                      )}
                    </div>
                  ))}
                  {pulse.summary.comments.length > 0 && (
                    <div className="space-y-1 rounded-lg border border-border/60 p-3">
                      <p className="text-xs font-semibold text-foreground">{fr ? 'Commentaires libres' : 'Free comments'}</p>
                      {pulse.summary.comments.map((c, i) => (
                        <p key={i} className="text-xs italic text-muted-foreground">« {c} »</p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-3 rounded-lg bg-muted/40 p-3">
                <p className="text-xs font-semibold text-foreground">
                  {fr ? 'Votre conclusion de vérification' : 'Your verification conclusion'}
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">
                      {fr ? 'Personnes avec un vrai manque de savoir-faire' : 'People with a real know-how gap'}
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      value={gapConfirmed}
                      onChange={(e) => setGapConfirmed(e.target.value)}
                      placeholder={diagnostic.headcount_affected ? String(diagnostic.headcount_affected) : '0'}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">{fr ? 'Note (facultatif)' : 'Note (optional)'}</Label>
                    <Input value={note} onChange={(e) => setNote(e.target.value.slice(0, 300))} />
                  </div>
                </div>
                <Button
                  size="sm"
                  disabled={save.isPending || gapConfirmed === ''}
                  onClick={() =>
                    save.mutate({
                      diagnosticId: diagnostic.id,
                      result: {
                        verified_at: new Date().toISOString(),
                        respondents,
                        invited: invited ?? undefined,
                        gap_confirmed_pct: gapPct ?? undefined,
                        method: 'practical_scenarios_pilot',
                        gap_confirmed: Number(gapConfirmed) || 0,
                        trainable_headcount: Number(gapConfirmed) || 0,
                        note: note || undefined,
                        pulse_code: pulse.code,
                      },
                    })
                  }
                >
                  {save.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {fr ? 'Enregistrer et affiner la recommandation' : 'Save and refine the recommendation'}
                </Button>
                {verification.verified_at && (
                  <p className="text-[11px] text-muted-foreground">
                    {fr
                      ? `Dernière vérification : ${verification.gap_confirmed ?? 0} personne(s) à former sur ${verification.respondents ?? 0} réponse(s).`
                      : `Last check: ${verification.gap_confirmed ?? 0} person(s) to train out of ${verification.respondents ?? 0} response(s).`}
                  </p>
                )}
              </div>
            </>
          )}
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </CardContent>
      </Card>
    </div>
  );
}
