import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, CheckCircle2, Lock, ShieldCheck } from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { PULSE_ANSWER_OPTIONS } from '@/lib/evidencePulse';
import { usePublicPulse, useSubmitPulse } from '@/hooks/useEvidencePulse';

export default function EvidencePulsePublic() {
  const { code } = useParams<{ code: string }>();
  const { data: pulse, isLoading, isError } = usePublicPulse(code);
  const submit = useSubmitPulse();

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [freeText, setFreeText] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [done, setDone] = useState(false);
  // One-time token so a reload of this page cannot duplicate the same answer set.
  const [token] = useState(() =>
    typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : String(Date.now())
  );

  const fr = (pulse?.locale ?? 'fr') === 'fr';
  const isCapability = pulse?.kind === 'capability';
  const questions = pulse?.questions ?? [];
  const complete = useMemo(
    () => questions.length > 0 && questions.every((q) => !!answers[q.id]),
    [questions, answers]
  );


  const shell = (children: React.ReactNode) => (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-4 py-10">
      <Seo
        title="Qimatak — Questions terrain"
        description="Quelques questions rapides et anonymes pour comprendre ce qui bloque réellement le travail au quotidien."
        noindex
      />
      {children}
    </main>
  );

  if (isLoading) {
    return shell(
      <div className="flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !pulse) {
    return shell(
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Lien invalide</CardTitle>
          <CardDescription>
            Ce code de collecte n’existe pas ou n’est plus disponible. Vérifiez le lien reçu.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!pulse.is_open) {
    return shell(
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{fr ? 'Collecte clôturée' : 'Pulse closed'}</CardTitle>
          <CardDescription>
            {fr
              ? 'Merci de votre intérêt : cette collecte est terminée et n’accepte plus de réponses.'
              : 'Thanks for your interest: this pulse is closed and no longer accepts answers.'}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (done) {
    return shell(
      <Card>
        <CardHeader className="items-center text-center">
          <CheckCircle2 className="mb-2 h-10 w-10 text-primary" />
          <CardTitle className="text-lg">{fr ? 'Merci !' : 'Thank you!'}</CardTitle>
          <CardDescription>
            {fr
              ? 'Votre réponse est enregistrée. Elle sera agrégée avec les autres, sans être lue individuellement.'
              : 'Your answer is recorded. It will be aggregated with the others, never read individually.'}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return shell(
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{pulse.title}</CardTitle>
        <CardDescription className="flex items-start gap-1.5">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          {isCapability
            ? fr
              ? 'Environ 5 minutes. Vos réponses écrites seront lues par les personnes autorisées de votre entreprise pour comprendre la pratique réelle du métier. Votre nom n’est pas demandé, mais le contenu de vos réponses sera visible.'
              : 'About 5 minutes. Your written answers will be read by authorised people in your company to understand real working practice. Your name is not requested, but the content of your answers will be visible.'
            : pulse.allow_identity
              ? fr
                ? '2 minutes. Vos réponses sont regroupées. Si vous choisissez de laisser votre nom et votre fonction, ils pourront être vus par les personnes autorisées de votre entreprise.'
                : '2 minutes. Your answers are grouped. If you choose to leave your name and role, authorised people in your company may see them.'
              : fr
                ? '2 minutes. Réponses anonymes : aucune identité n’est enregistrée, et votre entreprise ne voit que des résultats regroupés et des commentaires sans nom.'
                : '2 minutes. Anonymous answers: no identity is stored, and your company only sees grouped results and unnamed comments.'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {questions.map((q, i) => (
          <fieldset key={q.id} className="space-y-2">
            <legend className="text-sm font-medium text-foreground">
              {i + 1}. {q.text}
            </legend>
            {q.type === 'text' ? (
              <Textarea
                rows={4}
                value={answers[q.id] ?? ''}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value.slice(0, 800) }))}
                placeholder={fr ? 'Répondez avec vos mots, en quelques phrases…' : 'Answer in your own words, a few sentences…'}
              />
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {PULSE_ANSWER_OPTIONS.map((opt) => {
                  const active = answers[q.id] === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: opt.value }))}
                      aria-pressed={active}
                      className={`rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
                        active
                          ? 'border-primary bg-primary/10 font-medium text-foreground'
                          : 'border-border text-muted-foreground hover:bg-muted/50'
                      }`}
                    >
                      {fr ? opt.fr : opt.en}
                    </button>
                  );
                })}
              </div>
            )}
          </fieldset>
        ))}


        <div className="space-y-1.5">
          <Label className="text-xs">
            {fr ? 'Un exemple concret ? (facultatif)' : 'A concrete example? (optional)'}
          </Label>
          <Textarea
            value={freeText}
            onChange={(e) => setFreeText(e.target.value.slice(0, 500))}
            rows={3}
            placeholder={fr ? 'Ce qui vous ralentit le plus…' : 'What slows you down most…'}
          />
        </div>

        {pulse.allow_identity ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">{fr ? 'Nom (facultatif)' : 'Name (optional)'}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{fr ? 'Poste (facultatif)' : 'Role (optional)'}</Label>
              <Input value={role} onChange={(e) => setRole(e.target.value)} maxLength={80} />
            </div>
          </div>
        ) : (
          <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Lock className="h-3 w-3" />
            {fr ? 'Aucune identité n’est demandée ni enregistrée.' : 'No identity is requested or stored.'}
          </p>
        )}

        <Button
          className="w-full"
          disabled={!complete || submit.isPending}
          onClick={() =>
            submit.mutate(
              {
                code: pulse.code,
                answers,
                free_text: freeText.trim() || undefined,
                name: pulse.allow_identity ? name.trim() || undefined : undefined,
                role: pulse.allow_identity ? role.trim() || undefined : undefined,
                token,

              },
              { onSuccess: () => setDone(true) }
            )
          }
        >
          {submit.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {fr ? 'Envoyer mes réponses' : 'Send my answers'}
        </Button>
        {submit.isError && (
          <p className="text-center text-xs text-destructive">
            {fr ? 'Envoi impossible. Réessayez dans un instant.' : 'Could not send. Please try again.'}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
