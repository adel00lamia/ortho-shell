import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Brain, Target, ArrowRight, CheckCircle, Gauge, ClipboardList, FileSearch,
  Search, LineChart, Shield, Sparkles, Menu, X, Stethoscope,
} from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Seo } from '@/components/seo/Seo';

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const Index = () => {
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();
  const { user } = useAuth();
  const fr = language === 'fr';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const workflow = [
    {
      icon: <ClipboardList className="h-5 w-5" />,
      title: fr ? 'Problème métier' : 'Business problem',
      description: fr
        ? 'Vous décrivez ce qui bloque : qualité, délais, réclamations, turnover, adoption des outils.'
        : 'You describe what is blocking: quality, delays, complaints, turnover, tool adoption.',
    },
    {
      icon: <Brain className="h-5 w-5" />,
      title: fr ? 'Diagnostic IA' : 'AI diagnosis',
      description: fr
        ? 'L’IA structure le cas et sépare compétence, processus, management, outils et organisation.'
        : 'The AI structures the case and separates skills, process, management, tools and organisation.',
    },
    {
      icon: <FileSearch className="h-5 w-5" />,
      title: fr ? 'Preuves' : 'Evidence',
      description: fr
        ? 'Entretiens, documents, indicateurs : chaque hypothèse est reliée aux preuves disponibles.'
        : 'Interviews, documents, indicators: every hypothesis is linked to available evidence.',
    },
    {
      icon: <Search className="h-5 w-5" />,
      title: fr ? 'Cause racine' : 'Root cause',
      description: fr
        ? 'Une répartition des causes probables, avec ce qui manque pour être plus sûr.'
        : 'A breakdown of likely causes, plus what is missing to be more certain.',
    },
    {
      icon: <Gauge className="h-5 w-5" />,
      title: 'Training Fit Score',
      description: fr
        ? 'Un score d’aide à la décision : la formation est-elle vraiment la bonne réponse ?'
        : 'A decision-support score: is training really the right answer?',
    },
    {
      icon: <Target className="h-5 w-5" />,
      title: fr ? 'Plan d’action' : 'Action plan',
      description: fr
        ? 'Actions ciblées, formation ou non-formation, avec population, priorité et coût estimé.'
        : 'Targeted actions, training or non-training, with population, priority and estimated cost.',
    },
    {
      icon: <LineChart className="h-5 w-5" />,
      title: fr ? 'Mesure d’impact' : 'Impact measurement',
      description: fr
        ? 'Vos indicateurs suivis dans le temps, avec évolution avant / après intervention.'
        : 'Your indicators tracked over time, with before / after evolution.',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Seo
        path="/"
        title="Qimatak | Diagnostiquer avant de former"
        description="Qimatak aide les entreprises à identifier ce qui bloque réellement la performance avant d'investir en formation, à cibler la bonne intervention et à mesurer son impact."
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'Qimatak',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Web',
          description:
            "Diagnostic des causes racines de la performance, Training Fit Score, plan d'action ciblé et mesure d'impact. Prototype fonctionnel en phase pilote au Maroc.",
        }}
      />

      {/* Navigation */}
      <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-primary-foreground font-extrabold">Q</span>
              </div>
              <div className="leading-tight">
                <span className="block text-xl font-extrabold tracking-tight text-foreground" style={{ fontFamily: 'Plus Jakarta Sans' }}>
                  Qimatak
                </span>
                <span className="block text-[11px] text-muted-foreground">
                  {fr ? 'Diagnostiquer avant de former.' : 'Diagnose before training.'}
                </span>
              </div>
            </div>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-8">
              <a href="#workflow" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                {fr ? 'Comment ça marche' : 'How it works'}
              </a>
              <a href="#funding" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                {fr ? 'Financement' : 'Funding'}
              </a>
              <div className="flex gap-1 bg-muted rounded-lg p-0.5">
                <button onClick={() => setLanguage('fr')} className={`text-xs px-2 py-1 rounded-md transition-all ${fr ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'}`}>FR</button>
                <button onClick={() => setLanguage('en')} className={`text-xs px-2 py-1 rounded-md transition-all ${!fr ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'}`}>EN</button>
              </div>
            </nav>

            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <Button onClick={() => navigate('/workflow/assess/root-cause')} className="bg-primary hover:bg-primary/90">
                  {fr ? 'Diagnostiquer un problème' : 'Diagnose a problem'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <>
                  <Button variant="ghost" onClick={() => navigate('/auth')} className="text-muted-foreground hover:text-foreground">
                    {fr ? 'Connexion' : 'Sign In'}
                  </Button>
                  <Button onClick={() => navigate('/auth')} className="bg-primary hover:bg-primary/90">
                    {fr ? 'Diagnostiquer un problème' : 'Diagnose a problem'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Menu">
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-xl px-4 py-4 space-y-3">
            <a href="#workflow" className="block text-sm font-medium text-muted-foreground py-2" onClick={() => setMobileMenuOpen(false)}>
              {fr ? 'Comment ça marche' : 'How it works'}
            </a>
            <a href="#funding" className="block text-sm font-medium text-muted-foreground py-2" onClick={() => setMobileMenuOpen(false)}>
              {fr ? 'Financement' : 'Funding'}
            </a>
            <Button onClick={() => navigate(user ? '/workflow/assess/root-cause' : '/auth')} className="w-full bg-primary">
              {fr ? 'Diagnostiquer un problème' : 'Diagnose a problem'}
            </Button>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden" style={{ background: 'var(--hero-gradient)' }}>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full bg-primary/10 blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-accent/10 blur-[100px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center max-w-4xl mx-auto" initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.div variants={fadeInUp} custom={0}>
              <Badge className="mb-6 bg-primary/20 text-primary-foreground border-primary/30 hover:bg-primary/30 px-4 py-1.5 text-sm font-medium">
                <Sparkles className="h-3.5 w-3.5 mr-2" />
                {fr ? 'Prototype fonctionnel · En phase pilote' : 'Working prototype · Pilot phase'}
              </Badge>
            </motion.div>

            <motion.h1 variants={fadeInUp} custom={1} className="text-4xl sm:text-5xl md:text-7xl font-extrabold text-white leading-[1.1] tracking-tight mb-6" style={{ fontFamily: 'Plus Jakarta Sans' }}>
              {fr ? (
                <>
                  Diagnostiquer <br className="hidden sm:block" />
                  <span className="bg-gradient-to-r from-[hsl(243,75%,70%)] via-[hsl(280,70%,65%)] to-[hsl(172,66%,55%)] bg-clip-text text-transparent">
                    avant de former.
                  </span>
                </>
              ) : (
                <>
                  Diagnose <br className="hidden sm:block" />
                  <span className="bg-gradient-to-r from-[hsl(243,75%,70%)] via-[hsl(280,70%,65%)] to-[hsl(172,66%,55%)] bg-clip-text text-transparent">
                    before training.
                  </span>
                </>
              )}
            </motion.h1>

            <motion.p variants={fadeInUp} custom={2} className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed">
              {fr
                ? 'Qimatak aide les entreprises à identifier ce qui bloque réellement la performance avant d’investir en formation, puis à cibler la bonne intervention et à mesurer son impact.'
                : 'Qimatak helps companies identify what is really blocking performance before investing in training, then targets the right intervention and measures impact.'}
            </motion.p>

            <motion.div variants={fadeInUp} custom={3} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => navigate(user ? '/workflow/assess/root-cause' : '/auth')}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-base font-semibold rounded-xl shadow-[var(--brand-glow)]"
              >
                <Stethoscope className="mr-2 h-5 w-5" />
                {fr ? 'Diagnostiquer un problème' : 'Diagnose a problem'}
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/pulse')}
                className="border-white/20 text-white hover:bg-white/10 px-8 py-6 text-base font-semibold rounded-xl bg-white/5"
              >
                {fr ? 'Voir un exemple' : 'See an example'}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>

            <motion.p variants={fadeInUp} custom={4} className="mt-8 text-sm text-white/45">
              {fr
                ? 'Recherche de 3 entreprises pilotes au Maroc.'
                : 'Looking for 3 pilot companies in Morocco.'}
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Workflow */}
      <section id="workflow" className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="secondary" className="mb-4">
              {fr ? 'Le parcours Qimatak' : 'The Qimatak workflow'}
            </Badge>
            <h2 className="text-3xl md:text-5xl font-extrabold text-foreground mb-4" style={{ fontFamily: 'Plus Jakarta Sans' }}>
              {fr ? 'Du symptôme à la preuve d’impact' : 'From symptom to proof of impact'}
            </h2>
            <p className="text-lg text-muted-foreground">
              {fr
                ? 'La formation n’est qu’une réponse possible. Qimatak vérifie d’abord si c’est la bonne.'
                : 'Training is only one possible answer. Qimatak first checks whether it is the right one.'}
            </p>
          </div>

          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
          >
            {workflow.map((step, i) => (
              <motion.div key={step.title} variants={fadeInUp} custom={i}>
                <Card className="border-border/50 hover:border-primary/30 transition-all duration-300 h-full bg-card">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        {step.icon}
                      </div>
                      <span className="text-xs font-semibold text-muted-foreground">
                        {fr ? 'Étape' : 'Step'} {i + 1}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-2" style={{ fontFamily: 'Plus Jakarta Sans' }}>{step.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Funding — Morocco advantage, downstream only */}
      <section id="funding" className="py-20 bg-muted/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <Badge variant="secondary" className="mb-4">
              <Shield className="h-3.5 w-3.5 mr-1" />
              {fr ? 'Avantage Maroc' : 'Morocco advantage'}
            </Badge>
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-4" style={{ fontFamily: 'Plus Jakarta Sans' }}>
              {fr ? 'Quand la formation est justifiée, elle est finançable' : 'When training is justified, it can be funded'}
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              {fr
                ? 'Si le diagnostic conclut qu’une formation est la bonne réponse, Qimatak prépare le dossier en aval : ingénierie de formation, conformité OFPPT / CSF et GIAC.'
                : 'If the diagnosis concludes that training is the right answer, Qimatak prepares the downstream paperwork: training engineering, OFPPT / CSF and GIAC compliance.'}
            </p>
            <div className="space-y-4">
              {[
                fr ? 'Ingénierie de formation structurée à partir du diagnostic' : 'Training engineering built from the diagnosis',
                fr ? 'Modèles de dossiers OFPPT / CSF' : 'OFPPT / CSF dossier templates',
                fr ? 'Cadre GIAC pour les demandes sectorielles' : 'GIAC framework for sector requests',
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                  <span className="text-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-20 md:py-28 overflow-hidden" style={{ background: 'var(--hero-gradient)' }}>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/15 blur-[120px]" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6" style={{ fontFamily: 'Plus Jakarta Sans' }}>
            {fr ? 'Un problème de performance à comprendre ?' : 'A performance problem to understand?'}
          </h2>
          <p className="text-lg text-white/60 mb-10 max-w-2xl mx-auto">
            {fr
              ? 'Qimatak est un prototype fonctionnel en phase pilote. Nous cherchons 3 entreprises pilotes pour valider le diagnostic sur des cas réels.'
              : 'Qimatak is a working prototype in pilot phase. We are looking for 3 pilot companies to validate the diagnosis on real cases.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => navigate(user ? '/workflow/assess/root-cause' : '/auth')}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-10 py-6 text-base font-semibold rounded-xl shadow-[var(--brand-glow)]"
            >
              {fr ? 'Diagnostiquer un problème' : 'Diagnose a problem'}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/pulse')}
              className="border-white/20 text-white hover:bg-white/10 px-10 py-6 text-base font-semibold rounded-xl bg-white/5"
            >
              {fr ? 'Voir un exemple' : 'See an example'}
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <span className="text-primary-foreground text-sm font-extrabold">Q</span>
                </div>
                <span className="text-lg font-extrabold text-foreground" style={{ fontFamily: 'Plus Jakarta Sans' }}>Qimatak</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {fr ? 'Diagnostiquer avant de former.' : 'Diagnose before training.'}
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3 text-sm">{fr ? 'Produit' : 'Product'}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#workflow" className="hover:text-foreground transition-colors">{fr ? 'Comment ça marche' : 'How it works'}</a></li>
                <li><a href="#funding" className="hover:text-foreground transition-colors">{fr ? 'Financement OFPPT / GIAC' : 'OFPPT / GIAC funding'}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3 text-sm">{fr ? 'Stade du projet' : 'Project stage'}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>{fr ? 'Prototype fonctionnel' : 'Working prototype'}</li>
                <li>{fr ? 'En phase pilote' : 'Pilot phase'}</li>
                <li>Casablanca, {fr ? 'Maroc' : 'Morocco'}</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 text-center">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Qimatak. {fr ? 'Tous droits réservés.' : 'All rights reserved.'}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
