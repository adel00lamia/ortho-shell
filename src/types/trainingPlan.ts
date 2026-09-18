export interface PreviousPlanFile {
  name: string;
  year: string;
  content: string;
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
  priority?: string;
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

export interface GeneratedPlan {
  title: string;
  description: string;
  modules: TrainingModule[];
  timeline: string;
  budget_breakdown: Record<string, number | string>;
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
  recommendations: string[];
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