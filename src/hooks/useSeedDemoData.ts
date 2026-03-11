import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

const DEMO_COMPANY = {
  name: 'Atlas Industries Maroc',
  industry: 'Manufacturing',
  company_size: '200-500',
  address: '123 Boulevard Mohammed V',
  city: 'Casablanca',
  contact_email: 'rh@atlas-industries.ma',
  phone: '+212 522 123 456',
  cnss_number: '1234567',
  rc_number: 'RC-CASA-98765',
  ice_number: '001234567000089',
  domain: 'atlas-industries.ma',
  primary_color: '#1E40AF',
  profile_completed: true,
};

const DEMO_DEPARTMENTS = [
  { name: 'Direction Générale', description: 'Executive leadership and strategic planning', level: 0, employee_count: 3 },
  { name: 'Ressources Humaines', description: 'HR management, recruitment and training', level: 1, employee_count: 5 },
  { name: 'Production', description: 'Manufacturing and quality control', level: 1, employee_count: 45 },
  { name: 'Commercial', description: 'Sales, marketing and client relations', level: 1, employee_count: 15 },
  { name: 'Finance & Comptabilité', description: 'Financial planning and accounting', level: 1, employee_count: 8 },
  { name: 'IT & Digital', description: 'Information systems and digital transformation', level: 1, employee_count: 10 },
  { name: 'Logistique', description: 'Supply chain and warehouse management', level: 1, employee_count: 12 },
];

const DEMO_EMPLOYEES = [
  { full_name: 'Karim Benali', email: 'k.benali@atlas-industries.ma', department: 'Direction Générale', position: 'Directeur Général', contract_type: 'CDI', matricule: 'ATL-001', hire_date: '2015-03-01' },
  { full_name: 'Fatima Zahra El Amrani', email: 'f.elamrani@atlas-industries.ma', department: 'Ressources Humaines', position: 'DRH', contract_type: 'CDI', matricule: 'ATL-002', hire_date: '2016-06-15' },
  { full_name: 'Youssef Tazi', email: 'y.tazi@atlas-industries.ma', department: 'Production', position: 'Directeur de Production', contract_type: 'CDI', matricule: 'ATL-003', hire_date: '2017-01-10' },
  { full_name: 'Amina Chraibi', email: 'a.chraibi@atlas-industries.ma', department: 'Commercial', position: 'Directrice Commerciale', contract_type: 'CDI', matricule: 'ATL-004', hire_date: '2018-09-01' },
  { full_name: 'Omar Fassi', email: 'o.fassi@atlas-industries.ma', department: 'Finance & Comptabilité', position: 'DAF', contract_type: 'CDI', matricule: 'ATL-005', hire_date: '2016-02-20' },
  { full_name: 'Sara Idrissi', email: 's.idrissi@atlas-industries.ma', department: 'IT & Digital', position: 'DSI', contract_type: 'CDI', matricule: 'ATL-006', hire_date: '2019-04-01' },
  { full_name: 'Hassan Ouazzani', email: 'h.ouazzani@atlas-industries.ma', department: 'Logistique', position: 'Responsable Logistique', contract_type: 'CDI', matricule: 'ATL-007', hire_date: '2017-11-15' },
  { full_name: 'Leila Bennani', email: 'l.bennani@atlas-industries.ma', department: 'Ressources Humaines', position: 'Responsable Formation', contract_type: 'CDI', matricule: 'ATL-008', hire_date: '2020-01-06' },
  { full_name: 'Rachid Alaoui', email: 'r.alaoui@atlas-industries.ma', department: 'Production', position: 'Chef d\'Équipe', contract_type: 'CDI', matricule: 'ATL-009', hire_date: '2018-03-12' },
  { full_name: 'Nadia Berrada', email: 'n.berrada@atlas-industries.ma', department: 'Commercial', position: 'Chargée de Clientèle', contract_type: 'CDI', matricule: 'ATL-010', hire_date: '2021-07-01' },
  { full_name: 'Mehdi Sqalli', email: 'm.sqalli@atlas-industries.ma', department: 'IT & Digital', position: 'Développeur Full Stack', contract_type: 'CDI', matricule: 'ATL-011', hire_date: '2022-02-14' },
  { full_name: 'Zineb Kabbaj', email: 'z.kabbaj@atlas-industries.ma', department: 'Finance & Comptabilité', position: 'Comptable Senior', contract_type: 'CDI', matricule: 'ATL-012', hire_date: '2019-09-01' },
  { full_name: 'Ahmed Lahlou', email: 'a.lahlou@atlas-industries.ma', department: 'Production', position: 'Technicien Qualité', contract_type: 'CDD', matricule: 'ATL-013', hire_date: '2023-01-15' },
  { full_name: 'Houda Mansouri', email: 'h.mansouri@atlas-industries.ma', department: 'Commercial', position: 'Responsable Marketing Digital', contract_type: 'CDI', matricule: 'ATL-014', hire_date: '2022-06-01' },
  { full_name: 'Khalid Bouzidi', email: 'k.bouzidi@atlas-industries.ma', department: 'Logistique', position: 'Magasinier', contract_type: 'CDD', matricule: 'ATL-015', hire_date: '2023-09-01' },
];

const DEMO_JOB_DESCRIPTIONS = [
  {
    title: 'Directeur de Production',
    department: 'Production',
    level: 'senior',
    description: 'Supervise l\'ensemble des opérations de production, gestion des équipes et optimisation des processus industriels.',
    responsibilities: ['Planification de la production', 'Gestion des équipes', 'Contrôle qualité', 'Optimisation des coûts', 'Respect normes HSE'],
    competencies: [
      { name: 'Lean Manufacturing', level: 'expert', weight: 5 },
      { name: 'Management d\'équipe', level: 'expert', weight: 5 },
      { name: 'Gestion de la qualité', level: 'advanced', weight: 4 },
      { name: 'Planification industrielle', level: 'advanced', weight: 4 },
      { name: 'HSE', level: 'intermediate', weight: 3 },
    ],
    required_skills: ['Lean Manufacturing', 'Six Sigma', 'Management', 'ERP SAP'],
    preferred_skills: ['ISO 9001', 'Kaizen', 'TPM'],
  },
  {
    title: 'DRH',
    department: 'Ressources Humaines',
    level: 'senior',
    description: 'Définit et pilote la stratégie RH, gestion des talents, formation et relations sociales.',
    responsibilities: ['Stratégie RH', 'GPEC', 'Plan de formation', 'Relations sociales', 'Conformité droit du travail'],
    competencies: [
      { name: 'GPEC', level: 'expert', weight: 5 },
      { name: 'Droit du travail marocain', level: 'expert', weight: 5 },
      { name: 'Ingénierie de formation', level: 'advanced', weight: 4 },
      { name: 'Recrutement', level: 'advanced', weight: 4 },
    ],
    required_skills: ['GPEC', 'Droit social', 'Plan de formation', 'SIRH'],
    preferred_skills: ['OFPPT compliance', 'Bilan social'],
  },
  {
    title: 'Développeur Full Stack',
    department: 'IT & Digital',
    level: 'mid',
    description: 'Conception et développement d\'applications web pour la transformation digitale de l\'entreprise.',
    responsibilities: ['Développement front-end/back-end', 'Intégration API', 'Tests unitaires', 'Documentation technique'],
    competencies: [
      { name: 'React/TypeScript', level: 'advanced', weight: 5 },
      { name: 'Node.js', level: 'advanced', weight: 4 },
      { name: 'SQL/NoSQL', level: 'intermediate', weight: 4 },
      { name: 'DevOps CI/CD', level: 'intermediate', weight: 3 },
    ],
    required_skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
    preferred_skills: ['Docker', 'AWS', 'GraphQL'],
  },
  {
    title: 'Responsable Logistique',
    department: 'Logistique',
    level: 'mid',
    description: 'Gestion de la chaîne logistique, optimisation des flux et gestion des stocks.',
    responsibilities: ['Gestion des stocks', 'Optimisation des flux', 'Relations fournisseurs', 'Suivi KPIs logistiques'],
    competencies: [
      { name: 'Supply Chain Management', level: 'advanced', weight: 5 },
      { name: 'Gestion des stocks', level: 'advanced', weight: 4 },
      { name: 'Transport & Distribution', level: 'intermediate', weight: 3 },
      { name: 'ERP/WMS', level: 'intermediate', weight: 3 },
    ],
    required_skills: ['Supply Chain', 'Gestion des stocks', 'ERP'],
    preferred_skills: ['WMS', 'Lean Logistics', 'Douane export'],
  },
];

const DEMO_EVALUATIONS = [
  {
    employee_name: 'Youssef Tazi',
    employee_email: 'y.tazi@atlas-industries.ma',
    department: 'Production',
    overall_rating: 4.2,
    evaluation_period: '2025',
    strengths: ['Leadership technique', 'Gestion de crise', 'Rigueur opérationnelle'],
    areas_for_improvement: ['Communication transversale', 'Digitalisation des processus'],
    training_recommendations: ['Formation Lean Six Sigma Black Belt', 'Séminaire management transversal', 'Certification ISO 45001'],
    competency_scores: { 'Lean Manufacturing': 4, 'Management': 4, 'Qualité': 5, 'Planification': 4, 'HSE': 3 },
    career_goals: 'Directeur des opérations industrielles à moyen terme',
  },
  {
    employee_name: 'Fatima Zahra El Amrani',
    employee_email: 'f.elamrani@atlas-industries.ma',
    department: 'Ressources Humaines',
    overall_rating: 4.5,
    evaluation_period: '2025',
    strengths: ['Vision stratégique RH', 'Expertise juridique', 'Empathie managériale'],
    areas_for_improvement: ['Outils SIRH avancés', 'Data analytics RH'],
    training_recommendations: ['Certification People Analytics', 'Formation SIRH avancé', 'Workshop Design Thinking RH'],
    competency_scores: { 'GPEC': 5, 'Droit social': 5, 'Formation': 4, 'Recrutement': 4, 'SIRH': 3 },
    career_goals: 'VP People & Culture dans un groupe industriel',
  },
  {
    employee_name: 'Sara Idrissi',
    employee_email: 's.idrissi@atlas-industries.ma',
    department: 'IT & Digital',
    overall_rating: 4.0,
    evaluation_period: '2025',
    strengths: ['Innovation technique', 'Architecture SI', 'Veille technologique'],
    areas_for_improvement: ['Budget management', 'Stakeholder communication'],
    training_recommendations: ['TOGAF certification', 'Formation Cloud AWS', 'Programme leadership IT'],
    competency_scores: { 'Architecture': 4, 'Cloud': 3, 'Sécurité': 4, 'Management IT': 3, 'DevOps': 4 },
    career_goals: 'CTO d\'un groupe industriel digital-first',
  },
  {
    employee_name: 'Amina Chraibi',
    employee_email: 'a.chraibi@atlas-industries.ma',
    department: 'Commercial',
    overall_rating: 3.8,
    evaluation_period: '2025',
    strengths: ['Négociation B2B', 'Connaissance marché Afrique', 'Développement commercial'],
    areas_for_improvement: ['CRM avancé', 'Marketing digital', 'Analyse data commerciale'],
    training_recommendations: ['Formation Salesforce avancé', 'Certification Google Analytics', 'Programme négociation internationale'],
    competency_scores: { 'Vente B2B': 5, 'Négociation': 4, 'Marketing': 3, 'CRM': 2, 'Analytics': 2 },
    career_goals: 'Directrice Développement International',
  },
  {
    employee_name: 'Mehdi Sqalli',
    employee_email: 'm.sqalli@atlas-industries.ma',
    department: 'IT & Digital',
    overall_rating: 3.5,
    evaluation_period: '2025',
    strengths: ['Rapidité de développement', 'Adaptabilité', 'Esprit d\'équipe'],
    areas_for_improvement: ['Architecture logicielle', 'Tests automatisés', 'Documentation'],
    training_recommendations: ['Formation Clean Architecture', 'Certification AWS Developer', 'Workshop TDD/BDD'],
    competency_scores: { 'React': 4, 'Node.js': 3, 'SQL': 3, 'DevOps': 2, 'Tests': 2 },
    career_goals: 'Lead Developer puis Architecte solution',
  },
  {
    employee_name: 'Rachid Alaoui',
    employee_email: 'r.alaoui@atlas-industries.ma',
    department: 'Production',
    overall_rating: 3.2,
    evaluation_period: '2025',
    strengths: ['Terrain', 'Connaissance machines', 'Fiabilité'],
    areas_for_improvement: ['Leadership', 'Reporting', 'Outils numériques'],
    training_recommendations: ['Formation management de proximité', 'Initiation Excel avancé', 'Certification sécurité machines'],
    competency_scores: { 'Technique production': 4, 'Management': 2, 'Qualité': 3, 'Digital': 1, 'Sécurité': 3 },
    career_goals: 'Chef d\'atelier avec gestion de budget',
  },
  {
    employee_name: 'Hassan Ouazzani',
    employee_email: 'h.ouazzani@atlas-industries.ma',
    department: 'Logistique',
    overall_rating: 3.9,
    evaluation_period: '2025',
    strengths: ['Organisation', 'Gestion des flux', 'Relations fournisseurs'],
    areas_for_improvement: ['Automatisation', 'Lean logistics', 'Anglais professionnel'],
    training_recommendations: ['Certification APICS CSCP', 'Formation WMS avancé', 'Cours anglais professionnel B2'],
    competency_scores: { 'Supply Chain': 4, 'Stocks': 4, 'Transport': 3, 'ERP': 3, 'Lean': 2 },
    career_goals: 'Directeur Supply Chain',
  },
];

export function useSeedDemoData() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [progress, setProgress] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const seedDemoData = async () => {
    if (!user) {
      toast({ title: 'Connexion requise', variant: 'destructive' });
      return;
    }

    setIsSeeding(true);
    try {
      // 1. Create company
      setProgress('Création de l\'entreprise...');
      const { data: company, error: companyErr } = await supabase
        .from('companies')
        .insert(DEMO_COMPANY)
        .select('id')
        .single();
      if (companyErr) throw companyErr;
      const companyId = company.id;

      // 2. Link user to company + set admin role
      setProgress('Configuration du profil...');
      await supabase.from('profiles').update({ company_id: companyId }).eq('id', user.id);

      // Ensure admin role
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      if (!existingRole) {
        await supabase.from('user_roles').upsert(
          { user_id: user.id, role: 'admin' as any },
          { onConflict: 'user_id,role' }
        );
      }

      // 3. Create departments
      setProgress('Création des départements...');
      const { data: depts } = await supabase
        .from('departments')
        .insert(DEMO_DEPARTMENTS.map(d => ({ ...d, company_id: companyId })))
        .select('id, name');

      // 4. Create employees
      setProgress('Ajout des employés...');
      await supabase
        .from('company_employees')
        .insert(DEMO_EMPLOYEES.map(e => ({ ...e, company_id: companyId, created_by: user.id })));

      // 5. Create job descriptions
      setProgress('Création des fiches de poste...');
      const { data: jds } = await supabase
        .from('job_descriptions')
        .insert(DEMO_JOB_DESCRIPTIONS.map(jd => ({ ...jd, company_id: companyId, created_by: user.id })))
        .select('id, title');

      // 6. Create positions
      setProgress('Création de l\'organigramme...');
      const deptMap = Object.fromEntries((depts || []).map(d => [d.name, d.id]));
      const jdMap = Object.fromEntries((jds || []).map(j => [j.title, j.id]));

      const positions = [
        { title: 'Directeur Général', department_id: deptMap['Direction Générale'], level: 'executive', status: 'filled', current_holder_name: 'Karim Benali', current_holder_email: 'k.benali@atlas-industries.ma', is_critical: true, match_score: 92 },
        { title: 'DRH', department_id: deptMap['Ressources Humaines'], level: 'senior', status: 'filled', current_holder_name: 'Fatima Zahra El Amrani', current_holder_email: 'f.elamrani@atlas-industries.ma', job_description_id: jdMap['DRH'], is_critical: true, match_score: 88, upskill_potential: true },
        { title: 'Directeur de Production', department_id: deptMap['Production'], level: 'senior', status: 'filled', current_holder_name: 'Youssef Tazi', current_holder_email: 'y.tazi@atlas-industries.ma', job_description_id: jdMap['Directeur de Production'], is_critical: true, match_score: 85, upskill_potential: true },
        { title: 'Directrice Commerciale', department_id: deptMap['Commercial'], level: 'senior', status: 'filled', current_holder_name: 'Amina Chraibi', current_holder_email: 'a.chraibi@atlas-industries.ma', is_critical: true, match_score: 76, upskill_potential: true },
        { title: 'DAF', department_id: deptMap['Finance & Comptabilité'], level: 'senior', status: 'filled', current_holder_name: 'Omar Fassi', current_holder_email: 'o.fassi@atlas-industries.ma', is_critical: true, match_score: 90 },
        { title: 'DSI', department_id: deptMap['IT & Digital'], level: 'senior', status: 'filled', current_holder_name: 'Sara Idrissi', current_holder_email: 's.idrissi@atlas-industries.ma', is_critical: true, match_score: 80, upskill_potential: true },
        { title: 'Responsable Logistique', department_id: deptMap['Logistique'], level: 'mid', status: 'filled', current_holder_name: 'Hassan Ouazzani', current_holder_email: 'h.ouazzani@atlas-industries.ma', job_description_id: jdMap['Responsable Logistique'], match_score: 78, upskill_potential: true },
        { title: 'Développeur Full Stack', department_id: deptMap['IT & Digital'], level: 'mid', status: 'filled', current_holder_name: 'Mehdi Sqalli', current_holder_email: 'm.sqalli@atlas-industries.ma', job_description_id: jdMap['Développeur Full Stack'], match_score: 70, upskill_potential: true, reskill_candidate: false },
        { title: 'Chef d\'Équipe Production', department_id: deptMap['Production'], level: 'mid', status: 'filled', current_holder_name: 'Rachid Alaoui', current_holder_email: 'r.alaoui@atlas-industries.ma', match_score: 65, reskill_candidate: true },
        { title: 'Data Analyst', department_id: deptMap['IT & Digital'], level: 'mid', status: 'open', is_critical: false },
        { title: 'Responsable Export', department_id: deptMap['Commercial'], level: 'mid', status: 'open', is_critical: true },
      ];

      await supabase.from('positions').insert(positions.map(p => ({ ...p, company_id: companyId })));

      // 7. Create performance evaluations
      setProgress('Création des évaluations...');
      for (const ev of DEMO_EVALUATIONS) {
        const jdId = jdMap[
          ev.department === 'Production' ? 'Directeur de Production' :
          ev.department === 'Ressources Humaines' ? 'DRH' :
          ev.department === 'IT & Digital' ? 'Développeur Full Stack' :
          ev.department === 'Logistique' ? 'Responsable Logistique' : ''
        ] || null;

        await supabase.from('performance_evaluations').insert({
          ...ev,
          company_id: companyId,
          created_by: user.id,
          job_description_id: jdId,
        });
      }

      // 8. Refresh all queries
      setProgress('Finalisation...');
      await queryClient.invalidateQueries();

      toast({
        title: '🎉 Données démo chargées !',
        description: 'Atlas Industries Maroc : 15 employés, 7 départements, 4 fiches de poste, 7 évaluations.',
      });
    } catch (error: any) {
      console.error('Seed error:', error);
      toast({
        title: 'Erreur lors du chargement',
        description: error.message || 'Une erreur est survenue.',
        variant: 'destructive',
      });
    } finally {
      setIsSeeding(false);
      setProgress('');
    }
  };

  return { seedDemoData, isSeeding, progress };
}
