import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Copy, RefreshCw, Radio, Lock, Users, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import {
  PULSE_AUDIENCES,
  useCreateEvidencePulse,
  useEvidencePulses,
  useReassessFromPulse,
  useTogglePulseOpen,
} from '@/hooks/useEvidencePulse';
import { toPulseQuestion, type PulseQuestion } from '@/lib/evidencePulse';
import type { DiagnosticRow } from '@/hooks/useRootCauseDiagnostics';

export function EvidencePulsePanel({
  diagnostic,
  language = 'fr',
  onReassessed,
}: {
  diagnostic: DiagnosticRow;
  language?: 'fr' | 'en';
  onReassessed?: (id: string) => void;
}) {
  const fr = language === 'fr';
  const { data: pulses = [], isLoading } = useEvidencePulses(diagnostic.id);
  const create = useCreateEvidencePulse(diagnostic.id);
  const toggle = useTogglePulseOpen(diagnostic.id);
  const reassess = useReassessFromPulse();

  const candidates = useMemo<PulseQuestion[]>(
    () => (diagnostic.missing_evidence ?? []).slice(0, 8).map(toPulseQuestion),
    [diagnostic.missing_evidence]
  );

  const [selected, setSelected] = useState<string[]>(candidates.slice(0, 3).map((q) => q.id));
  const [audience, setAudience] = useState<string>('employees');
  const [allowIdentity, setAllowIdentity] = useState(false);
  const [title, setTitle] = useState(
    fr ? 'Quelques questions rapides sur votre quotidien' : 'A few quick questions about your daily work'
  );

  const toggleQuestion = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((q) => q !== id) : prev.length >= 5 ? prev : [...prev, id]));

  const handleCreate = () => {
    create.mutate({
      title,
      audience,
      locale: fr ? 'fr' : 'en',
      questions: candidates.filter((q) => selected.includes(q.id)),
      allow_identity: allowIdentity,
    });
  };

  const shareUrl = (code: string) => `${window.location.origin}/preuves/${code}`;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Radio className="h-4 w-4 text-primary" />
            {fr ? 'Collecter les preuves' : 'Collect the evidence'}
          </CardTitle>
          <CardDescription>
            {fr
              ? 'Envoyez 1 à 5 questions au terrain, en anonyme. Les réponses servent à réévaluer le diagnostic sans écraser la version initiale.'
              : 'Send 1 to 5 anonymous questions to the field. Answers are used to reassess the diagnosis without overwriting the original version.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {candidates.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {fr
                ? 'Aucune preuve manquante identifiée pour ce diagnostic : la collecte terrain n’est pas nécessaire.'
                : 'No missing evidence identified for this diagnosis: a field pulse is not needed.'}
            </p>
          ) : (
            <>
              <div className="space-y-2">
                <Label className="text-xs">{fr ? 'Questions à poser' : 'Questions to ask'}</Label>
                {candidates.map((q) => (
                  <label
                    key={q.id}
                    className="flex cursor-pointer items-start gap-2 rounded-lg border border-border/60 p-2.5 text-sm hover:bg-muted/40"
                  >
                    <Checkbox checked={selected.includes(q.id)} onCheckedChange={() => toggleQuestion(q.id)} />
                    <span className="text-foreground">{q.text}</span>
                  </label>
                ))}
                <p className="text-[11px] text-muted-foreground">
                  {selected.length}/5 {fr ? 'sélectionnées' : 'selected'}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">{fr ? 'Titre vu par les répondants' : 'Title respondents see'}</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{fr ? 'Public interrogé' : 'Audience'}</Label>
                  <Select value={audience} onValueChange={setAudience}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PULSE_AUDIENCES.map((a) => (
                        <SelectItem key={a.value} value={a.value}>{fr ? a.fr : a.en}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <label className="flex items-start gap-2 text-xs text-muted-foreground">
                <Checkbox checked={allowIdentity} onCheckedChange={(v) => setAllowIdentity(!!v)} />
                <span>
                  {fr
                    ? 'Proposer (facultatif) de laisser son nom. Par défaut, les réponses sont anonymes.'
                    : 'Optionally offer respondents to leave their name. Answers are anonymous by default.'}
                </span>
              </label>

              <Button onClick={handleCreate} disabled={create.isPending || selected.length === 0}>
                {create.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Radio className="mr-2 h-4 w-4" />}
                {fr ? 'Créer la collecte' : 'Create the pulse'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}

      {pulses.map((pulse) => {
        const answered = pulse.summary.responses;
        return (
          <Card key={pulse.id}>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base">{pulse.title}</CardTitle>
                  <CardDescription className="flex flex-wrap items-center gap-2 pt-1">
                    <Badge variant={pulse.is_open ? 'default' : 'secondary'}>
                      {pulse.is_open ? (fr ? 'Ouverte' : 'Open') : fr ? 'Fermée' : 'Closed'}
                    </Badge>
                    <span className="flex items-center gap-1 text-xs">
                      <Users className="h-3 w-3" />
                      {answered} {fr ? 'réponse(s)' : 'response(s)'}
                    </span>
                    {!pulse.allow_identity && (
                      <span className="flex items-center gap-1 text-xs">
                        <Lock className="h-3 w-3" />
                        {fr ? 'anonyme' : 'anonymous'}
                      </span>
                    )}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(shareUrl(pulse.code));
                      toast.success(fr ? 'Lien copié' : 'Link copied');
                    }}
                  >
                    <Copy className="mr-1.5 h-3.5 w-3.5" />
                    {pulse.code}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggle.mutate({ id: pulse.id, is_open: !pulse.is_open })}
                  >
                    {pulse.is_open ? (fr ? 'Clôturer' : 'Close') : fr ? 'Réouvrir' : 'Reopen'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {answered === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {fr ? 'Aucune réponse pour le moment. Partagez le lien ci-dessus.' : 'No responses yet. Share the link above.'}
                </p>
              ) : (
                <>
                  {pulse.summary.questions.map((q) => (
                    <div key={q.id} className="space-y-1">
                      <div className="flex items-start justify-between gap-2 text-sm">
                        <span className="text-foreground">{q.question}</span>
                        <span className="shrink-0 tabular-nums text-muted-foreground">
                          {q.agreement === null ? '—' : `${q.agreement}%`}
                        </span>
                      </div>
                      <Progress value={q.agreement ?? 0} className="h-2" />
                      <p className="text-[11px] text-muted-foreground">
                        {q.answers} {fr ? 'réponse(s)' : 'answer(s)'}
                        {q.unknown > 0 && (fr ? ` · ${q.unknown} « je ne sais pas »` : ` · ${q.unknown} "don't know"`)}
                      </p>
                    </div>
                  ))}

                  {pulse.summary.comments.length > 0 && (
                    <div className="space-y-1.5 rounded-lg bg-muted/40 p-3">
                      <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                        <MessageSquare className="h-3.5 w-3.5" />
                        {fr ? 'Commentaires du terrain' : 'Field comments'}
                      </p>
                      {pulse.summary.comments.map((c, i) => (
                        <p key={i} className="text-xs italic text-muted-foreground">« {c} »</p>
                      ))}
                    </div>
                  )}

                  <Button
                    variant="outline"
                    disabled={reassess.isPending}
                    onClick={() =>
                      reassess.mutate(
                        {
                          base: diagnostic,
                          pulse: {
                            responses: pulse.summary.responses,
                            audience: pulse.audience,
                            questions: pulse.summary.questions.map((q) => ({
                              question: q.question,
                              agreement: q.agreement,
                              answers: q.answers,
                            })),
                            comments: pulse.summary.comments,
                          },
                          language: fr ? 'fr' : 'en',
                        },
                        {
                          onSuccess: (res) => {
                            toast.success(
                              fr
                                ? `Nouvelle version créée · confiance ${res.before.confidence}% → ${res.after.confidence}%`
                                : `New version created · confidence ${res.before.confidence}% → ${res.after.confidence}%`
                            );
                            onReassessed?.(res.diagnosticId);
                          },
                        }
                      )
                    }
                  >
                    {reassess.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    {fr ? 'Réévaluer avec ces preuves' : 'Reassess with this evidence'}
                  </Button>
                  <p className="text-[11px] text-muted-foreground">
                    {fr
                      ? 'La version initiale est conservée comme référence : une nouvelle version est ajoutée.'
                      : 'The original version is kept as the baseline: a new version is added.'}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
