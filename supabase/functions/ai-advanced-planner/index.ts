import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://esm.sh/zod@3.23.8';

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const requirementsSchema = z.object({
  requirements: z.object({
    company: z.string().max(200).optional().default(''),
    country: z.string().max(100).optional().default(''),
    industry: z.string().max(100).optional().default('General'),
    companySize: z.string().max(50).optional().default('Medium'),
    budget: z.number().min(0).max(100_000_000).optional().default(50000),
    duration: z.number().int().min(1).max(60).optional().default(12),
    objectives: z.array(z.string().max(500)).max(20).optional().default([]),
    targetSkills: z.array(z.string().max(200)).max(50).optional().default([]),
    constraints: z.array(z.string().max(500)).max(20).optional().default([]),
    context: z.string().max(5000).optional().default(''),
    previousPlans: z.array(z.object({
      name: z.string().max(500),
      year: z.string().max(10),
      content: z.string().max(10000),
    })).max(3).optional().default([]),
    // Real company data read from the database — used as the only factual source.
    companyData: z.object({
      companyName: z.string().max(200).optional(),
      industry: z.string().max(200).optional(),
      city: z.string().max(200).optional(),
      companySize: z.string().max(100).optional(),
      headcount: z.number().min(0).max(5_000_000).optional(),
      headcountSource: z.enum(['employee_records', 'declared_profile', 'none']).optional(),
      departments: z.array(z.object({ name: z.string().max(200), headcount: z.number() })).max(60).optional().default([]),
      positions: z.array(z.object({ title: z.string().max(200), headcount: z.number(), isCritical: z.boolean().optional() })).max(60).optional().default([]),
      skills: z.array(z.object({
        name: z.string().max(200),
        currentLevel: z.number().optional(),
        targetLevel: z.number().optional(),
        gap: z.number().optional(),
        assessedEmployees: z.number().optional(),
        maxLevel: z.number().optional(),
      })).max(60).optional().default([]),
      payroll: z.object({ grossAnnual: z.number(), exerciseYear: z.number() }).optional(),
      trainingBudget: z.object({ amount: z.number(), currency: z.string().max(10), source: z.string().max(100) }).optional(),
      csf: z.object({
        tfpRate: z.number().optional(),
        plannedRate: z.number().optional(),
        unplannedRate: z.number().optional(),
        hourlyCapPerPerson: z.number().nullable().optional(),
        tfpAmount: z.number().optional(),
        estimatedReimbursement: z.number().optional(),
        verified: z.boolean().optional(),
        source: z.string().max(200).optional(),
      }).optional(),
    }).optional(),
    template: z.string().max(200).optional().default(''),
    pack: z.string().max(200).optional().default(''),
    aiModel: z.string().max(100).optional().default('google/gemini-3-flash-preview'),
    customizations: z.object({
      deliveryMethods: z.array(z.string().max(50)).max(10).optional().default([]),
      certification: z.boolean().optional().default(false),
      mentorship: z.boolean().optional().default(false),
      gamification: z.boolean().optional().default(false),
      socialLearning: z.boolean().optional().default(false),
      microlearning: z.boolean().optional().default(false),
    }).optional().default({}),
  }),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization');
  let userId = 'anonymous';

  if (authHeader?.startsWith('Bearer ')) {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      userId = user.id;
    }
  }

  try {
    const rawBody = await req.json();
    const parsed = requirementsSchema.safeParse(rawBody);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Invalid input', details: parsed.error.flatten() }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const { requirements } = parsed.data;
    const language = rawBody.language === 'fr' ? 'fr' : 'en';

    console.log('Advanced plan generation for user:', userId);

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const languageInstruction = language === 'fr'
      ? '\n\nCRITICAL: You MUST write ALL content in French. Every title, description, recommendation, analysis, and text field must be in French. Only the JSON keys should remain in English.'
      : '';

    const generatedAt = new Date();
    const planEnd = new Date(generatedAt);
    planEnd.setMonth(planEnd.getMonth() + requirements.duration);
    const canonicalCompany = requirements.company.trim() || (language === 'fr' ? 'Entreprise à confirmer' : 'Company to confirm');

    // Real company data block — the ONLY factual source for headcount, positions,
    // current skill levels, training budget and CSF rates.
    const cd = requirements.companyData;
    const pct = (rate?: number) => (typeof rate === 'number' ? `${Math.round(rate * 1000) / 10}%` : 'À confirmer');
    const companyFacts = cd ? [
      'VERIFIED COMPANY DATA (from the client database — the ONLY allowed factual source):',
      cd.headcount ? `- Headcount: ${cd.headcount} employees (source: ${cd.headcountSource === 'employee_records' ? 'employee records' : 'declared company profile'})` : '- Headcount: not available, write "À confirmer"',
      cd.departments?.length ? `- Departments and real headcount: ${cd.departments.map(d => `${d.name} (${d.headcount})`).join(', ')}` : '- Departments: not available',
      cd.positions?.length ? `- Positions and real headcount: ${cd.positions.map(p => `${p.title} (${p.headcount})${p.isCritical ? ' [critical]' : ''}`).join(', ')}` : '- Positions: not available',
      cd.skills?.length
        ? `- Assessed skill levels (average current -> target, scale max ${cd.skills[0]?.maxLevel ?? 5}): ${cd.skills.map(s => `${s.name} ${s.currentLevel ?? '?'}->${s.targetLevel ?? '?'} (gap ${s.gap ?? '?'}; ${s.assessedEmployees ?? 0} assessed)`).join(', ')}`
        : '- Assessed skill levels: not available, never invent a current level',
      cd.trainingBudget ? `- Training budget on record: ${cd.trainingBudget.amount} ${cd.trainingBudget.currency} (source: ${cd.trainingBudget.source})` : '- Training budget on record: not available',
      cd.payroll ? `- Gross annual payroll ${cd.payroll.exerciseYear}: ${cd.payroll.grossAnnual} MAD` : '- Gross annual payroll: not available',
      cd.csf ? `- CSF/OFPPT reference rates (UNVERIFIED reference, must be shown as "à vérifier"): planned action ${pct(cd.csf.plannedRate)}, non-planned ${pct(cd.csf.unplannedRate)}, TFP levy ${pct(cd.csf.tfpRate)}, hourly cap per person ${cd.csf.hourlyCapPerPerson ?? 'none'}${cd.csf.tfpAmount ? `, levy on record ${cd.csf.tfpAmount} MAD` : ''}` : '',
      'RULE: use these figures verbatim for headcount, departments, positions, current/target skill levels, budget and rates. Never replace them with estimates, industry averages or illustrative numbers. Where a figure above is "not available", write "À confirmer".',
    ].filter(Boolean).join('\n') : '';

    const systemPrompt = `You are a senior human-capital and learning strategist writing for an executive committee. Produce a concise, evidence-disciplined training plan comparable in structure and clarity to a leading consulting firm's deliverable.${languageInstruction}

DATA INTEGRITY RULES:
- The current company is exactly "${canonicalCompany}". Never use another company name anywhere.
- The report issue date is ${generatedAt.toISOString().slice(0, 10)}. The plan runs from ${generatedAt.toISOString().slice(0, 10)} to ${planEnd.toISOString().slice(0, 10)}.
- Previous plans are historical evidence only. Never copy their company identity, dates, targets, claims, baselines, budgets, or market facts into the current plan.
- Do not invent baselines, ROI, market size, growth rates, reimbursement rates, performance improvements, legal obligations, or current-state facts. Write "À confirmer" / "À mesurer" when absent.
- If budget is zero, every cost must be omitted or marked "À chiffrer"; never fabricate a cost. If budget is provided, allocations must total that exact budget.
- CSF, GIAC and OFPPT are reference frameworks to verify. Never promise eligibility or reimbursement.
- Distinguish supplied facts, arithmetic calculations, and assumptions requiring validation.
- Build a traceable engineering chain: observed difficulty -> target competency -> operational objective -> training action -> support measure -> workplace evidence.
- Group actions into company-specific training axes. Do not default to generic axes when the supplied context indicates better ones.
- For every module, provide concrete learning objectives, a content outline, assessment methods, support measures and workplace-transfer activities.
- Never invent provider names, exact delivery dates, group counts or participant counts. Use "À sélectionner", "À planifier" or omit numeric fields when absent.

IMPORTANT: You must respond with valid JSON in exactly this format:
{
  "plan": {
    "title": "Comprehensive Training Plan Title",
    "report_meta": {
      "company": "Exact current company",
      "country": "Current country",
      "industry": "Current industry",
      "generated_at": "ISO date",
      "plan_start_date": "ISO date",
      "plan_end_date": "ISO date",
      "data_status": "provided_and_ai_synthesized"
    },
    "executive_summary": "A 2-3 paragraph executive summary covering the strategic rationale, key objectives, expected outcomes, and ROI justification for this training investment.",
    "description": "Detailed plan description with innovative approach",
    "timeline": "Detailed timeline breakdown with phases and milestones",
    "market_research": {
      "market_overview": "Comprehensive overview of the training market in this industry and country",
      "market_size": "À confirmer unless explicitly supplied with a dated source",
      "growth_rate": "À confirmer unless explicitly supplied with a dated source",
      "key_trends": ["Trend 1 with detailed explanation", "Trend 2"],
      "competitive_landscape": "Analysis of training providers, competitors, and market positioning",
      "target_audience_analysis": "Detailed profile of the target learners, their needs, learning styles, and motivations",
      "demand_drivers": ["Driver 1", "Driver 2"],
      "market_challenges": ["Challenge 1", "Challenge 2"]
    },
    "swot_analysis": {
      "strengths": ["Internal strength 1 related to the company's training capabilities", "Strength 2"],
      "weaknesses": ["Internal weakness 1 that could hinder training effectiveness", "Weakness 2"],
      "opportunities": ["External opportunity 1 for training and development", "Opportunity 2"],
      "threats": ["External threat 1 to training success", "Threat 2"],
      "strategic_implications": "Summary of how the SWOT analysis informs the training strategy"
    },
    "pestel_analysis": {
      "political": ["Political factor affecting training in this country/industry"],
      "economic": ["Economic factor such as labor costs, funding availability"],
      "social": ["Social/cultural factor affecting learning and development"],
      "technological": ["Technology trend impacting training delivery"],
      "environmental": ["Environmental/sustainability consideration for training"],
      "legal": ["Legal/regulatory requirement for training compliance"],
      "key_implications": "Summary of how PESTEL factors shape the training plan"
    },
    "training_axes": [
      {
        "name": "Coherent training axis grounded in the supplied context",
        "rationale": "Why this axis matters operationally",
        "observed_difficulties": ["Difficulty supported by supplied information, otherwise À confirmer"],
        "target_competencies": ["Competency to develop"],
        "operational_objectives": ["Observable operational objective without invented improvement percentage"],
        "support_measures": ["Managerial, process, tool or workplace measure required alongside training"]
      }
    ],
    "modules": [
      {
        "title": "Module Title",
        "description": "Module description with learning outcomes",
        "duration": "X hours/days/weeks",
        "type": "internal/external/mixed/virtual/hybrid",
        "skills_covered": ["skill1", "skill2", "skill3"],
        "prerequisites": ["prereq1", "prereq2"],
        "delivery_method": "online/onsite/hybrid/mentorship/workshop/microlearning",
        "resources_needed": ["resource1", "resource2"],
        "estimated_cost": 5000,
        "engagement_features": ["gamification", "social_learning", "ai_assistance"],
        "assessment_methods": ["practical", "theoretical", "peer_review"],
        "certification_level": "basic/intermediate/advanced/expert",
        "training_axis": "Name of the related training axis",
        "observed_difficulty": "The supplied difficulty or À confirmer",
        "learning_objectives": ["Observable learning objective 1", "Observable learning objective 2"],
        "content_outline": ["Sequence or topic 1", "Sequence or topic 2"],
        "support_measures": ["Non-training measure needed for success"],
        "workplace_transfer": ["Post-training workplace application activity"],
        "accountable_owner": "Accountable role or À confirmer",
        "provider": "À sélectionner unless explicitly supplied",
        "planned_period": "Broad plan window or À planifier; never invent exact dates",
        "group_count": null,
        "participant_count": null
      }
    ],
    "budget_breakdown": {
      "internal_training": 20000,
      "external_courses": 15000,
      "materials_resources": 5000,
      "technology_platform": 3000,
      "assessment_certification": 2000,
      "mentorship_coaching": 4000,
      "gamification_tools": 2000,
      "contingency": 4000
    },
    "kpis": [
      {
        "name": "KPI Name",
        "description": "How to measure this KPI with specific metrics",
        "target": "Target supplied by the user, otherwise À valider",
        "measurement_frequency": "Monthly/Quarterly/Bi-annual",
        "baseline": "Supplied baseline, otherwise À mesurer",
        "improvement_expected": "Supplied improvement, otherwise À valider",
        "source": "Source system or À confirmer",
        "owner": "Accountable role or À confirmer"
      }
    ],
    "recommendations": ["Strategic recommendation with innovation focus"],
    "evidence_register": [
      {
        "evidence": "Evidence required to validate need, delivery, learning or workplace transfer",
        "source": "Supplied source or À confirmer",
        "owner": "Accountable role or À confirmer",
        "timing": "Before/During/After training",
        "status": "À collecter unless explicitly supplied"
      }
    ],
    "risk_assessment": {
      "high_risks": ["Risk 1"],
      "medium_risks": ["Medium risk 1"],
      "mitigation_strategies": ["Strategy 1"],
      "contingency_plans": ["Backup plan 1"]
    },
    "success_metrics": ["Metric 1"],
    "implementation_roadmap": {
      "phases": [
        {
          "name": "Phase 1: Foundation",
          "duration": "Month 1-2",
          "activities": ["Activity 1", "Activity 2"],
          "deliverables": ["Deliverable 1", "Deliverable 2"],
          "owner": "Accountable role"
        }
      ]
    },
    "innovation_features": {
      "ai_integration": "How AI will enhance the learning experience",
      "personalization": "Adaptive learning paths",
      "social_learning": "Peer collaboration",
      "microlearning": "Bite-sized content",
      "gamification": "Points, badges, leaderboards",
      "virtual_reality": "Immersive learning if applicable",
      "mobile_learning": "On-the-go accessibility"
    },
    "sustainability_plan": {
      "long_term_vision": "3-5 year roadmap",
      "continuous_improvement": "Feedback loops",
      "knowledge_retention": "Retention strategies",
      "culture_transformation": "Building a learning organization"
    },
    "regulatory_framework": {
      "country": "Country name",
      "governing_bodies": ["List of relevant training/labor regulatory bodies"],
      "key_regulations": ["Specific training regulations and labor laws applicable"],
      "funding_programs": ["Available government funding, tax incentives, or reimbursement programs"],
      "mandatory_training": ["Any legally required training topics"],
      "certification_standards": ["Recognized certifications and standards"],
      "compliance_checklist": ["Steps to ensure compliance"]
    }
  }
}`;

    const userPrompt = `Create an innovative and comprehensive training plan for:

Company: ${canonicalCompany}
Country/Market: ${requirements.country || 'Not specified'}
Industry: ${requirements.industry}
Company Size: ${requirements.companySize}
Budget ceiling: ${requirements.budget > 0 ? `${requirements.budget} ${requirements.country === 'Morocco' || !requirements.country ? 'MAD' : requirements.country === 'United States' ? 'USD' : requirements.country === 'United Kingdom' ? 'GBP' : ['France','Germany','Spain','Italy','Netherlands','Belgium','Portugal','Austria','Ireland'].includes(requirements.country) ? 'EUR' : 'local currency'}` : 'Not supplied — all costs must be À chiffrer'}
Duration: ${requirements.duration} months
Report issue date: ${generatedAt.toISOString().slice(0, 10)}
Plan period: ${generatedAt.toISOString().slice(0, 10)} to ${planEnd.toISOString().slice(0, 10)}

IMPORTANT: Tailor this plan to the ${requirements.country || 'global'} market context. Consider local labor regulations, training standards, available certifications, local training providers, language considerations, and regional industry benchmarks for ${requirements.country || 'the target market'}.

REGULATORY FRAMEWORK REQUIREMENTS:
You MUST include a detailed "regulatory_framework" section specific to ${requirements.country || 'the target market'}. For example:
- Morocco: OFPPT (Office de la Formation Professionnelle), GIAC (Groupements Interprofessionnels d'Aide au Conseil), CSF contributions, TFP tax
- France: OPCO (Opérateurs de Compétences), CPF (Compte Personnel de Formation), Qualiopi certification, Plan de développement des compétences
- United States: EEOC compliance, OSHA training requirements, Section 127 tax exclusion, state-specific regulations
- Germany: Betriebsverfassungsgesetz (Works Constitution Act), IHK certifications, Bildungsurlaub
- UAE: MOHRE regulations, Emiratisation training requirements, KHDA standards
- United Kingdom: Apprenticeship Levy, CIPD standards, Health & Safety at Work Act training
Include ALL relevant governing bodies, funding programs, mandatory training, and compliance steps for the selected country.

Training Objectives:
${requirements.objectives.map((obj: string) => `- ${obj}`).join('\n') || '- Improve employee skills'}

Target Skills:
${requirements.targetSkills.map((skill: string) => `- ${skill}`).join('\n') || '- General skills development'}

Constraints:
${requirements.constraints.map((c: string) => `- ${c}`).join('\n') || '- None specified'}

Selected Delivery Methods:
${requirements.customizations?.deliveryMethods?.map((m: string) => `- ${m}`).join('\n') || '- online'}

Engagement Features Requested:
${requirements.customizations?.certification ? '- Certification Program' : ''}
${requirements.customizations?.mentorship ? '- Mentorship Program' : ''}
${requirements.customizations?.gamification ? '- Gamification' : ''}
${requirements.customizations?.socialLearning ? '- Social Learning' : ''}
${requirements.customizations?.microlearning ? '- Microlearning' : ''}

Template/Pack Context:
${requirements.template ? `Using template: ${requirements.template}` : ''}
${requirements.pack ? `Using training pack: ${requirements.pack}` : ''}

${companyFacts}

Additional Context:
${requirements.context || 'No additional context provided'}

${requirements.previousPlans && requirements.previousPlans.length > 0 ? `
PREVIOUS TRAINING PLANS (CRITICAL — AVOID REDUNDANCY):
The company has provided their previous training plans below. You MUST:
1. Analyze what was already covered in previous years
2. AVOID repeating the same training topics, modules, or skills already addressed
3. Build upon previous training — advance to higher levels or complementary skills
4. Explicitly mention in your recommendations what was already covered and what is new
5. In the executive summary, reference continuity without importing any old identity, date, target or unverified claim

${requirements.previousPlans.map((p: any) => `--- PLAN FROM ${p.year} (${p.name}) ---\n${p.content}\n--- END ---`).join('\n\n')}
` : ''}`;

    console.log('Calling Lovable AI Gateway...');

    // Validate and use the selected AI model
    const allowedModels = [
      'google/gemini-3-flash-preview',
      'google/gemini-3.8-flash',
      'google/gemini-3.1-pro-preview',
    ];
    const selectedModel = allowedModels.includes(requirements.aiModel || '')
      ? requirements.aiModel
      : 'google/gemini-3-flash-preview';


    console.log('Using AI model:', selectedModel);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again in a few moments.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required. Please add credits to continue.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('No content in AI response');

    let planData;
    try {
      let jsonContent = content;
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) jsonContent = jsonMatch[1].trim();
      planData = JSON.parse(jsonContent);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      planData = {
        plan: {
          title: language === 'fr' ? `Plan de développement des compétences — ${canonicalCompany}` : `Skills Development Plan — ${canonicalCompany}`,
          description: language === 'fr'
            ? 'Trame de secours à compléter et à valider avec les parties prenantes.'
            : 'Fallback framework to complete and validate with stakeholders.',
          timeline: language === 'fr' ? 'À planifier' : 'To be scheduled',
          training_axes: [{
            name: language === 'fr' ? 'Axe à confirmer' : 'Axis to confirm',
            rationale: language === 'fr' ? 'À valider à partir du diagnostic des besoins.' : 'To validate from the needs assessment.',
            observed_difficulties: [language === 'fr' ? 'À confirmer' : 'To confirm'],
            target_competencies: requirements.targetSkills.length ? requirements.targetSkills : [language === 'fr' ? 'À confirmer' : 'To confirm'],
            operational_objectives: [language === 'fr' ? 'À valider' : 'To validate'],
            support_measures: [language === 'fr' ? 'À définir' : 'To define'],
          }],
          modules: [{
            title: language === 'fr' ? 'Action de formation à cadrer' : 'Training action to scope',
            description: language === 'fr' ? 'Contenu à construire après validation du besoin.' : 'Content to build after validating the need.',
            duration: language === 'fr' ? 'À planifier' : 'To be scheduled',
            type: "mixed",
            skills_covered: requirements.targetSkills.slice(0, 3),
            prerequisites: [],
            delivery_method: "hybrid",
            resources_needed: [],
            assessment_methods: [language === 'fr' ? 'À définir' : 'To define'],
            training_axis: language === 'fr' ? 'Axe à confirmer' : 'Axis to confirm',
            observed_difficulty: language === 'fr' ? 'À confirmer' : 'To confirm',
            learning_objectives: [language === 'fr' ? 'À préciser' : 'To specify'],
            content_outline: [language === 'fr' ? 'À concevoir' : 'To design'],
            support_measures: [language === 'fr' ? 'À définir' : 'To define'],
            workplace_transfer: [language === 'fr' ? 'À définir' : 'To define'],
            accountable_owner: language === 'fr' ? 'À confirmer' : 'To confirm',
            provider: language === 'fr' ? 'À sélectionner' : 'To select',
            planned_period: language === 'fr' ? 'À planifier' : 'To be scheduled'
          }],
          budget_breakdown: {},
          kpis: [{
            name: language === 'fr' ? 'Transfert en situation de travail' : 'Workplace transfer',
            description: language === 'fr' ? 'Indicateur à définir avec le responsable opérationnel.' : 'Indicator to define with the operational owner.',
            target: language === 'fr' ? 'À valider' : 'To validate',
            baseline: language === 'fr' ? 'À mesurer' : 'To measure',
            improvement_expected: language === 'fr' ? 'À valider' : 'To validate',
            source: language === 'fr' ? 'À confirmer' : 'To confirm',
            owner: language === 'fr' ? 'À confirmer' : 'To confirm',
          }],
          evidence_register: [{
            evidence: language === 'fr' ? 'Validation documentée du besoin' : 'Documented needs validation',
            source: language === 'fr' ? 'À confirmer' : 'To confirm',
            owner: language === 'fr' ? 'À confirmer' : 'To confirm',
            timing: language === 'fr' ? 'Avant la formation' : 'Before training',
            status: language === 'fr' ? 'À collecter' : 'To collect',
          }],
          recommendations: [language === 'fr' ? 'Valider le diagnostic, les populations et les responsables avant programmation.' : 'Validate the diagnosis, audiences and owners before scheduling.'],
          risk_assessment: { high_risks: [], medium_risks: [], mitigation_strategies: [], contingency_plans: [] },
          success_metrics: []
        }
      };
    }

    const rawPlan = planData?.plan && typeof planData.plan === 'object' ? planData.plan : {};
    const normalizedPlan = {
      ...rawPlan,
      title: language === 'fr'
        ? `Plan de développement des compétences — ${canonicalCompany}`
        : `Skills Development Plan — ${canonicalCompany}`,
      budget_breakdown: requirements.budget > 0 ? (rawPlan.budget_breakdown || {}) : {},
      modules: Array.isArray(rawPlan.modules)
        ? rawPlan.modules.map((module: Record<string, unknown>) => ({
            ...module,
            estimated_cost: requirements.budget > 0 && typeof module.estimated_cost === 'number' ? module.estimated_cost : undefined,
          }))
        : [],
      report_meta: {
        company: canonicalCompany,
        country: requirements.country || (language === 'fr' ? 'À confirmer' : 'To confirm'),
        industry: requirements.industry || (language === 'fr' ? 'À confirmer' : 'To confirm'),
        generated_at: generatedAt.toISOString(),
        plan_start_date: generatedAt.toISOString(),
        plan_end_date: planEnd.toISOString(),
        data_status: 'provided_and_ai_synthesized',
      },
    };

    return new Response(JSON.stringify({ plan: normalizedPlan }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-advanced-planner function:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate advanced training plan' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
