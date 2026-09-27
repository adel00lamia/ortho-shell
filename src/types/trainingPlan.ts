export interface PreviousPlanFile {
  name: string;
  year: string;
  content: string;
}

/** Real company data read from the database — never AI-generated. */
export interface CompanyFactbase {
  companyName?: string;
  industry?: string;
  city?: string;
  companySize?: string;
  headcount?: number;
  headcountSource: 'employee_records' | 'declared_profile' | 'none';
  departments: Array<{ name: string; headcount: number }>;
  positions: Array<{ title: string; headcount: number; isCritical?: boolean }>;
  skills: Array<{
    name: string;
    currentLevel?: number;
    targetLevel?: number;
    gap?: number;
    assessedEmployees: number;
    maxLevel?: number;
  }>;
  payroll?: { grossAnnual: number; exerciseYear: number };
  trainingBudget?: { amount: number; currency: string; source: string };
  csf?: {
    tfpRate?: number;
    plannedRate?: number;
    unplannedRate?: number;
    hourlyCapPerPerson?: number | null;
    tfpAmount?: number;
    estimatedReimbursement?: number;
    verified: boolean;
    source: string;
  };
}

export interface PlanRequirements {
  company: string;
  country: string;
  industry: string;
  companySize: string;
  budget: number;
  duration: number;
  objectives: string[];
  targetSkills: string[];
  constraints: string[];
  aiModel: string;
  context: string;
  template?: string;
  pack?: string;
  previousPlans?: PreviousPlanFile[];
  /** Real company data read from the database, attached at generation time. */
  companyData?: CompanyFactbase;
  customizations: {
    deliveryMethods: string[];
    certification: boolean;
    mentorship: boolean;
    gamification: boolean;
    microlearning: boolean;
    socialLearning: boolean;
    videoProduction: boolean;
    interactiveContent: boolean;
    virtualReality: boolean;
    mobileApp: boolean;
  };
}

export interface ReportMeta {
  company: string;
  country: string;
  industry: string;
  generated_at: string;
  plan_start_date: string;
  plan_end_date: string;
  data_status: 'provided_and_ai_synthesized';
}

export interface TrainingModule {
  title: string;
  name?: string;
  description?: string;
  duration: string;
  type?: string;
  delivery_method?: string;
  skills_covered?: string[];
  prerequisites?: string[];
  resources_needed?: string[];
  estimated_cost?: number;
  engagement_features?: string[];
  assessment_methods?: string[];
  certification_level?: string;
  target_audience?: string;
  priority?: 'critique' | 'haute' | 'moyenne' | 'à arbitrer' | string;
  priority_rationale?: string;
  ofppt_domain_code?: number | null;
  ofppt_domain?: string;
  ofppt_theme?: string;
  ofppt_verified?: boolean;
  rationale?: string;
  training_axis?: string;
  observed_difficulty?: string;
  learning_objectives?: string[];
  content_outline?: string[];
  support_measures?: string[];
  workplace_transfer?: string[];
  accountable_owner?: string;
  provider?: string;
  planned_period?: string;
  group_count?: number;
  participant_count?: number;
}

export interface TrainingAxis {
  name: string;
  rationale?: string;
  observed_difficulties?: string[];
  target_competencies?: string[];
  operational_objectives?: string[];
  support_measures?: string[];
}

export interface ExecutiveRecommendation {
  recommendation: string;
  horizon: 'immédiat' | 'court terme' | 'moyen terme' | string;
  rationale: string;
  owner?: string;
}

export interface IndustryTrendSignal {
  trend: string;
  why_it_matters: string;
  skills_impacted: string[];
  urgency: 'immédiate' | 'court terme' | 'à surveiller' | string;
  training_response: string;
  evidence_status?: string;
}

export interface OrganizationalGap {
  skill: string;
  positions: string[];
  critical_positions: number;
  review_mentions: number;
  source: 'organigramme' | 'evaluations' | 'organigramme+evaluations';
  addressed_by?: string[];
}

export interface GeneratedPlan {
  title: string;
  description: string;
  modules: TrainingModule[];
  timeline: string;
  budget_breakdown: Record<string, number | string>;
  organizational_gaps?: OrganizationalGap[];
  kpis: Array<{
    name?: string;
    description?: string;
    target?: string;
    measurement_frequency?: string;
    baseline?: string;
    improvement_expected?: string;
    owner?: string;
    source?: string;
  }>;
  recommendations: Array<string | ExecutiveRecommendation>;
  training_axes?: TrainingAxis[];
  evidence_register?: Array<{
    evidence: string;
    source?: string;
    owner?: string;
    timing?: string;
    status?: string;
  }>;
  report_meta?: ReportMeta;
  risk_assessment?: {
    high_risks?: string[];
    medium_risks?: string[];
    mitigation_strategies?: string[];
    contingency_plans?: string[];
  };
  success_metrics?: string[];
  innovation_features?: Record<string, unknown>;
  sustainability_plan?: Record<string, unknown>;
  executive_summary?: string;
  market_research?: {
    market_overview?: string;
    market_size?: string;
    growth_rate?: string;
    key_trends?: string[];
    trend_signals?: IndustryTrendSignal[];
    competitive_landscape?: string;
    target_audience_analysis?: string;
    demand_drivers?: string[];
    market_challenges?: string[];
  };
  swot_analysis?: {
    strengths?: string[];
    weaknesses?: string[];
    opportunities?: string[];
    threats?: string[];
    strategic_implications?: string;
  };
  pestel_analysis?: {
    political?: string[];
    economic?: string[];
    social?: string[];
    technological?: string[];
    environmental?: string[];
    legal?: string[];
    key_implications?: string;
  };
  regulatory_framework?: {
    country?: string;
    governing_bodies?: string[];
    key_regulations?: string[];
    funding_programs?: string[];
    mandatory_training?: string[];
    certification_standards?: string[];
    compliance_checklist?: string[];
  };
  implementation_roadmap?: {
    phases?: Array<{
      name: string;
      duration: string;
      activities: string[];
      deliverables: string[];
      owner?: string;
    }>;
  };
}

export interface GeneratedPlanSnapshot {
  plan: GeneratedPlan;
  requirements: PlanRequirements;
  generatedAt: Date;
}