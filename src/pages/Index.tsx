import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Brain, Target, BarChart3, Zap, CheckCircle, ArrowRight,
  Award, TrendingUp, Globe, BookOpen, Shield,
  ChevronRight, Sparkles, Play, Menu, X
} from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';

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
  const { t, language, setLanguage } = useLanguage();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const features = [
    {
      icon: <Brain className="h-6 w-6" />,
      title: language === 'fr' ? 'Planification IA' : 'AI Planning',
      description: language === 'fr'
        ? 'Générez des plans de formation personnalisés en quelques minutes grâce à notre moteur d\'IA avancé.'
        : 'Generate personalized training plans in minutes with our advanced AI engine.',
      color: 'from-primary to-purple-500',
    },
    {
      icon: <Target className="h-6 w-6" />,
      title: language === 'fr' ? 'Diagnostic des compétences' : 'Skills Diagnostic',
      description: language === 'fr'
        ? 'Identifiez les écarts de compétences et priorisez les besoins de formation de votre équipe.'
        : 'Identify skill gaps and prioritize training needs across your team.',
      color: 'from-accent to-teal-400',
    },
    {
      icon: <BookOpen className="h-6 w-6" />,
      title: language === 'fr' ? 'Studio de modules' : 'Module Studio',
      description: language === 'fr'
        ? 'Créez du contenu interactif avec des quiz, des diapositives et des certificats intégrés.'
        : 'Create interactive content with quizzes, slides, and built-in certificates.',
      color: 'from-orange-500 to-amber-400',
    },
    {
      icon: <Globe className="h-6 w-6" />,
      title: 'Marketplace',
      description: language === 'fr'
        ? 'Accédez à un catalogue de formations dispensées par des experts certifiés.'
        : 'Access a catalog of training courses from certified experts.',
      color: 'from-blue-500 to-cyan-400',
    },
    {
      icon: <Award className="h-6 w-6" />,
      title: language === 'fr' ? 'Certificats numériques' : 'Digital Certificates',
      description: language === 'fr'
        ? 'Émettez des certificats vérifiables et des badges conformes Open Badges 3.0.'
        : 'Issue verifiable certificates and Open Badges 3.0 compliant digital badges.',
      color: 'from-yellow-500 to-orange-400',
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: language === 'fr' ? 'Analytique & ROI' : 'Analytics & ROI',
      description: language === 'fr'
        ? 'Mesurez l\'impact réel de vos formations avec des tableaux de bord en temps réel.'
        : 'Measure the real impact of your training with real-time dashboards.',
      color: 'from-pink-500 to-rose-400',
    },
  ];

  const stats = [
    { value: '95%', label: language === 'fr' ? 'Taux d\'achèvement' : 'Completion Rate' },
    { value: '300%', label: language === 'fr' ? 'ROI moyen' : 'Average ROI' },
    { value: '40h', label: language === 'fr' ? 'Économisées/mois' : 'Saved/month' },
  ];


  const plans = [
    {
      name: 'Starter',
      price: '2 500',
      period: language === 'fr' ? '/mois' : '/mo',
      description: language === 'fr' ? 'Pour les petites équipes' : 'For small teams',
      features: language === 'fr'
        ? ['5 membres', 'Modules de base', 'Support email', 'Analytique basique']
        : ['5 members', 'Basic modules', 'Email support', 'Basic analytics'],
      popular: false,
    },
    {
      name: 'Professional',
      price: '7 500',
      period: language === 'fr' ? '/mois' : '/mo',
      description: language === 'fr' ? 'Pour les entreprises en croissance' : 'For growing companies',
      features: language === 'fr'
        ? ['50 membres', 'Modules avancés + IA', 'Support prioritaire', 'Analytique avancée', 'Conformité GIAC', 'API access']
        : ['50 members', 'Advanced modules + AI', 'Priority support', 'Advanced analytics', 'GIAC compliance', 'API access'],
      popular: true,
    },
    {
      name: 'Enterprise',
      price: '15 000',
      period: language === 'fr' ? '/mois' : '/mo',
      description: language === 'fr' ? 'Solution complète' : 'Complete solution',
      features: language === 'fr'
        ? ['Membres illimités', 'White-label', 'Support dédié 24/7', 'OFPPT & GIAC', 'Intégrations custom', 'On-premise possible']
        : ['Unlimited members', 'White-label', 'Dedicated 24/7 support', 'OFPPT & GIAC', 'Custom integrations', 'On-premise option'],
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Seo
        path="/"
        title="QimataQ | Diagnostic RH et plan de formation IA"
        description="Diagnostiquez les causes racines de la performance, priorisez les actions et mesurez l'impact de vos formations. Plateforme RH IA conçue pour le Maroc (OFPPT, GIAC)."
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'QimataQ',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Web',
          url: 'https://ortho-shell.lovable.app/',
          description:
            "Diagnostic RH assisté par IA, plan de formation, suivi d'impact et conformité OFPPT pour les entreprises marocaines.",
        }}
      />
      {/* Navigation */}
      <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-foreground" style={{ fontFamily: 'Plus Jakarta Sans' }}>
                QimataQ
              </span>
            </div>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                {language === 'fr' ? 'Fonctionnalités' : 'Features'}
              </a>
              <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                {language === 'fr' ? 'Tarifs' : 'Pricing'}
              </a>
              <div className="flex gap-1 bg-muted rounded-lg p-0.5">
                <button onClick={() => setLanguage('fr')} className={`text-xs px-2 py-1 rounded-md transition-all ${language === 'fr' ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'}`}>FR</button>
                <button onClick={() => setLanguage('en')} className={`text-xs px-2 py-1 rounded-md transition-all ${language === 'en' ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'}`}>EN</button>
              </div>
            </nav>

            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <Button onClick={() => navigate('/dashboard')} className="bg-primary hover:bg-primary/90">
                  {language === 'fr' ? 'Tableau de bord' : 'Dashboard'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <>
                  <Button variant="ghost" onClick={() => navigate('/auth')} className="text-muted-foreground hover:text-foreground">
                    {language === 'fr' ? 'Connexion' : 'Sign In'}
                  </Button>
                  <Button onClick={() => navigate('/auth')} className="bg-primary hover:bg-primary/90">
                    {language === 'fr' ? 'Essai gratuit' : 'Free Trial'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-xl px-4 py-4 space-y-3">
            <a href="#features" className="block text-sm font-medium text-muted-foreground py-2" onClick={() => setMobileMenuOpen(false)}>
              {language === 'fr' ? 'Fonctionnalités' : 'Features'}
            </a>
            <a href="#pricing" className="block text-sm font-medium text-muted-foreground py-2" onClick={() => setMobileMenuOpen(false)}>
              {language === 'fr' ? 'Tarifs' : 'Pricing'}
            </a>
            <Button onClick={() => navigate(user ? '/dashboard' : '/auth')} className="w-full bg-primary">
              {user ? (language === 'fr' ? 'Tableau de bord' : 'Dashboard') : (language === 'fr' ? 'Commencer' : 'Get Started')}
            </Button>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden" style={{ background: 'var(--hero-gradient)' }}>
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full bg-primary/10 blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-accent/10 blur-[100px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-white/[0.03]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full border border-white/[0.02]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center max-w-4xl mx-auto"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} custom={0}>
              <Badge className="mb-6 bg-primary/20 text-primary-foreground border-primary/30 hover:bg-primary/30 px-4 py-1.5 text-sm font-medium">
                <Sparkles className="h-3.5 w-3.5 mr-2" />
                {language === 'fr' ? 'Plateforme propulsée par l\'IA' : 'AI-Powered Platform'}
              </Badge>
            </motion.div>

            <motion.h1 variants={fadeInUp} custom={1} className="text-4xl sm:text-5xl md:text-7xl font-extrabold text-white leading-[1.1] tracking-tight mb-6" style={{ fontFamily: 'Plus Jakarta Sans' }}>
              {language === 'fr' ? (
                <>
                  Transformez la formation <br className="hidden sm:block" />
                  <span className="bg-gradient-to-r from-[hsl(243,75%,70%)] via-[hsl(280,70%,65%)] to-[hsl(172,66%,55%)] bg-clip-text text-transparent">
                    en avantage compétitif
                  </span>
                </>
              ) : (
                <>
                  Transform Training <br className="hidden sm:block" />
                  <span className="bg-gradient-to-r from-[hsl(243,75%,70%)] via-[hsl(280,70%,65%)] to-[hsl(172,66%,55%)] bg-clip-text text-transparent">
                    Into Competitive Edge
                  </span>
                </>
              )}
            </motion.h1>

            <motion.p variants={fadeInUp} custom={2} className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed">
              {language === 'fr'
                ? 'Diagnostic IA, plans personnalisés, conformité OFPPT/GIAC et certificats numériques. Tout-en-un pour piloter la montée en compétences.'
                : 'AI diagnostics, personalized plans, OFPPT/GIAC compliance, and digital certificates. All-in-one platform to drive upskilling.'}
            </motion.p>

            <motion.div variants={fadeInUp} custom={3} className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Button
                size="lg"
                onClick={() => navigate(user ? '/dashboard' : '/auth')}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-base font-semibold rounded-xl shadow-[var(--brand-glow)]"
              >
                {language === 'fr' ? 'Commencer gratuitement' : 'Start for Free'}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => {
                  const el = document.getElementById('features');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="border-white/20 text-white hover:bg-white/10 px-8 py-6 text-base font-semibold rounded-xl bg-white/5"
              >
                <Play className="mr-2 h-5 w-5" />
                {language === 'fr' ? 'Voir la démo' : 'Watch Demo'}
              </Button>
            </motion.div>

            {/* Stats bar */}
            <motion.div variants={fadeInUp} custom={4} className="grid grid-cols-3 gap-6 max-w-3xl mx-auto">
              {stats.map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-3xl md:text-4xl font-extrabold text-white" style={{ fontFamily: 'Plus Jakarta Sans' }}>{stat.value}</div>
                  <div className="text-sm text-white/50 mt-1">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>


      {/* Features Section */}
      <section id="features" className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="secondary" className="mb-4">
              <Zap className="h-3.5 w-3.5 mr-1" />
              {language === 'fr' ? 'Fonctionnalités' : 'Features'}
            </Badge>
            <h2 className="text-3xl md:text-5xl font-extrabold text-foreground mb-4" style={{ fontFamily: 'Plus Jakarta Sans' }}>
              {language === 'fr' ? 'Tout pour la formation moderne' : 'Everything for Modern Training'}
            </h2>
            <p className="text-lg text-muted-foreground">
              {language === 'fr'
                ? 'De la planification IA à la conformité réglementaire, une plateforme complète.'
                : 'From AI planning to regulatory compliance, one complete platform.'}
            </p>
          </div>

          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
          >
            {features.map((feature, i) => (
              <motion.div key={i} variants={fadeInUp} custom={i}>
                <Card className="group relative overflow-hidden border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 bg-card h-full">
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 text-white shadow-lg`}>
                      {feature.icon}
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-2" style={{ fontFamily: 'Plus Jakarta Sans' }}>{feature.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                    <div className="mt-4 flex items-center text-primary text-sm font-semibold group-hover:translate-x-1 transition-transform">
                      {language === 'fr' ? 'En savoir plus' : 'Learn more'}
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Compliance Section */}
      <section className="py-20 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={staggerContainer}
            >
              <motion.div variants={fadeInUp} custom={0}>
                <Badge variant="secondary" className="mb-4">
                  <Shield className="h-3.5 w-3.5 mr-1" />
                  {language === 'fr' ? 'Conformité' : 'Compliance'}
                </Badge>
              </motion.div>
              <motion.h2 variants={fadeInUp} custom={1} className="text-3xl md:text-4xl font-extrabold text-foreground mb-6" style={{ fontFamily: 'Plus Jakarta Sans' }}>
                {language === 'fr' ? 'OFPPT & GIAC en toute sérénité' : 'OFPPT & GIAC Made Simple'}
              </motion.h2>
              <motion.p variants={fadeInUp} custom={2} className="text-lg text-muted-foreground mb-8">
                {language === 'fr'
                  ? 'Automatisez la gestion de vos dossiers CSF, suivez vos remboursements et restez conforme aux exigences réglementaires marocaines.'
                  : 'Automate CSF dossier management, track reimbursements, and stay compliant with Moroccan regulatory requirements.'}
              </motion.p>
              <motion.div variants={fadeInUp} custom={3} className="space-y-4">
                {[
                  language === 'fr' ? 'Génération automatique des 10 modèles OFPPT' : 'Auto-generate all 10 OFPPT document templates',
                  language === 'fr' ? 'Suivi des remboursements en temps réel' : 'Real-time reimbursement tracking',
                  language === 'fr' ? 'Calcul automatique des montants éligibles' : 'Automatic eligible amount calculation',
                  language === 'fr' ? 'Conformité GIAC intégrée' : 'Built-in GIAC compliance',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">{item}</span>
                  </div>
                ))}
              </motion.div>
            </motion.div>
            <motion.div
              className="relative"
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
            >
              <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl p-8 border border-border">
                <div className="space-y-4">
                  {[
                    { label: language === 'fr' ? 'Dossiers soumis' : 'Dossiers submitted', value: '47', change: '+12%' },
                    { label: language === 'fr' ? 'Taux d\'approbation' : 'Approval rate', value: '94%', change: '+5%' },
                    { label: language === 'fr' ? 'Remboursements récupérés' : 'Reimbursements recovered', value: '1.2M MAD', change: '+23%' },
                  ].map((metric, i) => (
                    <div key={i} className="bg-card rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{metric.label}</p>
                        <p className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Plus Jakarta Sans' }}>{metric.value}</p>
                      </div>
                      <Badge variant="secondary" className="text-accent font-semibold">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {metric.change}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>


      {/* Pricing */}
      <section id="pricing" className="py-20 md:py-28 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="secondary" className="mb-4">
              {language === 'fr' ? 'Tarifs' : 'Pricing'}
            </Badge>
            <h2 className="text-3xl md:text-5xl font-extrabold text-foreground mb-4" style={{ fontFamily: 'Plus Jakarta Sans' }}>
              {language === 'fr' ? 'Des tarifs adaptés à votre taille' : 'Pricing That Scales With You'}
            </h2>
            <p className="text-lg text-muted-foreground">
              {language === 'fr' ? 'Essai gratuit de 14 jours. Sans carte bancaire.' : '14-day free trial. No credit card required.'}
            </p>
          </div>

          <motion.div
            className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
          >
            {plans.map((plan, i) => (
              <motion.div key={i} variants={fadeInUp} custom={i}>
                <Card className={`relative bg-card border-border/50 ${plan.popular ? 'border-primary shadow-xl shadow-primary/10 scale-[1.02]' : ''} transition-all hover:shadow-lg h-full`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground px-4 py-1 font-semibold">
                        {language === 'fr' ? 'Populaire' : 'Most Popular'}
                      </Badge>
                    </div>
                  )}
                  <CardContent className="p-6 pt-8">
                    <h3 className="text-xl font-bold text-foreground mb-1" style={{ fontFamily: 'Plus Jakarta Sans' }}>{plan.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                    <div className="mb-6">
                      <span className="text-4xl font-extrabold text-foreground" style={{ fontFamily: 'Plus Jakarta Sans' }}>{plan.price}</span>
                      <span className="text-muted-foreground ml-1">MAD{plan.period}</span>
                    </div>
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((f, j) => (
                        <li key={j} className="flex items-start gap-2.5 text-sm">
                          <CheckCircle className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                          <span className="text-foreground">{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      onClick={() => navigate(user ? '/billing' : '/auth')}
                      className={`w-full rounded-xl ${plan.popular ? 'bg-primary hover:bg-primary/90' : ''}`}
                      variant={plan.popular ? 'default' : 'outline'}
                    >
                      {language === 'fr' ? 'Commencer l\'essai' : 'Start Trial'}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 md:py-28 overflow-hidden" style={{ background: 'var(--hero-gradient)' }}>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/15 blur-[120px]" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6" style={{ fontFamily: 'Plus Jakarta Sans' }}>
            {language === 'fr' ? 'Prêt à transformer vos formations ?' : 'Ready to Transform Your Training?'}
          </h2>
          <p className="text-lg text-white/60 mb-10 max-w-2xl mx-auto">
            {language === 'fr'
              ? 'Rejoignez plus de 500 entreprises qui utilisent QimataQ pour développer les compétences de leurs équipes.'
              : 'Join 500+ companies using QimataQ to develop their team\'s skills.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => navigate(user ? '/dashboard' : '/auth')}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-10 py-6 text-base font-semibold rounded-xl shadow-[var(--brand-glow)]"
            >
              {language === 'fr' ? 'Démarrer maintenant' : 'Get Started Now'}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="text-lg font-extrabold text-foreground" style={{ fontFamily: 'Plus Jakarta Sans' }}>QimataQ</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {language === 'fr'
                  ? 'La plateforme de formation intelligente pour les entreprises marocaines.'
                  : 'The intelligent training platform for Moroccan businesses.'}
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3 text-sm">{language === 'fr' ? 'Produit' : 'Product'}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">{language === 'fr' ? 'Fonctionnalités' : 'Features'}</a></li>
                <li><a href="#pricing" className="hover:text-foreground transition-colors">{language === 'fr' ? 'Tarifs' : 'Pricing'}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3 text-sm">{language === 'fr' ? 'Conformité' : 'Compliance'}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>OFPPT / CSF</li>
                <li>GIAC</li>
                <li>Open Badges 3.0</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3 text-sm">Contact</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>contact@trainproacademy.ma</li>
                <li>+212 5 22 00 00 00</li>
                <li>Casablanca, Maroc</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 text-center">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} QimataQ. {language === 'fr' ? 'Tous droits réservés.' : 'All rights reserved.'}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
