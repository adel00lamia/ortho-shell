import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Seo } from '@/components/seo/Seo';
import { ArrowRight, ArrowDown, Menu, X } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();
  const { user } = useAuth();
  const fr = language === 'fr';
  const L = (a: string, b: string) => (fr ? a : b);
  const [menu, setMenu] = useState(false);
  const [node, setNode] = useState(0);
  const start = () => navigate(user ? '/transformation' : '/auth');

  const chain = [
    [L('Stratégie', 'Strategy'), L('Entrer sur 2 marchés africains', 'Enter 2 African markets')],
    [L('Capacité', 'Capability'), L('Vente internationale', 'International sales')],
    [L('Processus', 'Process'), L('Développement de marché', 'Market development')],
    [L('Rôle', 'Role'), 'Export Manager'],
    [L('Compétence', 'Skill'), L('Intelligence marché', 'Market intelligence')],
    [L('Humain + IA', 'Human + AI'), L('Agent de recherche', 'Research agent')],
    [L('Action', 'Action'), L('Former + recruter + déployer un agent', 'Train + recruit + deploy agent')],
    [L('Impact', 'Impact'), L('Entrée marché plus rapide', 'Faster market entry')],
  ];

  const problems = [
    [L('La stratégie est déconnectée de la planification des effectifs.', 'Strategy is disconnected from workforce planning.'), L('Les objectifs sont fixés par la direction ; organisation, compétences et formation sont gérées à part.', 'Objectives are set by management; organisation, skills and training are managed separately.')],
    [L('On mesure des postes, pas le travail.', 'Companies measure jobs, not work.'), L('Les systèmes analysent intitulés et salariés, pas les processus et tâches qui créent la valeur.', 'Systems analyse job titles, not the processes and tasks that create value.')],
    [L('L’IA change le modèle opérationnel.', 'AI changes the operating model.'), L('La question devient : que fait l’humain, que fait l’IA, où travaillent-ils ensemble ?', 'The question becomes: what do humans do, what does AI do, where do they work together?')],
    [L('Les actions de transformation sont fragmentées.', 'Transformation actions are fragmented.'), L('Formation, recrutement, conseil, technologie et financement public suivent des circuits séparés.', 'Training, hiring, consultants, technology and public funding run through separate processes.')],
  ];

  const steps = [
    [L('Définir la stratégie', 'Define the strategy'), L('Priorités de croissance, marchés, coûts, ambitions digitales et IA.', 'Growth priorities, markets, cost, digital and AI ambitions.')],
    [L('Cartographier l’entreprise', 'Map the business'), L('Chaîne de valeur, capacités, processus, rôles clés.', 'Value chain, capabilities, processes, key roles.')],
    [L('Analyser le travail', 'Analyse the work'), L('Activités, tâches, criticité, charge, impact.', 'Activities, tasks, criticality, workload, impact.')],
    [L('Concevoir le travail Humain + IA', 'Design Human + AI work'), L('Cinq modes opératoires par tâche.', 'Five operating modes per task.')],
    [L('Identifier les écarts', 'Identify gaps'), L('Capacités, organisation, processus, effectifs, compétences, maturité IA.', 'Capabilities, organisation, process, workforce, skills, AI readiness.')],
    [L('Recommander les actions', 'Recommend actions'), 'Build · Buy · Borrow · Redeploy · Bot · Redesign'],
    [L('Financer et mesurer', 'Fund and measure'), L('Financements potentiels, plan, KPI, résultats.', 'Potential funding, plan, KPIs, outcomes.')],
  ];

  const modes = [L('Humain seul', 'Human only'), L('Humain + IA', 'Human + AI'), L('IA + validation', 'AI + approval'), L('IA autonome', 'AI autonomous'), L('Flux automatisé', 'Automated workflow')];
  const actions = [
    ['BUILD', L('Former ou reconvertir les talents internes.', 'Train or reskill internal talent.')],
    ['BUY', L('Recruter les capacités manquantes.', 'Recruit missing capabilities.')],
    ['BORROW', L('Mobiliser une expertise externe.', 'Bring in external expertise.')],
    ['REDEPLOY', L('Réaffecter les talents vers les priorités.', 'Move talent toward priority capabilities.')],
    ['BOT', L('Introduire agents IA ou automatisation.', 'Introduce AI agents or automation.')],
    ['REDESIGN', L('Changer le processus ou l’organisation.', 'Change the process or operating model.')],
  ];
  const causes = [[L('Processus', 'Process'), 40], [L('Capacité', 'Capacity'), 25], [L('Compétences', 'Skills'), 15], [L('Données', 'Data'), 10], [L('Technologie', 'Technology'), 10]] as const;

  const H2 = ({ k, t }: { k: string; t: string }) => (
    <div className="mb-12 max-w-3xl"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-3">{k}</p><h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">{t}</h2></div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Seo path="/" title={L('Qimatak | De la stratégie à l’exécution Humain + IA', 'Qimatak | From strategy to Human + AI execution')}
        description={L('Qimatak traduit votre stratégie en capacités, processus, rôles, compétences et répartition Humain + IA, puis en actions de transformation mesurables.', 'Qimatak turns your strategy into capabilities, processes, roles, skills and Human + AI allocation, then into measurable transformation actions.')} />

      <header className="fixed top-0 w-full z-50 bg-background/85 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-foreground text-background flex items-center justify-center font-extrabold">Q</div>
            <span className="text-lg font-extrabold tracking-tight">Qimatak</span>
          </div>
          <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
            <a href="#how" className="hover:text-foreground">{L('Méthode', 'Method')}</a>
            <a href="#workgraph" className="hover:text-foreground">WorkGraph</a>
            <a href="#human-ai" className="hover:text-foreground">{L('Humain + IA', 'Human + AI')}</a>
            <a href="#funding" className="hover:text-foreground">{L('Financement', 'Funding')}</a>
            <div className="flex gap-1 bg-muted rounded-md p-0.5">
              {(['fr', 'en'] as const).map((l) => <button key={l} onClick={() => setLanguage(l)} className={`text-xs px-2 py-1 rounded ${language === l ? 'bg-background text-foreground font-semibold' : ''}`}>{l.toUpperCase()}</button>)}
            </div>
          </nav>
          <div className="hidden md:flex gap-2">
            {!user && <Button variant="ghost" onClick={() => navigate('/auth')}>{L('Connexion', 'Sign in')}</Button>}
            <Button onClick={start}>{L('Démarrer', 'Get started')}<ArrowRight className="ml-2 h-4 w-4" /></Button>
          </div>
          <button className="md:hidden" onClick={() => setMenu(!menu)} aria-label="Menu">{menu ? <X /> : <Menu />}</button>
        </div>
        {menu && <div className="md:hidden border-t border-border px-4 py-4 space-y-3 bg-background"><Button className="w-full" onClick={start}>{L('Démarrer mon diagnostic', 'Start my diagnostic')}</Button><button className="text-sm" onClick={() => setLanguage(fr ? 'en' : 'fr')}>{fr ? 'English' : 'Français'}</button></div>}
      </header>

      {/* HERO */}
      <section className="pt-32 pb-20 md:pt-40 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid lg:grid-cols-[1.2fr_1fr] gap-14 items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-6">{L('De la stratégie à l’exécution Humain + IA', 'From Business Strategy to Human + AI Execution')}</p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.05] mb-6">{L('Transformez votre stratégie en organisation capable de l’exécuter.', 'Turn your strategy into the workforce your business needs.')}</h1>
            <p className="text-lg text-muted-foreground max-w-xl mb-4">{L('Qimatak cartographie votre organisation, identifie les capacités, personnes, compétences et IA nécessaires à votre stratégie, et convertit les écarts en actions de transformation mesurables.', 'Qimatak maps your organisation, identifies the capabilities, people, skills and AI required to execute your strategy, and converts the gaps into measurable transformation actions.')}</p>
            <p className="text-sm font-medium text-foreground mb-8">{L('Stratégie. Organisation. Effectifs. IA. Financement. Impact.', 'Strategy. Organisation. Workforce. AI. Funding. Impact.')}</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button size="lg" onClick={start}>{L('Démarrer mon diagnostic de transformation', 'Start your Transformation Diagnostic')}<ArrowRight className="ml-2 h-4 w-4" /></Button>
              <Button size="lg" variant="outline" onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })}>{L('Explorer la plateforme', 'Explore the platform')}</Button>
            </div>
            <p className="mt-6 text-xs text-muted-foreground">{L('Conçu pour les entreprises en croissance, digitalisation, adoption de l’IA et transformation des effectifs. Prototype fonctionnel · en phase pilote.', 'Built for companies navigating growth, digitalisation, AI adoption and workforce transformation. Working prototype · pilot phase.')}</p>
          </motion.div>

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex justify-between text-xs text-muted-foreground mb-4"><span>{L('Chaîne de transformation', 'Transformation chain')}</span><span>{L('Survolez un nœud', 'Hover a node')}</span></div>
            <div className="space-y-1">
              {chain.map(([k, ex], i) => (
                <div key={k}>
                  <button onMouseEnter={() => setNode(i)} onFocus={() => setNode(i)} onClick={() => setNode(i)}
                    className={`w-full flex items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition-colors ${node === i ? 'border-primary bg-primary/5' : 'border-border'}`}>
                    <span className="font-semibold">{k}</span>
                    <span className={`text-xs ${node === i ? 'text-primary' : 'text-muted-foreground'}`}>{ex}</span>
                  </button>
                  {i < chain.length - 1 && <div className="flex justify-center h-2"><div className="w-px bg-border" /></div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="py-24 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <H2 k={L('Le problème', 'The problem')} t={L('Les entreprises savent où elles veulent aller. Rarement comment leur organisation doit changer pour y arriver.', 'Companies know where they want to go. They rarely know how their organisation must change to get there.')} />
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border rounded-xl overflow-hidden">
            {problems.map(([t, d], i) => <div key={t} className="bg-card p-6"><div className="text-xs text-muted-foreground mb-4">0{i + 1}</div><h3 className="font-bold mb-2">{t}</h3><p className="text-sm text-muted-foreground">{d}</p></div>)}
          </div>
          <p className="mt-10 text-xl font-semibold">{L('Qimatak relie toutes ces décisions dans un seul système de transformation.', 'Qimatak connects all these decisions in one transformation system.')}</p>
        </div>
      </section>

      {/* HOW */}
      <section id="how" className="py-24 border-b border-border bg-muted/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <H2 k={L('Méthode', 'How it works')} t={L('De la stratégie à l’exécution.', 'From strategy to execution.')} />
          <ol className="grid md:grid-cols-7 gap-4">
            {steps.map(([t, d], i) => <li key={t} className="border-t-2 border-foreground pt-4"><div className="text-xs text-muted-foreground mb-2">{L('Étape', 'Step')} {i + 1}</div><h3 className="font-bold text-sm mb-2">{t}</h3><p className="text-xs text-muted-foreground">{d}</p></li>)}
          </ol>
        </div>
      </section>

      {/* WORKGRAPH */}
      <section id="workgraph" className="py-24 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <H2 k="Qimatak WorkGraph" t={L('Comprenez comment votre entreprise fonctionne réellement.', 'Understand how your business really works.')} />
          <div className="grid lg:grid-cols-3 gap-6 mb-10">
            {[
              [L('Objectif', 'Objective'), L('Capacité', 'Capability'), L('Processus', 'Process'), L('Tâche', 'Task'), L('Rôle', 'Role'), L('Compétence', 'Skill'), L('Collaborateur', 'Employee')],
              [L('Tâche', 'Task'), L('Agent IA', 'AI agent'), L('Contrôle humain', 'Human control')],
              [L('Écart', 'Gap'), L('Intervention', 'Intervention'), L('Résultat business', 'Business outcome')],
            ].map((row, r) => (
              <div key={r} className="rounded-xl border border-border bg-card p-5 space-y-1">
                {row.map((x, i) => <div key={x + i}><div className="rounded-md border border-border px-3 py-2 text-sm font-medium">{x}</div>{i < row.length - 1 && <ArrowDown className="h-3 w-3 mx-auto my-1 text-muted-foreground" />}</div>)}
              </div>
            ))}
          </div>
          <p className="text-muted-foreground max-w-3xl mb-10">{L('Au lieu d’analyser des données RH isolées, Qimatak comprend les relations entre stratégie, travail, personnes, technologie et performance.', 'Instead of analysing isolated HR data, Qimatak understands the relationships between strategy, work, people, technology and performance.')}</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[[L('Clarté business', 'Business clarity'), L('Quelles capacités sont critiques pour exécuter la stratégie.', 'Which capabilities are critical to execute the strategy.')], [L('Intelligence des effectifs', 'Workforce intelligence'), L('Quels rôles, personnes et compétences doivent évoluer.', 'Which roles, people and skills must evolve.')], [L('Modèle opérationnel IA', 'AI operating model'), L('Où l’IA augmente, automatise ou reste sous supervision humaine.', 'Where AI augments, automates or stays under human supervision.')]].map(([t, d]) => <div key={t}><h3 className="font-bold uppercase text-xs tracking-widest mb-2">{t}</h3><p className="text-sm text-muted-foreground">{d}</p></div>)}
          </div>
        </div>
      </section>

      {/* HUMAN + AI */}
      <section id="human-ai" className="py-24 border-b border-border bg-muted/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-12">
          <div>
            <H2 k={L('Humain + IA', 'Human + AI')} t={L('L’IA ne se déploie pas au hasard. Elle se conçoit autour du travail.', 'AI should not be deployed randomly. It should be designed around work.')} />
            <div className="flex flex-wrap gap-2 mb-6">{modes.map((m) => <span key={m} className="rounded-full border border-border bg-card px-3 py-1 text-xs">{m}</span>)}</div>
            <p className="text-sm text-muted-foreground">{L('Chaque tâche est évaluée selon : répétitivité, disponibilité des données, clarté des règles, complexité, interaction humaine, jugement, risque de conformité, importance stratégique, fréquence et temps passé.', 'Each task is rated on repetitiveness, data availability, rules clarity, complexity, human interaction, judgment, compliance risk, strategic importance, frequency and time spent.')}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-6 self-start">
            <div className="text-xs text-muted-foreground mb-1">{L('Tâche — exemple illustratif', 'Task — illustrative example')}</div>
            <div className="text-lg font-bold mb-5">{L('Veille concurrentielle', 'Competitive market monitoring')}</div>
            {[[L('Adéquation IA', 'AI suitability'), '87%'], [L('Jugement humain requis', 'Human judgment'), L('Moyen', 'Medium')], [L('Valeur business', 'Business value'), L('Élevée', 'High')], [L('Gain de capacité estimé', 'Estimated capacity gain'), L('6 h / semaine', '6 h / week')]].map(([k, v]) => <div key={k} className="flex justify-between border-b border-border py-2 text-sm"><span className="text-muted-foreground">{k}</span><span className="font-semibold">{v}</span></div>)}
            <div className="mt-4 rounded-md bg-primary/10 text-primary px-3 py-2 text-sm font-semibold">{L('Recommandation : Agent IA + validation humaine', 'Recommendation: AI agent + human validation')}</div>
          </div>
        </div>
      </section>

      {/* ACTIONS */}
      <section className="py-24 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <H2 k={L('Actions de transformation', 'Transformation actions')} t={L('Ne recommandez pas une formation quand la formation n’est pas la réponse.', 'Don’t recommend training when training isn’t the answer.')} />
          <div className="grid lg:grid-cols-[1.4fr_1fr] gap-8">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border border border-border rounded-xl overflow-hidden">
              {actions.map(([t, d]) => <div key={t} className="bg-card p-5"><div className="font-extrabold tracking-widest text-sm mb-2">{t}</div><p className="text-sm text-muted-foreground">{d}</p></div>)}
            </div>
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="text-xs text-muted-foreground mb-1">{L('Problème de performance — exemple', 'Performance issue — example')}</div>
              <div className="font-bold mb-4">{L('Réponse lente aux appels d’offres', 'Slow tender response')}</div>
              {causes.map(([k, v]) => <div key={k} className="mb-2"><div className="flex justify-between text-xs mb-1"><span>{k}</span><span>{v}%</span></div><div className="h-1.5 rounded bg-muted"><div className="h-1.5 rounded bg-foreground" style={{ width: `${v}%` }} /></div></div>)}
              <p className="text-sm mt-4"><span className="font-semibold">{L('Action : ', 'Action: ')}</span>{L('refonte du workflow + agent IA de recherche + formation ciblée.', 'redesign tender workflow + AI research agent + targeted training.')}</p>
            </div>
          </div>
          <p className="mt-8 text-muted-foreground">{L('Qimatak identifie la cause racine de l’écart avant de recommander une intervention.', 'Qimatak identifies the root cause of the gap before recommending an intervention.')}</p>
        </div>
      </section>

      {/* FUNDING */}
      <section id="funding" className="py-24 border-b border-border bg-muted/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <H2 k={L('Financement', 'Funding intelligence')} t={L('Transformez vos besoins en projets finançables.', 'Turn transformation needs into fundable projects.')} />
          <div className="flex flex-wrap items-center gap-2 mb-6">
            {[L('Besoin', 'Need'), L('Projet', 'Project'), L('Analyse d’éligibilité', 'Eligibility analysis'), L('Programme potentiel', 'Potential programme'), L('Pièces requises', 'Required documents')].map((x, i, a) => <div key={x} className="flex items-center gap-2"><span className="rounded-md border border-border bg-card px-3 py-2 text-sm">{x}</span>{i < a.length - 1 && <ArrowRight className="h-4 w-4 text-muted-foreground" />}</div>)}
          </div>
          <p className="text-sm text-muted-foreground max-w-3xl">{L('Qimatak identifie d’abord le besoin de transformation, puis rapproche l’intervention de programmes potentiels (OFPPT / CSF, GIAC…). Les règles sont présentées comme références à vérifier, jamais comme un droit acquis.', 'Qimatak first identifies the transformation need, then matches the intervention with potential programmes (OFPPT / CSF, GIAC…). Rules are shown as references to verify, never as a guaranteed entitlement.')}</p>
        </div>
      </section>

      {/* WHO / POSITIONING */}
      <section className="py-24 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-12">
          <div>
            <H2 k={L('Pour qui', 'Who it is for')} t={L('Pour ceux qui pilotent la transformation.', 'For those who lead transformation.')} />
            <ul className="grid grid-cols-2 gap-2 text-sm">{['CEO', L('DRH', 'HR Directors'), L('Directeurs transformation', 'Transformation Directors'), L('Directeurs stratégie', 'Strategy Directors'), 'CFO', L('Partenaires institutionnels', 'Institutional partners')].map((x) => <li key={x} className="border-b border-border py-2">{x}</li>)}</ul>
          </div>
          <div>
            <H2 k={L('Positionnement', 'Positioning')} t={L('Qimatak n’est pas…', 'Qimatak is not…')} />
            <div className="flex flex-wrap gap-2 mb-6">{['LMS', L('SIRH classique', 'Traditional HRIS'), L('Marketplace de formation', 'Training marketplace'), L('Plateforme de recrutement', 'Recruitment platform'), L('Simple chatbot IA', 'Simple AI chatbot')].map((x) => <span key={x} className="rounded-full border border-border px-3 py-1 text-sm text-muted-foreground line-through">{x}</span>)}</div>
            <p className="text-lg font-semibold">{L('La couche d’intelligence qui relie transformation business, développement des effectifs et financement.', 'The intelligence layer connecting business transformation, workforce development and funding.')}</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-foreground text-background">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-6">{L('Dites-nous comment votre organisation doit évoluer.', 'Tell us how your organisation must evolve.')}</h2>
          <p className="opacity-70 mb-10">{L('Prototype fonctionnel en phase pilote — nous recherchons des entreprises pilotes au Maroc.', 'Working prototype in pilot phase — we are looking for pilot companies in Morocco.')}</p>
          <Button size="lg" variant="secondary" onClick={start}>{L('Démarrer mon diagnostic de transformation', 'Start your Transformation Diagnostic')}<ArrowRight className="ml-2 h-4 w-4" /></Button>
        </div>
      </section>

      <footer className="py-10 border-t border-border text-sm text-muted-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row justify-between gap-4">
          <span><b className="text-foreground">Qimatak</b> — {L('De la stratégie à l’exécution Humain + IA.', 'From Business Strategy to Human + AI Execution.')}</span>
          <span>© {new Date().getFullYear()} Qimatak · Casablanca</span>
        </div>
      </footer>
    </div>
  );
};

export default Index;
