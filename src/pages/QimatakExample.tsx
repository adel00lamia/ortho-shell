import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ArrowRight, ChevronDown, Info, Sparkles } from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { useLanguage } from '@/contexts/LanguageContext';
import { CAUSE_LABELS, type CauseKey } from '@/lib/rootCauseModel';

/**
 * Public, static walkthrough of a Qimatak case. All figures are illustrative
 * and clearly labelled as fictional — no client, no real company data.
 */
const CAUSES: Array<{ key: CauseKey; pct: number; for: string[]; against: string[]; strength: string }> = [
  {
    key: 'process',
    pct: 28,
    for: [
      'La procédure de traitement des réclamations a changé en janvier sans support écrit.',
      '3 agents sur 5 décrivent une étape différente pour le même cas.',
    ],
    against: ['Les cas simples sont traités correctement.'],
    strength: 'strong',
  },
  {
    key: 'management',
    pct: 22,
    for: ['Les points hebdomadaires de feedback ont été arrêtés depuis 4 mois.'],
    against: ['Deux superviseurs continuent leurs points individuels.'],
    strength: 'moderate',
  },
  {
    key: 'skill',
    pct: 18,
    for: ['Les nouveaux agents (moins de 6 mois) génèrent 60 % des réclamations remontées.'],
    against: ['Les agents expérimentés atteignent la cible avec les mêmes outils.'],
    strength: 'moderate',
  },
  {
    key: 'tools_data',
    pct: 14,
    for: ['L’historique client n’est pas visible dans l’outil de ticket.'],
    against: [],
    strength: 'weak',
  },
  {
    key: 'capacity_organization',
    pct: 10,
    for: ['Pic d’appels non couvert entre 11 h et 14 h.'],
    against: [],
    strength: 'weak',
  },
  { key: 'clarity', pct: 5, for: ['Objectif de qualité non communiqué par écrit.'], against: [], strength: 'weak' },
  { key: 'incentives', pct: 3, for: [], against: ['Aucun signal de démotivation liée à la rémunération.'], strength: 'weak' },
];

export default function QimatakExample() {
  const { language } = useLanguage();
  const fr = language === 'fr';
  const [open, setOpen] = useState<CauseKey | null>('process');

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title={fr ? 'Exemple de diagnostic Qimatak' : 'Qimatak diagnostic example'}
        description={
          fr
            ? 'Exemple illustratif : d’un problème métier au diagnostic des causes, au Training Fit Score, au plan d’action et à la mesure d’impact.'
            : 'Illustrative example: from a business problem to root-cause diagnosis, Training Fit Score, action plan and impact measurement.'
        }
        path="/exemple"
      />

      <div className="mx-auto max-w-4xl space-y-6 px-4 py-10">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-primary/40 text-primary">
              <Sparkles className="mr-1 h-3 w-3" /> Qimatak
            </Badge>
            <Badge variant="secondary">{fr ? 'Exemple fictif' : 'Fictional example'}</Badge>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">
            {fr ? 'Un cas de bout en bout' : 'One case, end to end'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {fr
              ? 'Cet exemple est entièrement fictif et sert uniquement à illustrer la démarche : problème → preuves → causes → décision → impact. Aucune donnée client réelle.'
              : 'This example is entirely fictional and only illustrates the approach: problem → evidence → causes → decision → impact. No real client data.'}
          </p>
        </motion.div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{fr ? '1. Le problème métier' : '1. The business problem'}</CardTitle>
            <CardDescription>
              {fr
                ? 'Les réclamations clients ont augmenté de 30 % en trois mois dans un centre de relation client de 42 personnes.'
                : 'Customer complaints rose 30% in three months in a 42-person customer service centre.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {fr
              ? 'La direction envisage une formation « qualité de service » pour toute l’équipe. Qimatak commence par vérifier si c’est vraiment le blocage.'
              : 'Management considers a "service quality" training for the whole team. Qimatak starts by checking whether that is really the blocker.'}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{fr ? '2. Les preuves recueillies' : '2. Evidence collected'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• {fr ? '18 réponses anonymes du terrain (lien de collecte)' : '18 anonymous field answers (collection link)'}</p>
            <p>• {fr ? 'Export des réclamations sur 6 mois' : '6-month complaint export'}</p>
            <p>• {fr ? '4 entretiens superviseurs' : '4 supervisor interviews'}</p>
            <p>• {fr ? '5 mises en situation pratiques pour vérifier le savoir-faire' : '5 practical scenarios to verify know-how'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{fr ? '3. Les causes probables' : '3. Probable causes'}</CardTitle>
            <CardDescription>
              {fr
                ? 'Des hypothèses appuyées sur des preuves, pas des certitudes. Ouvrez une cause pour voir ce qui la soutient et ce qui la contredit.'
                : 'Evidence-supported hypotheses, not certainties. Open a cause to see what supports and what contradicts it.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {CAUSES.map((c) => (
              <div key={c.key} className="rounded-lg border border-border/60 p-3">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 text-left"
                  onClick={() => setOpen(open === c.key ? null : c.key)}
                >
                  <span className="text-sm font-medium text-foreground">{CAUSE_LABELS[fr ? 'fr' : 'en'][c.key]}</span>
                  <span className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-primary">{c.pct}%</span>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open === c.key ? 'rotate-180' : ''}`} />
                  </span>
                </button>
                <Progress value={c.pct} className="mt-2 h-1.5" />
                {open === c.key && (
                  <div className="mt-3 space-y-2 text-xs">
                    <p className="text-muted-foreground">
                      {fr ? 'Force de la preuve' : 'Evidence strength'} : <span className="font-semibold text-foreground">{c.strength}</span>
                    </p>
                    {c.for.length > 0 && (
                      <div>
                        <p className="font-semibold text-foreground">{fr ? 'Ce qui soutient' : 'What supports it'}</p>
                        {c.for.map((e, i) => <p key={i} className="text-muted-foreground">• {e}</p>)}
                      </div>
                    )}
                    {c.against.length > 0 && (
                      <div>
                        <p className="font-semibold text-foreground">{fr ? 'Ce qui contredit' : 'What contradicts it'}</p>
                        {c.against.map((e, i) => <p key={i} className="text-muted-foreground">• {e}</p>)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{fr ? '4. Training Fit Score' : '4. Training Fit Score'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-end gap-3">
              <span className="text-4xl font-extrabold text-foreground">34</span>
              <span className="pb-1 text-sm text-muted-foreground">/100</span>
              <Badge variant="secondary">{fr ? 'La formation n’est pas la réponse principale' : 'Training is not the main answer'}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {fr
                ? 'Le score reste bas parce que les agents expérimentés réussissent avec les mêmes outils : le savoir-faire n’est pas le premier blocage. Une formation ciblée reste utile pour les nouveaux arrivants.'
                : 'The score stays low because experienced agents succeed with the same tools: know-how is not the first blocker. Targeted training remains useful for newcomers.'}
            </p>
            <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {fr
                ? 'Confiance du diagnostic : moyenne. Elle augmenterait avec le détail des réclamations par agent et par type de cas.'
                : 'Diagnostic confidence: medium. It would rise with complaint detail per agent and per case type.'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{fr ? '5. La décision' : '5. The decision'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {[
              {
                t: fr ? 'A. Former toute la population' : 'A. Train the whole population',
                d: fr ? '42 personnes, 2 jours. Coût : à chiffrer selon vos hypothèses.' : '42 people, 2 days. Cost: to be costed from your assumptions.',
              },
              {
                t: fr ? 'B. Corriger uniquement les causes non formatives' : 'B. Fix only the non-training causes',
                d: fr ? 'Réécrire la procédure, rétablir le feedback hebdomadaire, afficher l’historique client.' : 'Rewrite the procedure, restore weekly feedback, show customer history.',
              },
              {
                t: fr ? 'C. Plan Qimatak recommandé (mixte)' : 'C. Recommended Qimatak plan (mixed)',
                d: fr ? 'B + une formation courte pour les 9 nouveaux agents uniquement.' : 'B + a short training for the 9 new agents only.',
              },
            ].map((s, i) => (
              <div key={i} className={`rounded-lg border p-3 ${i === 2 ? 'border-primary/40 bg-primary/5' : 'border-border/60'}`}>
                <p className="font-semibold text-foreground">{s.t}</p>
                <p className="mt-1 text-xs text-muted-foreground">{s.d}</p>
              </div>
            ))}
            <p className="text-xs text-muted-foreground">
              {fr
                ? 'Les montants n’apparaissent que lorsque vous saisissez vos propres hypothèses de coût. Qimatak n’invente aucun chiffre.'
                : 'Amounts appear only when you enter your own cost assumptions. Qimatak invents no figures.'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{fr ? '6. La mesure d’impact' : '6. Impact measurement'}</CardTitle>
            <CardDescription>
              {fr ? 'Référence → Cible → Réel, sur le problème d’origine.' : 'Baseline → Target → Actual, on the original problem.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 p-3">
              <span className="text-foreground">{fr ? 'Taux de réclamation' : 'Complaint rate'}</span>
              <span className="text-xs text-muted-foreground">
                {fr ? 'Référence' : 'Baseline'} 12 % → {fr ? 'Cible' : 'Target'} 7 % → {fr ? 'Réel' : 'Actual'} 9 %
              </span>
              <Badge className="bg-emerald-500/15 text-emerald-600">{fr ? 'En amélioration' : 'Improving'}</Badge>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 p-3">
              <span className="text-foreground">{fr ? 'Résolution au premier contact' : 'First-contact resolution'}</span>
              <span className="text-xs text-muted-foreground">
                {fr ? 'Référence' : 'Baseline'} 61 % → {fr ? 'Cible' : 'Target'} 75 % → {fr ? 'Réel' : 'Actual'} 68 %
              </span>
              <Badge className="bg-emerald-500/15 text-emerald-600">{fr ? 'En amélioration' : 'Improving'}</Badge>
            </div>
          </CardContent>
        </Card>

        <Separator />

        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/auth">
              {fr ? 'Diagnostiquer mon problème' : 'Diagnose my problem'} <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/pulse">{fr ? 'Essayer le diagnostic IA × RH' : 'Try the AI × HR Pulse'}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
