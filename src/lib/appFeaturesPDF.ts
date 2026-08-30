import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface FeatureSection {
  title: string;
  description: string;
  features: { name: string; description: string; access: string }[];
}

export function exportAppFeaturesPDF(language: 'fr' | 'en') {
  const fr = language === 'fr';
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const PRIMARY: [number, number, number] = [99, 56, 209];
  let yPos = 20;

  const checkPageBreak = (space: number) => {
    if (yPos + space > pageHeight - 25) { doc.addPage(); yPos = 20; }
  };

  // ── Cover ──
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, pageWidth, 8, 'F');
  yPos = 50;
  doc.setFontSize(28);
  doc.setTextColor(...PRIMARY);
  doc.text('QimataQ', pageWidth / 2, yPos, { align: 'center' });
  yPos += 14;
  doc.setFontSize(16);
  doc.setTextColor(80, 80, 80);
  doc.text(fr ? 'Guide complet des fonctionnalités' : 'Complete Feature Guide', pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;
  doc.setFontSize(11);
  doc.setTextColor(120, 120, 120);
  doc.text(new Date().toLocaleDateString(fr ? 'fr-FR' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }), pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;
  doc.text(fr ? 'Document confidentiel' : 'Confidential Document', pageWidth / 2, yPos, { align: 'center' });
  doc.setFillColor(...PRIMARY);
  doc.rect(0, pageHeight - 8, pageWidth, 8, 'F');

  // ── Feature sections ──
  const sections: FeatureSection[] = [
    {
      title: fr ? '1. Tableau de bord' : '1. Dashboard',
      description: fr
        ? "Vue d'ensemble centralisée de l'activité RH et formation avec indicateurs clés en temps réel."
        : 'Centralized overview of HR and training activity with real-time key indicators.',
      features: [
        { name: fr ? 'KPIs en temps réel' : 'Real-time KPIs', description: fr ? 'Employés, plans, modules, évaluations' : 'Employees, plans, modules, evaluations', access: fr ? 'Tous' : 'All' },
        { name: fr ? 'Graphiques analytiques' : 'Analytics Charts', description: fr ? 'Visualisation des tendances de formation' : 'Training trend visualization', access: fr ? 'Tous' : 'All' },
        { name: fr ? 'Actions rapides' : 'Quick Actions', description: fr ? 'Accès direct aux fonctions principales' : 'Direct access to main functions', access: fr ? 'Tous' : 'All' },
        { name: fr ? 'Données démo' : 'Demo Data Seeder', description: fr ? 'Chargement de données fictives pour test' : 'Load fictitious data for testing', access: 'Admin' },
      ],
    },
    {
      title: fr ? '2. Profil entreprise' : '2. Company Profile',
      description: fr
        ? "Gestion complète du profil de l'entreprise, départements et employés."
        : 'Complete management of company profile, departments, and employees.',
      features: [
        { name: fr ? 'Informations société' : 'Company Info', description: fr ? 'Nom, secteur, taille, ICE, RC, CNSS' : 'Name, industry, size, ICE, RC, CNSS', access: 'Admin / HR' },
        { name: fr ? 'Logo & branding' : 'Logo & Branding', description: fr ? 'Upload logo et couleur primaire' : 'Upload logo and primary color', access: 'Admin' },
        { name: fr ? 'Gestion des départements' : 'Department Management', description: fr ? 'CRUD départements avec hiérarchie' : 'CRUD departments with hierarchy', access: 'Admin / HR' },
        { name: fr ? 'Liste des employés' : 'Employee List', description: fr ? 'Ajout, édition, import CSV, recherche' : 'Add, edit, CSV import, search', access: 'Admin / HR' },
        { name: fr ? 'Organigramme' : 'Org Chart', description: fr ? 'Visualisation de la structure organisationnelle' : 'Organizational structure visualization', access: fr ? 'Tous' : 'All' },
      ],
    },
    {
      title: fr ? '3. Fiches de poste' : '3. Job Descriptions',
      description: fr
        ? 'Création et gestion des fiches de poste avec compétences requises et bibliothèque de modèles.'
        : 'Create and manage job descriptions with required competencies and template library.',
      features: [
        { name: fr ? 'Éditeur de fiches' : 'JD Editor', description: fr ? 'Titre, département, niveau, responsabilités' : 'Title, department, level, responsibilities', access: 'Admin / HR' },
        { name: fr ? 'Compétences requises' : 'Required Skills', description: fr ? 'Gestion des compétences techniques et soft skills' : 'Technical skills and soft skills management', access: 'Admin / HR' },
        { name: fr ? 'Bibliothèque de modèles' : 'Template Library', description: fr ? 'Modèles prédéfinis par secteur' : 'Pre-built templates by industry', access: fr ? 'Tous' : 'All' },
        { name: fr ? 'Génération IA' : 'AI Generation', description: fr ? 'Suggestions automatiques de compétences' : 'Automatic skill suggestions', access: 'Admin / HR' },
      ],
    },
    {
      title: fr ? '4. Évaluations de performance' : '4. Performance Evaluations',
      description: fr
        ? "Système complet d'évaluation 360° avec analyse des compétences et recommandations."
        : 'Complete 360° evaluation system with skills analysis and recommendations.',
      features: [
        { name: fr ? 'Formulaire d\'évaluation' : 'Evaluation Form', description: fr ? 'Notation, forces, axes d\'amélioration' : 'Rating, strengths, areas for improvement', access: 'Admin / HR' },
        { name: fr ? 'Analyse IA des CV' : 'AI Resume Analysis', description: fr ? 'Extraction et analyse automatique des compétences' : 'Automatic skill extraction and analysis', access: 'Admin / HR' },
        { name: fr ? 'Scorecard compétences' : 'Competency Scorecard', description: fr ? 'Radar chart des compétences évaluées' : 'Radar chart of evaluated competencies', access: fr ? 'Tous' : 'All' },
        { name: fr ? 'Analytics performance' : 'Performance Analytics', description: fr ? 'Tableaux de bord et tendances' : 'Dashboards and trends', access: 'Admin / HR' },
        { name: fr ? 'Export PDF évaluation' : 'Evaluation PDF Export', description: fr ? 'Rapport détaillé exportable' : 'Detailed exportable report', access: 'Admin / HR' },
      ],
    },
    {
      title: fr ? '5. Diagnostic de formation' : '5. Training Diagnostic',
      description: fr
        ? "Analyse des besoins en formation basée sur les écarts de compétences."
        : 'Training needs analysis based on skills gaps.',
      features: [
        { name: fr ? 'Import bulk employés' : 'Bulk Employee Import', description: fr ? 'Upload CSV des employés pour diagnostic' : 'CSV upload of employees for diagnostic', access: 'Admin / HR' },
        { name: fr ? 'Recommandations IA' : 'AI Recommendations', description: fr ? 'Suggestions de formations personnalisées' : 'Personalized training suggestions', access: 'Admin / HR' },
        { name: fr ? 'Analyse des gaps' : 'Gap Analysis', description: fr ? 'Identification des écarts compétences/postes' : 'Skills-to-position gap identification', access: 'Admin / HR' },
      ],
    },
    {
      title: fr ? '6. Plans de formation' : '6. Training Plans',
      description: fr
        ? "Création, gestion et suivi des plans de formation avec budget et conformité OFPPT."
        : 'Create, manage, and track training plans with budget and OFPPT compliance.',
      features: [
        { name: fr ? 'Générateur IA' : 'AI Generator', description: fr ? 'Plan complet généré par IA avancée' : 'Complete plan generated by advanced AI', access: 'Admin / HR' },
        { name: fr ? 'Analyse SWOT' : 'SWOT Analysis', description: fr ? 'Forces, faiblesses, opportunités, menaces' : 'Strengths, weaknesses, opportunities, threats', access: fr ? 'Tous' : 'All' },
        { name: fr ? 'Analyse PESTEL' : 'PESTEL Analysis', description: fr ? 'Facteurs macro-environnementaux' : 'Macro-environmental factors', access: fr ? 'Tous' : 'All' },
        { name: fr ? 'Diagramme de Gantt' : 'Gantt Chart', description: fr ? 'Planning visuel des actions' : 'Visual action planning', access: fr ? 'Tous' : 'All' },
        { name: fr ? 'Calculateur ROI' : 'ROI Calculator', description: fr ? 'Retour sur investissement estimé' : 'Estimated return on investment', access: 'Admin / HR' },
        { name: fr ? 'Versioning' : 'Version History', description: fr ? 'Historique des versions du plan' : 'Plan version history', access: 'Admin / HR' },
        { name: fr ? 'Export PDF plan' : 'Plan PDF Export', description: fr ? 'Document professionnel multi-pages' : 'Multi-page professional document', access: fr ? 'Tous' : 'All' },
        { name: fr ? 'Commentaires' : 'Comments', description: fr ? 'Discussion collaborative sur le plan' : 'Collaborative discussion on the plan', access: fr ? 'Tous' : 'All' },
        { name: fr ? 'Partage & templates' : 'Sharing & Templates', description: fr ? 'Partage par email et sauvegarde modèles' : 'Email sharing and template saving', access: 'Admin / HR' },
      ],
    },
    {
      title: fr ? '7. Studio de modules' : '7. Module Studio',
      description: fr
        ? "Création de contenus de formation interactifs avec slides, quiz et scripts."
        : 'Create interactive training content with slides, quizzes, and scripts.',
      features: [
        { name: fr ? 'Éditeur de slides' : 'Slide Editor', description: fr ? 'Création drag-and-drop de diapositives' : 'Drag-and-drop slide creation', access: 'Trainer / Admin' },
        { name: fr ? 'Éditeur de quiz' : 'Quiz Editor', description: fr ? 'QCM avec scoring automatique' : 'MCQ with automatic scoring', access: 'Trainer / Admin' },
        { name: fr ? 'Génération IA contenu' : 'AI Content Generation', description: fr ? 'Slides, quiz et script générés par IA' : 'AI-generated slides, quizzes, and scripts', access: 'Trainer / Admin' },
        { name: fr ? 'Mode présentation' : 'Presentation Mode', description: fr ? 'Plein écran avec transitions animées' : 'Full screen with animated transitions', access: fr ? 'Tous' : 'All' },
        { name: fr ? 'Export PDF module' : 'Module PDF Export', description: fr ? 'Guide de formation professionnel' : 'Professional training guide', access: fr ? 'Tous' : 'All' },
        { name: fr ? 'Suivi des apprenants' : 'Learner Progress', description: fr ? 'Progression slides et scores quiz' : 'Slide progress and quiz scores', access: fr ? 'Tous' : 'All' },
        { name: 'SCORM / xAPI', description: fr ? 'Compatibilité LMS standard' : 'Standard LMS compatibility', access: 'Admin' },
      ],
    },
    {
      title: fr ? '8. Évaluation organisationnelle 360°' : '8. 360° Organizational Assessment',
      description: fr
        ? "Analyse complète de la maturité RH avec SWOT compétences, gaps et plan d'action."
        : 'Complete HR maturity analysis with competency SWOT, gaps, and action plan.',
      features: [
        { name: fr ? 'Score de maturité' : 'Maturity Score', description: fr ? 'Évaluation globale sur 100' : 'Overall score out of 100', access: 'Admin / HR' },
        { name: fr ? 'SWOT compétences' : 'Competency SWOT', description: fr ? 'Analyse forces/faiblesses des compétences' : 'Strengths/weaknesses analysis of skills', access: 'Admin / HR' },
        { name: fr ? 'Analyse des gaps' : 'Skills Gap Analysis', description: fr ? 'Gaps critiques avec recommandations' : 'Critical gaps with recommendations', access: 'Admin / HR' },
        { name: fr ? 'Planification postes' : 'Position Planning', description: fr ? 'Upskilling, reskilling, recrutement' : 'Upskilling, reskilling, recruitment', access: 'Admin / HR' },
        { name: fr ? 'Matrice 9-Box' : '9-Box Grid', description: fr ? 'Cartographie talent/performance' : 'Talent/performance mapping', access: 'Admin / HR' },
        { name: fr ? 'Heatmap compétences' : 'Skills Heatmap', description: fr ? 'Vue thermique des compétences' : 'Thermal view of skills', access: 'Admin / HR' },
        { name: fr ? 'Export PDF rapport' : 'Report PDF Export', description: fr ? 'Rapport 360° brandé multi-pages' : 'Multi-page branded 360° report', access: 'Admin / HR' },
      ],
    },
    {
      title: fr ? '9. Remboursement OFPPT / CSF' : '9. OFPPT / CSF Reimbursement',
      description: fr
        ? "Gestion des dossiers de remboursement OFPPT avec documents réglementaires."
        : 'OFPPT reimbursement dossier management with regulatory documents.',
      features: [
        { name: fr ? 'Dossiers de remboursement' : 'Reimbursement Dossiers', description: fr ? 'Création et suivi des dossiers CSF' : 'Create and track CSF dossiers', access: 'Admin / HR' },
        { name: fr ? 'Documents réglementaires' : 'Regulatory Documents', description: fr ? '10 modèles OFPPT officiels' : '10 official OFPPT templates', access: 'Admin / HR' },
        { name: fr ? 'Rapport annuel' : 'Annual Report', description: fr ? 'Rapport annuel de formation exportable' : 'Exportable annual training report', access: 'Admin / HR' },
      ],
    },
    {
      title: fr ? '10. Benchmark & Recherche' : '10. Benchmark & Research',
      description: fr
        ? "Comparaison sectorielle et recherche de marché pour positionner la stratégie formation."
        : 'Industry comparison and market research to position training strategy.',
      features: [
        { name: fr ? 'Comparaison sectorielle' : 'Industry Comparison', description: fr ? 'Benchmarks par secteur d\'activité' : 'Benchmarks by industry sector', access: 'Admin / HR' },
        { name: fr ? 'Bonnes pratiques' : 'Best Practices', description: fr ? 'Recommandations sectorielles' : 'Industry recommendations', access: fr ? 'Tous' : 'All' },
        { name: fr ? 'Recherche entreprise' : 'Company Research', description: fr ? 'Veille concurrentielle IA' : 'AI competitive intelligence', access: 'Admin / HR' },
      ],
    },
    {
      title: fr ? '11. Marketplace' : '11. Marketplace',
      description: fr
        ? "Place de marché pour acheter et vendre des modules de formation."
        : 'Marketplace to buy and sell training modules.',
      features: [
        { name: fr ? 'Catalogue de formations' : 'Training Catalog', description: fr ? 'Parcourir et acheter des modules' : 'Browse and purchase modules', access: fr ? 'Tous' : 'All' },
        { name: fr ? 'Analytics vendeur' : 'Seller Analytics', description: fr ? 'Suivi des ventes et revenus' : 'Sales and revenue tracking', access: 'Trainer' },
      ],
    },
    {
      title: fr ? '12. Collaboration & Communication' : '12. Collaboration & Communication',
      description: fr
        ? "Outils de collaboration en équipe et notifications."
        : 'Team collaboration tools and notifications.',
      features: [
        { name: fr ? 'Fils de discussion' : 'Discussion Threads', description: fr ? 'Conversations contextuelles' : 'Contextual conversations', access: fr ? 'Tous' : 'All' },
        { name: fr ? 'Centre de notifications' : 'Notification Center', description: fr ? 'Alertes et rappels en temps réel' : 'Real-time alerts and reminders', access: fr ? 'Tous' : 'All' },
        { name: fr ? 'Sync calendrier' : 'Calendar Sync', description: fr ? 'Intégration calendrier externe' : 'External calendar integration', access: fr ? 'Tous' : 'All' },
        { name: fr ? 'Palette de commandes' : 'Command Palette', description: fr ? 'Navigation rapide Ctrl+K' : 'Quick navigation Ctrl+K', access: fr ? 'Tous' : 'All' },
      ],
    },
    {
      title: fr ? '13. Administration' : '13. Administration',
      description: fr
        ? "Gestion des utilisateurs, rôles, abonnements et paramètres de la plateforme."
        : 'User, role, subscription, and platform settings management.',
      features: [
        { name: fr ? 'Gestion des rôles' : 'Role Management', description: fr ? 'Admin, HR Manager, Trainer, Employee' : 'Admin, HR Manager, Trainer, Employee', access: 'Admin' },
        { name: fr ? 'Gestion des utilisateurs' : 'User Management', description: fr ? 'Invitations et gestion des accès' : 'Invitations and access management', access: 'Admin' },
        { name: fr ? 'Facturation & abonnements' : 'Billing & Subscriptions', description: fr ? 'Plans Starter, Professional, Enterprise' : 'Starter, Professional, Enterprise plans', access: 'Admin' },
        { name: fr ? 'Programme de parrainage' : 'Referral Program', description: fr ? 'Parrainer et gagner des crédits' : 'Refer and earn credits', access: fr ? 'Tous' : 'All' },
        { name: fr ? 'Certificats' : 'Certificates', description: fr ? 'Génération de certificats de formation' : 'Training certificate generation', access: 'Admin / HR' },
        { name: fr ? 'Export données' : 'Data Export', description: fr ? 'CSV, PDF, JSON' : 'CSV, PDF, JSON', access: 'Admin / HR' },
      ],
    },
  ];

  // ── Content pages ──
  doc.addPage();
  yPos = 20;

  // TOC
  doc.setFontSize(18);
  doc.setTextColor(...PRIMARY);
  doc.text(fr ? 'Table des matières' : 'Table of Contents', 20, yPos);
  yPos += 12;
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  sections.forEach((s) => {
    doc.text(s.title, 25, yPos);
    yPos += 6;
  });

  // Sections
  sections.forEach((section) => {
    doc.addPage();
    yPos = 20;

    // Section header
    doc.setFillColor(...PRIMARY);
    doc.roundedRect(15, yPos - 5, pageWidth - 30, 14, 3, 3, 'F');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text(section.title, 20, yPos + 5);
    yPos += 18;

    // Description
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    const descLines = doc.splitTextToSize(section.description, pageWidth - 40);
    doc.text(descLines, 20, yPos);
    yPos += descLines.length * 5 + 6;

    // Features table
    autoTable(doc, {
      startY: yPos,
      head: [[
        fr ? 'Fonctionnalité' : 'Feature',
        fr ? 'Description' : 'Description',
        fr ? 'Accès' : 'Access',
      ]],
      body: section.features.map((f) => [f.name, f.description, f.access]),
      theme: 'grid',
      headStyles: { fillColor: PRIMARY, fontSize: 9 },
      styles: { fontSize: 8, cellPadding: 4 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 45 }, 2: { cellWidth: 30 } },
      margin: { left: 20, right: 20 },
    });
    yPos = (doc as any).lastAutoTable.finalY + 10;
  });

  // ── Footer on every page ──
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(...PRIMARY);
    doc.setLineWidth(0.5);
    doc.line(20, pageHeight - 15, pageWidth - 20, pageHeight - 15);
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text('QimataQ', 20, pageHeight - 10);
    doc.text(`Page ${i}/${totalPages}`, pageWidth - 20, pageHeight - 10, { align: 'right' });
    doc.text(fr ? 'Guide des fonctionnalités' : 'Feature Guide', pageWidth / 2, pageHeight - 10, { align: 'center' });
  }

  doc.save(`QimataQ_Feature_Guide_${new Date().toISOString().slice(0, 10)}.pdf`);
}
