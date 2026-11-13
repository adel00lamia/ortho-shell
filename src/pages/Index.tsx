import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowDownRight,
  ArrowRight,
  BarChart3,
  Bot,
  BriefcaseBusiness,
  Check,
  ChevronRight,
  CircleDollarSign,
  GitBranch,
  Menu,
  Network,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  X,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Seo } from '@/components/seo/Seo';
import { cn } from '@/lib/utils';

const reveal = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const Index = () => {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const { language, setLanguage } = useLanguage();
  const { user } = useAuth();
  const fr = language === 'fr';
  const L = (french: string, english: string) => (fr ? french : english);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeNode, setActiveNode] = useState(0);
  const start = () => navigate(user ? '/transformation' : '/auth');

  const graphNodes = [
    { label: L('Objectif stratégique', 'Strategic objective'), value: L('Accélérer l’expansion régionale', 'Accelerate regional expansion'), icon: Target },
    { label: L('Capacité critique', 'Critical capability'), value: L('Développement de marché', 'Market development'), icon: Network },
    { label: L('Travail à transformer', 'Work to transform'), value: L('Veille, qualification, proposition', 'Research, qualification, proposal'), icon: BriefcaseBusiness },
    { label: L('Modèle opératoire', 'Operating model'), value: L('Humain + agent IA', 'Human + AI agent'), icon: Bot },
    { label: L('Décision', 'Decision'), value: 'Build · Redeploy · Bot', icon: GitBranch },
  ];

  const stages = [
    [L('Orienter', 'Orient'), L('Stratégie et priorités', 'Strategy and priorities'), Target],
    [L('Comprendre', 'Understand'), L('Capacités, processus, tâches', 'Capabilities, processes, tasks'), Network],
    [L('Concevoir', 'Design'), L('Travail Humain + IA', 'Human + AI work'), Bot],
    [L('Décider', 'Decide'), L('Scénarios et interventions', 'Scenarios and interventions'), GitBranch],
    [L('Prouver', 'Prove'), L('Financement et impact', 'Funding and impact'), BarChart3],
  ] as const;

  const deliverables = [
    { number: '01', title: L('Diagnostic de transformation', 'Transformation diagnostic'), text: L('Une lecture structurée des priorités, écarts et causes racines.', 'A structured view of priorities, gaps and root causes.'), icon: Target },
    { number: '02', title: 'Qimatak WorkGraph', text: L('La carte qui relie stratégie, travail, rôles, compétences et personnes.', 'The map connecting strategy, work, roles, skills and people.'), icon: Network },
    { number: '03', title: L('Scénarios Humain + IA', 'Human + AI scenarios'), text: L('Des options comparables pour automatiser, redéployer ou renforcer.', 'Comparable options to automate, redeploy or build capability.'), icon: Bot },
    { number: '04', title: L('Portefeuille d’interventions', 'Intervention portfolio'), text: L('Build, Buy, Borrow, Redeploy, Bot ou Redesign selon la cause.', 'Build, Buy, Borrow, Redeploy, Bot or Redesign based on the cause.'), icon: GitBranch },
    { number: '05', title: L('Dossier de décision', 'Decision pack'), text: L('Plan, budget, risques et programmes de financement potentiels.', 'Plan, budget, risks and potential funding programmes.'), icon: CircleDollarSign },
    { number: '06', title: L('Suivi de l’impact', 'Impact tracking'), text: L('Des indicateurs 30/90 jours pour relier action et résultat business.', '30/90-day indicators connecting action to business outcomes.'), icon: BarChart3 },
  ];

  const actions = [
    ['BUILD', L('Développer', 'Build')],
    ['BUY', L('Recruter', 'Recruit')],
    ['BORROW', L('Mobiliser', 'Bring expertise')],
    ['REDEPLOY', L('Redéployer', 'Redeploy')],
    ['BOT', L('Automatiser', 'Automate')],
    ['REDESIGN', L('Reconcevoir', 'Redesign')],
  ];

  return (
    <div className="landing-shell min-h-screen bg-background text-foreground">
      <Seo
        path="/"
        title={L('Qimatak | De la stratégie à l’exécution Humain + IA', 'Qimatak | From strategy to Human + AI execution')}
        description={L('Qimatak relie stratégie, capacités, processus, compétences et IA pour construire des décisions de transformation mesurables.', 'Qimatak connects strategy, capabilities, processes, skills and AI to build measurable transformation decisions.')}
      />

      <header className="fixed inset-x-0 top-0 z-50 border-b border-border/70 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
          <button className="flex items-center gap-3" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label={L('Retour en haut', 'Back to top')}>
            <span className="flex h-8 w-8 items-center justify-center bg-foreground text-sm font-extrabold text-background">Q</span>
            <span className="text-lg font-extrabold">Qimatak</span>
          </button>
          <nav className="hidden items-center gap-7 text-sm lg:flex" aria-label={L('Navigation principale', 'Main navigation')}>
            <a href="#platform" className="text-muted-foreground transition-colors hover:text-foreground">{L('Plateforme', 'Platform')}</a>
            <a href="#method" className="text-muted-foreground transition-colors hover:text-foreground">{L('Méthode', 'Method')}</a>
            <a href="#deliverables" className="text-muted-foreground transition-colors hover:text-foreground">{L('Livrables', 'Deliverables')}</a>
            <a href="#human-ai" className="text-muted-foreground transition-colors hover:text-foreground">{L('Humain + IA', 'Human + AI')}</a>
          </nav>
          <div className="hidden items-center gap-2 md:flex">
            <div className="flex border border-border p-0.5" aria-label={L('Langue', 'Language')}>
              {(['fr', 'en'] as const).map((item) => (
                <Button key={item} type="button" size="sm" variant={language === item ? 'secondary' : 'ghost'} className="h-7 rounded-none px-2 text-[11px]" onClick={() => setLanguage(item)}>
                  {item.toUpperCase()}
                </Button>
              ))}
            </div>
            {!user && <Button variant="ghost" onClick={() => navigate('/auth')}>{L('Connexion', 'Sign in')}</Button>}
            <Button onClick={start}>{user ? L('Ouvrir le cockpit', 'Open cockpit') : L('Commencer', 'Get started')}<ArrowRight className="ml-2 h-4 w-4" /></Button>
          </div>
          <Button size="icon" variant="ghost" className="md:hidden" onClick={() => setMenuOpen((open) => !open)} aria-label={L('Ouvrir le menu', 'Open menu')}>
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
        {menuOpen && (
          <div className="border-t border-border bg-background px-5 py-5 md:hidden">
            <div className="flex flex-col gap-1">
              {[[L('Plateforme', 'Platform'), '#platform'], [L('Méthode', 'Method'), '#method'], [L('Livrables', 'Deliverables'), '#deliverables']].map(([label, href]) => (
                <Button key={href} asChild variant="ghost" className="justify-start rounded-none px-0" onClick={() => setMenuOpen(false)}><a href={href}>{label}</a></Button>
              ))}
              <div className="my-3 h-px bg-border" />
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setLanguage(fr ? 'en' : 'fr')}>{fr ? 'English' : 'Français'}</Button>
                <Button className="flex-1" onClick={start}>{L('Commencer', 'Get started')}</Button>
              </div>
            </div>
          </div>
        )}
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-border pb-16 pt-28 md:pb-24 md:pt-36">
          <div className="landing-grid absolute inset-0 opacity-60" aria-hidden="true" />
          <div className="relative mx-auto grid max-w-7xl gap-14 px-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(480px,.95fr)] lg:items-center lg:px-8">
            <motion.div initial={reduceMotion ? false : 'hidden'} animate="visible" variants={reveal} transition={{ duration: 0.55 }}>
              <div className="mb-8 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.16em] text-primary">
                <span className="h-px w-9 bg-primary" />
                {L('Business Transformation Intelligence', 'Business Transformation Intelligence')}
              </div>
              <h1 className="max-w-4xl text-5xl font-extrabold leading-[0.98] sm:text-6xl lg:text-7xl">
                {L('Votre stratégie exige une autre organisation.', 'Your strategy demands a different organisation.')}
              </h1>
              <p className="mt-7 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
                {L('Qimatak montre quelles capacités construire, quel travail transformer et comment combiner talents et IA pour passer de l’ambition à l’exécution.', 'Qimatak shows which capabilities to build, which work to transform and how to combine talent and AI to move from ambition to execution.')}
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button size="lg" onClick={start}>{L('Lancer le diagnostic', 'Start the diagnostic')}<ArrowRight className="ml-2 h-4 w-4" /></Button>
                <Button size="lg" variant="outline" onClick={() => document.getElementById('platform')?.scrollIntoView({ behavior: 'smooth' })}>{L('Voir ce que Qimatak produit', 'See what Qimatak delivers')}<ArrowDownRight className="ml-2 h-4 w-4" /></Button>
              </div>
              <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 border-t border-border pt-5 text-xs font-semibold text-muted-foreground">
                {[L('Entreprise 50–500 collaborateurs', 'Companies with 50–500 employees'), L('Décision Humain + IA', 'Human + AI decisions'), L('Prototype fonctionnel · pilote', 'Working prototype · pilot')].map((item) => (
                  <span key={item} className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-primary" />{item}</span>
                ))}
              </div>
            </motion.div>

            <motion.div initial={reduceMotion ? false : { opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.65, delay: 0.1 }} className="relative">
              <div className="border border-border bg-card shadow-[0_24px_70px_-42px_hsl(var(--foreground)/0.45)]">
                <div className="flex items-center justify-between border-b border-border px-5 py-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">Qimatak WorkGraph</p>
                    <p className="mt-1 text-sm font-semibold">{L('Expansion Afrique de l’Ouest', 'West Africa expansion')}</p>
                  </div>
                  <span className="flex items-center gap-2 text-xs text-muted-foreground"><span className="h-2 w-2 rounded-full bg-accent" />{L('Scénario actif', 'Active scenario')}</span>
                </div>
                <div className="grid md:grid-cols-[1fr_150px]">
                  <div className="p-4 sm:p-5">
                    {graphNodes.map((item, index) => {
                      const Icon = item.icon;
                      const active = activeNode === index;
                      return (
                        <div key={item.label}>
                          <button type="button" onMouseEnter={() => setActiveNode(index)} onFocus={() => setActiveNode(index)} onClick={() => setActiveNode(index)} className={cn('group flex w-full items-center gap-3 border px-3 py-3 text-left transition-colors', active ? 'border-primary bg-primary/5' : 'border-border bg-background/60 hover:border-primary/40')}>
                            <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center', active ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground')}><Icon className="h-4 w-4" /></span>
                            <span className="min-w-0 flex-1"><span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{item.label}</span><span className="mt-0.5 block truncate text-sm font-bold">{item.value}</span></span>
                            <ChevronRight className={cn('h-4 w-4 transition-transform', active ? 'translate-x-0 text-primary' : '-translate-x-1 text-muted-foreground')} />
                          </button>
                          {index < graphNodes.length - 1 && <div className="ml-7 h-3 w-px bg-border" />}
                        </div>
                      );
                    })}
                  </div>
                  <div className="border-t border-border bg-secondary/60 p-4 md:border-l md:border-t-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{L('Lecture', 'Insight')}</p>
                    <p className="mt-4 text-3xl font-extrabold text-primary">72%</p>
                    <p className="mt-1 text-xs font-semibold">{L('de tâches augmentables', 'of tasks augmentable')}</p>
                    <div className="my-5 h-px bg-border" />
                    <p className="text-xs leading-relaxed text-muted-foreground">{L('Priorité : redéployer le temps libéré vers la qualification commerciale.', 'Priority: redeploy saved time to commercial qualification.')}</p>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-right text-[10px] text-muted-foreground">{L('Exemple illustratif · données à confirmer avec l’entreprise', 'Illustrative example · data to confirm with the company')}</p>
            </motion.div>
          </div>
        </section>

        <section className="border-b border-border bg-foreground text-background">
          <div className="mx-auto grid max-w-7xl divide-y divide-background/15 px-5 md:grid-cols-5 md:divide-x md:divide-y-0 lg:px-8">
            {stages.map(([title, detail, Icon], index) => (
              <div key={title} className="flex items-center gap-4 py-5 md:px-5 md:first:pl-0 md:last:pr-0">
                <span className="text-xs opacity-50">0{index + 1}</span><Icon className="h-4 w-4 text-accent" /><div><p className="text-xs font-bold uppercase tracking-[0.1em]">{title}</p><p className="mt-1 text-[11px] opacity-60">{detail}</p></div>
              </div>
            ))}
          </div>
        </section>

        <section id="platform" className="border-b border-border py-20 md:py-28">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-[.75fr_1.25fr]">
              <div className="lg:sticky lg:top-28 lg:self-start">
                <p className="section-label">{L('Le problème', 'The problem')}</p>
                <h2 className="mt-5 text-4xl font-extrabold leading-tight md:text-5xl">{L('Les données existent. Les décisions restent fragmentées.', 'The data exists. Decisions remain fragmented.')}</h2>
                <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{L('La stratégie, les effectifs, les compétences, l’IA et la formation sont pilotés dans des systèmes séparés. Qimatak les réunit autour du travail réel.', 'Strategy, workforce, skills, AI and learning are managed in separate systems. Qimatak connects them around real work.')}</p>
              </div>
              <div className="border-t border-foreground">
                {[
                  [L('La direction fixe les ambitions', 'Leadership sets the ambition'), L('mais ne voit pas toujours les capacités opérationnelles nécessaires.', 'but cannot always see the operating capabilities required.')],
                  [L('Les RH mesurent les postes', 'HR measures jobs'), L('mais rarement les tâches qui créent la valeur ou peuvent être augmentées par l’IA.', 'but rarely the tasks creating value or suitable for AI augmentation.')],
                  [L('Les plans empilent les actions', 'Plans stack up actions'), L('sans distinguer formation, recrutement, redéploiement, automatisation ou refonte.', 'without separating learning, hiring, redeployment, automation or redesign.')],
                ].map(([title, text], index) => (
                  <motion.div key={title} initial={reduceMotion ? false : 'hidden'} whileInView="visible" viewport={{ once: true, amount: 0.4 }} variants={reveal} transition={{ duration: 0.4, delay: index * 0.08 }} className="grid gap-3 border-b border-border py-8 sm:grid-cols-[64px_1fr_1fr] sm:items-start">
                    <span className="text-xs font-bold text-primary">0{index + 1}</span><h3 className="text-xl font-bold">{title}</h3><p className="leading-relaxed text-muted-foreground">{text}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="method" className="border-b border-border bg-secondary/55 py-20 md:py-28">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="max-w-3xl">
              <p className="section-label">{L('Un système de décision', 'A decision system')}</p>
              <h2 className="mt-5 text-4xl font-extrabold leading-tight md:text-5xl">{L('De la stratégie à une action défendable.', 'From strategy to a defensible action.')}</h2>
            </div>
            <div className="mt-14 grid gap-px overflow-hidden border border-border bg-border lg:grid-cols-4">
              {[
                [L('01 · Cadrer', '01 · Frame'), L('Objectifs business', 'Business objectives'), L('Croissance, coûts, qualité, digitalisation et ambitions IA.', 'Growth, cost, quality, digitalisation and AI ambitions.'), Target],
                [L('02 · Cartographier', '02 · Map'), L('Organisation du travail', 'Organisation of work'), L('Capacités, processus, tâches, rôles, compétences et personnes.', 'Capabilities, processes, tasks, roles, skills and people.'), Network],
                [L('03 · Simuler', '03 · Simulate'), L('Futur Humain + IA', 'Human + AI future'), L('Scénarios de charge, coût, risque, automatisation et redéploiement.', 'Workload, cost, risk, automation and redeployment scenarios.'), Bot],
                [L('04 · Exécuter', '04 · Execute'), L('Interventions et impact', 'Interventions and impact'), L('Plan priorisé, financement potentiel et mesure à 30/90 jours.', 'Prioritised plan, potential funding and 30/90-day measurement.'), BarChart3],
              ].map(([step, title, text, Icon]) => (
                <div key={String(step)} className="bg-background p-6 md:p-8"><Icon className="h-6 w-6 text-primary" /><p className="mt-10 text-xs font-bold uppercase tracking-[0.14em] text-primary">{step as string}</p><h3 className="mt-3 text-xl font-bold">{title as string}</h3><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{text as string}</p></div>
              ))}
            </div>
          </div>
        </section>

        <section id="human-ai" className="overflow-hidden border-b border-border py-20 md:py-28">
          <div className="mx-auto grid max-w-7xl gap-14 px-5 lg:grid-cols-2 lg:items-center lg:px-8">
            <div>
              <p className="section-label">{L('Conception du travail', 'Work design')}</p>
              <h2 className="mt-5 text-4xl font-extrabold leading-tight md:text-5xl">{L('L’IA n’est pas une stratégie. Le travail redessiné l’est.', 'AI is not a strategy. Redesigned work is.')}</h2>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{L('Chaque tâche est évaluée selon sa valeur, sa complexité, ses données, son risque et le jugement humain requis. La recommandation devient explicable.', 'Each task is assessed by value, complexity, data, risk and required human judgment. The recommendation becomes explainable.')}</p>
              <div className="mt-8 grid grid-cols-2 gap-x-6 border-t border-border sm:grid-cols-3">
                {actions.map(([code, label]) => <div key={code} className="border-b border-border py-4"><p className="text-[10px] font-bold tracking-[0.14em] text-primary">{code}</p><p className="mt-1 text-sm font-semibold">{label}</p></div>)}
              </div>
            </div>
            <div className="bg-foreground p-6 text-background md:p-9">
              <div className="flex items-start justify-between border-b border-background/15 pb-6">
                <div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-accent">{L('Analyse de tâche', 'Task analysis')}</p><h3 className="mt-2 text-2xl font-bold">{L('Veille concurrentielle', 'Competitive intelligence')}</h3></div><Sparkles className="h-6 w-6 text-accent" />
              </div>
              <div className="grid grid-cols-2 gap-px bg-background/15">
                {[[L('Adéquation IA', 'AI suitability'), '87%'], [L('Jugement humain', 'Human judgment'), L('Moyen', 'Medium')], [L('Risque conformité', 'Compliance risk'), L('Faible', 'Low')], [L('Valeur stratégique', 'Strategic value'), L('Élevée', 'High')]].map(([label, value]) => <div key={label} className="bg-foreground py-6 pr-4"><p className="text-xs opacity-55">{label}</p><p className="mt-2 text-xl font-bold">{value}</p></div>)}
              </div>
              <div className="mt-6 border-l-2 border-accent pl-4"><p className="text-xs uppercase tracking-[0.12em] opacity-55">{L('Décision recommandée', 'Recommended decision')}</p><p className="mt-2 font-bold">{L('Agent IA + validation humaine + redéploiement du temps', 'AI agent + human validation + time redeployment')}</p></div>
              <p className="mt-7 text-[10px] opacity-50">{L('Exemple illustratif — aucune économie n’est garantie sans validation des données.', 'Illustrative example — no savings are guaranteed without validated data.')}</p>
            </div>
          </div>
        </section>

        <section id="deliverables" className="border-b border-border py-20 md:py-28">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div className="max-w-3xl"><p className="section-label">{L('Ce que vous obtenez', 'What you get')}</p><h2 className="mt-5 text-4xl font-extrabold leading-tight md:text-5xl">{L('Des livrables pour décider, pas seulement des tableaux de bord.', 'Deliverables for decisions, not just dashboards.')}</h2></div>
              <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">{L('Chaque analyse aboutit à un artefact utilisable par la Direction, les RH, la Finance et les responsables opérationnels.', 'Each analysis produces an artefact usable by leadership, HR, Finance and operational leaders.')}</p>
            </div>
            <div className="mt-14 grid border-l border-t border-border md:grid-cols-2 lg:grid-cols-3">
              {deliverables.map(({ number, title, text, icon: Icon }) => (
                <div key={number} className="group min-h-64 border-b border-r border-border p-6 transition-colors hover:bg-secondary/60 md:p-8">
                  <div className="flex items-center justify-between"><span className="text-xs font-bold text-primary">{number}</span><Icon className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" /></div>
                  <h3 className="mt-16 text-xl font-bold">{title}</h3><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-secondary/55 py-20 md:py-28">
          <div className="mx-auto grid max-w-7xl gap-12 px-5 lg:grid-cols-[1.05fr_.95fr] lg:items-start lg:px-8">
            <div><p className="section-label">{L('Ancrage marocain', 'Built for Morocco')}</p><h2 className="mt-5 text-4xl font-extrabold leading-tight md:text-5xl">{L('Du besoin de transformation au projet finançable.', 'From transformation need to a fundable project.')}</h2><p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">{L('Qimatak rapproche les interventions des programmes potentiels OFPPT / CSF et GIAC, puis structure les éléments à vérifier avec vos conseils et organismes compétents.', 'Qimatak matches interventions with potential OFPPT / CSF and GIAC programmes, then structures what must be verified with your advisers and competent bodies.')}</p></div>
            <div className="border-t border-foreground">
              {[[L('Besoin prouvé', 'Evidence-based need'), ShieldCheck], [L('Intervention structurée', 'Structured intervention'), GitBranch], [L('Programme potentiel', 'Potential programme'), CircleDollarSign], [L('Impact mesurable', 'Measurable impact'), BarChart3]].map(([label, Icon], index) => <div key={label as string} className="flex items-center gap-5 border-b border-border py-5"><span className="text-xs text-muted-foreground">0{index + 1}</span><Icon className="h-5 w-5 text-primary" /><span className="font-bold">{label as string}</span></div>)}
              <p className="mt-5 text-xs leading-relaxed text-muted-foreground">{L('Les règles et taux sont présentés comme références à vérifier, jamais comme un droit acquis ou un remboursement garanti.', 'Rules and rates are references to verify, never a guaranteed entitlement or reimbursement.')}</p>
            </div>
          </div>
        </section>

        <section className="bg-primary py-20 text-primary-foreground md:py-28">
          <div className="mx-auto max-w-5xl px-5 text-center lg:px-8">
            <Users className="mx-auto h-7 w-7 opacity-70" />
            <h2 className="mt-7 text-4xl font-extrabold leading-tight md:text-6xl">{L('Quelle organisation votre stratégie exige-t-elle ?', 'What organisation does your strategy require?')}</h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg opacity-75">{L('Commencez par un diagnostic de transformation. Qimatak reliera vos priorités au travail, aux talents et à l’IA.', 'Start with a transformation diagnostic. Qimatak will connect your priorities to work, talent and AI.')}</p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Button size="lg" variant="secondary" onClick={start}>{L('Démarrer le diagnostic', 'Start the diagnostic')}<ArrowRight className="ml-2 h-4 w-4" /></Button>
              {!user && <Button size="lg" variant="outline" className="border-primary-foreground/35 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground" onClick={() => navigate('/auth')}>{L('Se connecter', 'Sign in')}</Button>}
            </div>
            <p className="mt-7 text-xs opacity-60">{L('Prototype fonctionnel · En phase pilote au Maroc', 'Working prototype · Pilot phase in Morocco')}</p>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-foreground py-10 text-background">
        <div className="mx-auto flex max-w-7xl flex-col gap-7 px-5 md:flex-row md:items-end md:justify-between lg:px-8">
          <div><p className="text-2xl font-extrabold">Qimatak</p><p className="mt-2 max-w-md text-sm opacity-60">{L('De la stratégie à l’exécution Humain + IA.', 'From business strategy to Human + AI execution.')}</p></div>
          <div className="text-xs opacity-50"><p>© {new Date().getFullYear()} Qimatak · Casablanca</p><p className="mt-1">{L('Prototype fonctionnel · En phase pilote', 'Working prototype · Pilot phase')}</p></div>
        </div>
      </footer>
    </div>
  );
};

export default Index;