import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, ArrowRight, Calculator } from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { useLanguage } from '@/contexts/LanguageContext';
import { FundingRulesDisclaimer } from '@/components/funding/FundingRulesDisclaimer';
import {
  REFERENCE_RULES,
  computeTFP,
  computeReimbursementCap,
  formatDH,
} from '@/lib/ofpptFinancials';

interface Offer {
  id: string;
  name: { fr: string; en: string };
  description: { fr: string; en: string };
  features: { fr: string; en: string }[];
  highlighted?: boolean;
}

const offers: Offer[] = [
  {
    id: 'diagnostic',
    name: { fr: 'Diagnostic à l’unité', en: 'Single diagnostic' },
    description: {
      fr: 'Un cas, du terrain au rapport présentable en comité.',
      en: 'One case, from the field to a board-ready report.',
    },
    features: [
      { fr: 'Pulse terrain (questionnaire mobile anonyme)', en: 'Field Pulse (anonymous mobile survey)' },
      { fr: 'Analyse des 7 causes + Training Fit Score', en: '7-cause analysis + Training Fit Score' },
      { fr: 'Rapport de diagnostic en français (PDF)', en: 'French diagnostic report (PDF)' },
      { fr: 'Plan d’action priorisé', en: 'Prioritised action plan' },
      { fr: 'Restitution accompagnée', en: 'Guided debrief' },
    ],
  },
  {
    id: 'pilote',
    name: { fr: 'Pilote', en: 'Pilot' },
    description: {
      fr: 'Pour valider la méthode sur quelques cas avant de généraliser.',
      en: 'To validate the method on a few cases before scaling.',
    },
    features: [
      { fr: 'Diagnostics illimités sur un périmètre', en: 'Unlimited diagnostics on one scope' },
      { fr: 'Mesure d’impact à 30 et 90 jours', en: 'Impact measurement at 30 and 90 days' },
      { fr: 'Préparation du dossier CSF', en: 'CSF dossier preparation' },
      { fr: 'Tableau de bord de direction', en: 'Executive dashboard' },
    ],
    highlighted: true,
  },
  {
    id: 'entreprise',
    name: { fr: 'Entreprise', en: 'Enterprise' },
    description: {
      fr: 'Plusieurs sites ou directions, avec suivi consolidé.',
      en: 'Several sites or departments, with consolidated tracking.',
    },
    features: [
      { fr: 'Tous les périmètres et équipes', en: 'All scopes and teams' },
      { fr: 'Historique et comparaison des cas', en: 'Case history and comparison' },
      { fr: 'Dossiers de financement complets', en: 'Complete funding files' },
      { fr: 'Accompagnement dédié', en: 'Dedicated support' },
    ],
  },
  {
    id: 'partenaire',
    name: { fr: 'Partenaire / marque blanche', en: 'Partner / white label' },
    description: {
      fr: 'Cabinets de conseil et organismes de formation.',
      en: 'Consulting firms and training providers.',
    },
    features: [
      { fr: 'Vos couleurs et votre logo sur les rapports', en: 'Your colours and logo on reports' },
      { fr: 'Plusieurs entreprises clientes', en: 'Multiple client companies' },
      { fr: 'Formation à la méthode', en: 'Method training' },
      { fr: 'Conditions annuelles', en: 'Annual terms' },
    ],
  },
];

const Pricing = () => {
  const { language } = useLanguage();
  const fr = language === 'fr';
  const [payroll, setPayroll] = useState('');

  const estimate = useMemo(() => {
    const value = Number(payroll.replace(/[^0-9.]/g, ''));
    if (!value || value <= 0) return null;
    const tfp = computeTFP(value, REFERENCE_RULES);
    const cap = computeReimbursementCap(tfp, REFERENCE_RULES);
    return { tfp, cap };
  }, [payroll]);

  return (
    <div className="min-h-screen bg-background py-16">
      <Seo
        path="/pricing"
        title="Tarifs Qimatak | Diagnostic avant formation"
        description="Offres Qimatak sur devis : diagnostic terrain, rapport en français présentable en comité, plan d'action et dossier de financement CSF, mesure d'impact."
      />

      <div className="container mx-auto max-w-6xl px-4">
        <header className="mx-auto mb-14 max-w-3xl text-center">
          <Badge variant="secondary" className="mb-4">
            {fr ? 'Offres sur devis' : 'Quote-based offers'}
          </Badge>
          <h1 className="mb-4 text-4xl font-bold tracking-tight">
            {fr ? 'Le prix se lit à côté du montant récupérable' : 'Price read next to the recoverable amount'}
          </h1>
          <p className="text-lg text-muted-foreground">
            {fr
              ? 'Chaque périmètre est différent : nombre de sites, effectif concerné, nombre de cas à traiter. Nous établissons un devis après un premier échange, et nous le présentons toujours en regard de ce que votre entreprise peut récupérer.'
              : 'Every scope differs: number of sites, headcount involved, number of cases. We issue a quote after a first conversation, always alongside what your company can recover.'}
          </p>
        </header>

        <div className="mb-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {offers.map((offer) => (
            <Card
              key={offer.id}
              className={`relative flex flex-col ${offer.highlighted ? 'border-primary shadow-lg' : ''}`}
            >
              {offer.highlighted && (
                <Badge className="absolute -top-2 left-1/2 -translate-x-1/2">
                  {fr ? 'Le plus demandé' : 'Most requested'}
                </Badge>
              )}
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">{fr ? offer.name.fr : offer.name.en}</CardTitle>
                <CardDescription>{fr ? offer.description.fr : offer.description.en}</CardDescription>
                <div className="mt-4 text-2xl font-semibold text-primary">
                  {fr ? 'Sur devis' : 'On request'}
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col justify-between gap-6">
                <ul className="space-y-2">
                  {offer.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" aria-hidden="true" />
                      <span className="text-sm text-muted-foreground">{fr ? feature.fr : feature.en}</span>
                    </li>
                  ))}
                </ul>
                <Button asChild variant={offer.highlighted ? 'default' : 'outline'} className="w-full">
                  <Link to="/auth">
                    {fr ? 'Demander un devis' : 'Request a quote'}
                    <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <section className="mx-auto max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Calculator className="h-5 w-5 text-primary" aria-hidden="true" />
                {fr ? 'Estimer votre plafond de récupération' : 'Estimate your recovery ceiling'}
              </CardTitle>
              <CardDescription>
                {fr
                  ? 'Les entreprises assujetties à la taxe de formation professionnelle peuvent faire financer une partie de leurs actions, y compris le diagnostic et l’ingénierie. Indiquez votre masse salariale brute annuelle pour situer l’ordre de grandeur.'
                  : 'Companies subject to the vocational training levy can have part of their actions funded, including diagnostics and engineering. Enter your gross annual payroll for an order of magnitude.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="payroll">
                  {fr ? 'Masse salariale brute annuelle (DH)' : 'Gross annual payroll (DH)'}
                </Label>
                <Input
                  id="payroll"
                  inputMode="numeric"
                  placeholder="12 000 000"
                  value={payroll}
                  onChange={(e) => setPayroll(e.target.value)}
                />
              </div>

              {estimate && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border bg-muted/40 p-4">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">
                      {fr ? 'Taxe de formation estimée' : 'Estimated training levy'}
                    </div>
                    <div className="mt-1 text-xl font-semibold">{formatDH(estimate.tfp)}</div>
                  </div>
                  <div className="rounded-lg border bg-primary/5 p-4">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">
                      {fr ? 'Plafond de récupération estimé' : 'Estimated recovery ceiling'}
                    </div>
                    <div className="mt-1 text-xl font-semibold text-primary">{formatDH(estimate.cap)}</div>
                  </div>
                </div>
              )}

              <FundingRulesDisclaimer fr={fr} />

              <p className="text-sm text-muted-foreground">
                {fr
                  ? 'Qimatak est un prototype fonctionnel en phase pilote. Nous accompagnons un nombre limité d’entreprises pour valider la méthode sur des cas réels.'
                  : 'Qimatak is a working prototype in pilot phase. We support a limited number of companies to validate the method on real cases.'}
              </p>

              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <Link to="/auth">{fr ? 'Demander un devis' : 'Request a quote'}</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/exemple">{fr ? 'Voir un exemple' : 'See an example'}</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default Pricing;
