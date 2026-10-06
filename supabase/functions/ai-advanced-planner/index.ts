import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://esm.sh/zod@3.23.8';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { ofpptDomainsPrompt, validateOfpptLink } from './ofpptDomains.ts';

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');

const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json' };

const exactAllocation = (values: number[], budget: number): number[] => {
  if (!values.length || budget <= 0) return values.map(() => 0);
  const clean = values.map(value => Number.isFinite(value) && value > 0 ? value : 0);
  const sum = clean.reduce((total, value) => total + value, 0);
  const weights = sum > 0 ? clean.map(value => value / sum) : clean.map(() => 1 / clean.length);
  const allocated = weights.map(weight => Math.floor(weight * budget));
  let remainder = budget - allocated.reduce((total, value) => total + value, 0);
  const order = weights.map((weight, index) => ({ weight, index })).sort((a, b) => b.weight - a.weight);
  let cursor = 0;
  while (remainder > 0) {
    allocated[order[cursor % order.length].index] += 1;
    remainder -= 1;
    cursor += 1;
  }
  return allocated;
};

const normalizeBudget = (rawPlan: Record<string, unknown>, budget: number) => {
  if (budget <= 0) return { budgetBreakdown: {}, modules: Array.isArray(rawPlan.modules) ? rawPlan.modules : [] };
  const rawModules = Array.isArray(rawPlan.modules) ? rawPlan.modules as Array<Record<string, unknown>> : [];
  const priorities: Record<string, number> = { critique: 4, haute: 3, moyenne: 2, 'à arbitrer': 1 };
  const moduleWeights = rawModules.map(module => {
    const proposed = typeof module.estimated_cost === 'number' ? module.estimated_cost : 0;
    return proposed > 0 ? proposed : priorities[String(module.priority || '').toLowerCase()] || 1;
  });
  const moduleAmounts = exactAllocation(moduleWeights, budget);
  const modules = rawModules.map((module, index) => ({ ...module, estimated_cost: moduleAmounts[index] }));

  const rawBreakdown = rawPlan.budget_breakdown && typeof rawPlan.budget_breakdown === 'object'
    ? rawPlan.budget_breakdown as Record<string, unknown>
    : {};
  const keys = Object.keys(rawBreakdown).filter(key => typeof rawBreakdown[key] === 'number');
  const breakdownKeys = keys.length ? keys : ['actions_de_formation'];
  const breakdownValues = keys.length ? keys.map(key => Number(rawBreakdown[key])) : [1];
  const amounts = exactAllocation(breakdownValues, budget);
  const budgetBreakdown = Object.fromEntries(breakdownKeys.map((key, index) => [key, amounts[index]]));
  return { budgetBreakdown, modules };
};

const readResponsesStream = async (response: Response) => {
  if (!response.body) return '';
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let output = '';
  let terminalError = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      if (!line.startsWith('data:')) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === '[DONE]') continue;
      try {
        const event = JSON.parse(payload);
        if (event.type === 'response.output_text.delta' && typeof event.delta === 'string') output += event.delta;
        if (event.type === 'response.output_text.done' && !output && typeof event.text === 'string') output = event.text;
        if (event.type === 'response.completed' && !output && typeof event.response?.output_text === 'string') output = event.response.output_text;
        if (event.type === 'response.failed') {
          terminalError = event.response?.error?.message || event.error?.message || 'AI generation failed';
        }
        if (event.type === 'response.incomplete') {
          terminalError = event.response?.incomplete_details?.reason
            ? `AI response incomplete: ${event.response.incomplete_details.reason}`
            : 'AI response incomplete';
        }
      } catch { /* ignore non-JSON SSE metadata */ }
    }
  }
  if (!output && terminalError) throw new Error(terminalError);
  return output;
};

const requirementsSchema = z.object({
  requirements: z.object({
    company: z.string().max(200).optional().default(''),
    country: z.string().max(100).optional().default(''),
    industry: z.string().max(100).optional().default('General'),
    companySize: z.string().max(50).optional().default('Medium'),
    budget: z.number().min(0).max(100_000_000).optional().default(50000),
    duration: z.number().int().min(1).max(60).optional().default(12),
    objectives: z.array(z.string().max(1000)).max(60).optional().default([]),
    targetSkills: z.array(z.string().max(300)).max(120).optional().default([]),
    constraints: z.array(z.string().max(1000)).max(60).optional().default([]),
    context: z.string().max(20000).optional().default(''),
    previousPlans: z.array(z.object({
      name: z.string().max(500),
      year: z.string().max(10),
      content: z.string().max(20000),
    })).max(5).optional().default([]),
    // Real company data read from the database — used as the only factual source.
    companyData: z.object({
      companyName: z.string().max(200).optional(),
      industry: z.string().max(200).optional(),
      city: z.string().max(200).optional(),
      companySize: z.string().max(100).optional(),
      headcount: z.number().min(0).max(5_000_000).optional(),
      headcountSource: z.enum(['employee_records', 'declared_profile', 'none']).optional(),
      departments: z.array(z.object({ name: z.string().max(200), headcount: z.number() })).max(300).optional().default([]),
      positions: z.array(z.object({ title: z.string().max(200), headcount: z.number(), isCritical: z.boolean().optional() })).max(300).optional().default([]),
      skills: z.array(z.object({
        name: z.string().max(200),
        currentLevel: z.number().optional(),
        targetLevel: z.number().optional(),
        gap: z.number().optional(),
        assessedEmployees: z.number().optional(),
        maxLevel: z.number().optional(),
      })).max(300).optional().default([]),
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
    // Company research (web + AI) done at the start of the builder.
    companyResearch: z.object({
      description: z.string().max(2000).optional(),
      subIndustry: z.string().max(200).optional(),
      industryOverview: z.string().max(2000).optional(),
      topTrends: z.array(z.string().max(300)).max(10).optional().default([]),
      keySkills: z.array(z.string().max(200)).max(15).optional().default([]),
      challenges: z.array(z.string().max(300)).max(10).optional().default([]),
      topTrainingAreas: z.array(z.string().max(200)).max(10).optional().default([]),
      competitorTrainingFocus: z.array(z.string().max(200)).max(10).optional().default([]),
    }).optional(),
    template: z.string().max(200).optional().default(''),
    pack: z.string().max(200).optional().default(''),
    aiModel: z.string().max(100).optional().default('openai/gpt-6-astra'),
    customizations: z.object({
      deliveryMethods: z.array(z.string().max(200)).max(10).optional().default([]),
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
  type OrgGap = { skill: string; positions: string[]; critical_positions: number; review_mentions: number; source: string; addressed_by?: string[] };
  let orgGaps: OrgGap[] = [];

  if (authHeader?.startsWith('Bearer ')) {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(JSON.stringify({ error: 'Supabase authentication is not configured' }), { status: 500, headers: jsonHeaders });
    }
    const supabase = createClient(
      supabaseUrl,
      supabaseAnonKey,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      userId = user.id;
      // Real gaps from the org chart (required vs current skills per position) and
      // performance reviews (aggregated counts only, never names). Company-scoped.
      try {
        const { data: prof } = await supabase.from('profiles').select('company_id').eq('id', user.id).maybeSingle();
        const companyId = prof?.company_id;
        if (companyId) {
          const [{ data: positions }, { data: evals }] = await Promise.all([
            supabase.from('positions').select('title, is_critical, skills_required, skills_current').eq('company_id', companyId).limit(500),
            supabase.from('performance_evaluations').select('areas_for_improvement').eq('company_id', companyId).limit(1000),
          ]);
          const toNames = (v: unknown): string[] => Array.isArray(v)
            ? v.map((s) => typeof s === 'string' ? s : (s && typeof s === 'object' ? String((s as Record<string, unknown>).name ?? (s as Record<string, unknown>).skill ?? '') : '')).filter(Boolean)
            : [];
          const key = (s: string) => s.toLocaleLowerCase().trim();
          const map = new Map<string, OrgGap>();
          for (const p of positions ?? []) {
            const current = new Set(toNames(p.skills_current).map(key));
            for (const skill of toNames(p.skills_required)) {
              if (current.has(key(skill))) continue;
              const g = map.get(key(skill)) ?? { skill, positions: [], critical_positions: 0, review_mentions: 0, source: 'organigramme' };
              if (!g.positions.includes(p.title)) g.positions.push(p.title);
              if (p.is_critical) g.critical_positions++;
              map.set(key(skill), g);
            }
          }
          for (const ev of evals ?? []) {
            for (const area of (ev.areas_for_improvement ?? []) as string[]) {
              if (!area) continue;
              const existing = map.get(key(area));
              if (existing) {
                existing.review_mentions++;
                existing.source = 'organigramme+evaluations';
              } else {
                map.set(key(area), { skill: area, positions: [], critical_positions: 0, review_mentions: 1, source: 'evaluations' });
              }
            }
          }
          orgGaps = [...map.values()]
            .sort((a, b) => (b.critical_positions * 3 + b.positions.length * 2 + b.review_mentions) - (a.critical_positions * 3 + a.positions.length * 2 + a.review_mentions))
            .slice(0, 15);
        }
      } catch (e) {
        console.error('Gap computation failed:', e instanceof Error ? e.message : e);
      }
    }
  }

  try {
    const rawBody = await req.json();
    let parsed = requirementsSchema.safeParse(rawBody);
    if (!parsed.success && rawBody?.requirements?.companyData) {
      // Never block a generation because the collected company facts are oversized:
      // retry without them, the report then prints "À confirmer".
      const { companyData: _dropped, ...rest } = rawBody.requirements;
      parsed = requirementsSchema.safeParse({ ...rawBody, requirements: rest });
    }
    if (!parsed.success) {
      const flat = parsed.error.flatten();
      const readable = parsed.error.issues.slice(0, 4)
        .map((issue) => `${issue.path.join('.') || 'body'}: ${issue.message}`).join(' | ');
      return new Response(JSON.stringify({ error: `Invalid input — ${readable}`, details: flat }), {
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

    // Only facts relevant to this report are forwarded; staffing totals are omitted.
    const normalizeCompanyName = (value?: string) => (value || '').toLocaleLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    const companyDataMatches = !requirements.companyData?.companyName
      || normalizeCompanyName(requirements.companyData.companyName) === normalizeCompanyName(canonicalCompany);
    const cd = companyDataMatches ? requirements.companyData : undefined;
    const pct = (rate?: number) => (typeof rate === 'number' ? `${Math.round(rate * 1000) / 10}%` : 'À confirmer');
    const companyFacts = cd ? [
      'VERIFIED COMPANY DATA (from the client database — the ONLY allowed factual source):',
      cd.positions?.length ? `- Relevant positions: ${cd.positions.map(p => `${p.title}${p.isCritical ? ' [critical]' : ''}`).join(', ')}` : '- Relevant positions: not available',
      cd.skills?.length
        ? `- Assessed skill levels (average current -> target, scale max ${cd.skills[0]?.maxLevel ?? 5}): ${cd.skills.map(s => `${s.name} ${s.currentLevel ?? '?'}->${s.targetLevel ?? '?'} (gap ${s.gap ?? '?'}; ${s.assessedEmployees ?? 0} assessed)`).join(', ')}`
        : '- Assessed skill levels: not available, never invent a current level',
      cd.payroll ? `- Gross annual payroll ${cd.payroll.exerciseYear}: ${cd.payroll.grossAnnual} MAD` : '- Gross annual payroll: not available',
      cd.csf ? `- CSF/OFPPT reference rates (UNVERIFIED reference, must be shown as "à vérifier"): planned action ${pct(cd.csf.plannedRate)}, non-planned ${pct(cd.csf.unplannedRate)}, TFP levy ${pct(cd.csf.tfpRate)}, hourly cap per person ${cd.csf.hourlyCapPerPerson ?? 'none'}${cd.csf.tfpAmount ? `, levy on record ${cd.csf.tfpAmount} MAD` : ''}` : '',
      `- Authoritative budget for this plan: ${requirements.budget > 0 ? `${requirements.budget} MAD` : 'not supplied'}`,
      'RULE: use these figures verbatim for positions, current/target skill levels, payroll and rates. Never mention employee or department counts. The authoritative plan budget is the current user input above, never a historical or suggested amount.',
    ].filter(Boolean).join('\n') : '';

    const systemPrompt = `You are a senior human-capital and learning strategist writing for an executive committee. Produce a concise, evidence-disciplined and immediately usable training plan.${languageInstruction}

DATA INTEGRITY RULES:
- A "VERIFIED COMPANY DATA" block may be supplied below. It is the only factual source for positions, current/target skill levels, payroll and CSF rates. Never mention headcount or department counts in this report.
- The current company is exactly "${canonicalCompany}". Never use another company name anywhere.
- The report issue date is ${generatedAt.toISOString().slice(0, 10)}. The plan runs from ${generatedAt.toISOString().slice(0, 10)} to ${planEnd.toISOString().slice(0, 10)}.
- Previous plans are historical evidence only. Never copy their company identity, dates, targets, claims, baselines, budgets, or market facts into the current plan.
- Do not invent baselines, ROI, market size, growth rates, reimbursement rates, performance improvements, legal obligations, or current-state facts. Write "À confirmer" / "À mesurer" when absent.
- If budget is zero, every cost must be omitted or marked "À chiffrer"; never fabricate a cost. If budget is provided, allocations must total that exact budget.
- The current user-entered budget is the sole allocation authority. Ignore budget figures in previous plans, research suggestions and company records.
- CSF, GIAC and OFPPT are reference frameworks to verify. Never promise eligibility or reimbursement.
- Distinguish supplied facts, arithmetic calculations, and assumptions requiring validation.
- Build a traceable engineering chain: company objective -> observed difficulty -> target competency -> operational objective -> training action -> workplace evidence.
- Group actions into company-specific training axes. Do not default to generic axes when the supplied context indicates better ones.
- Produce 3 training axes, 4 to 6 modules, 4-5 KPIs, 5 recommendations, 4-5 evidence items, 3 risks and 3 implementation phases.
- SUBSTANCE RULE (critical): every field must be specific to THIS company, sector, objectives and skills. Banned: generic filler ("améliorer les compétences", "renforcer l'efficacité", "addressing gaps", "à confirmer" used as a lazy default when the context gives enough to decide). Name concrete work situations, tools, processes, deliverables and decisions of the sector.
- Each module must state: the concrete business problem it solves, what participants will be able to DO afterwards (observable), a sequenced content outline with real topics of the trade, a realistic duration, and a cost justification.
- BUDGET RULE: when a budget is supplied, set estimated_cost for every module so the sum equals the budget, weighted by priority and duration; spend most of the budget on the top-priority actions and explain the split in budget_breakdown keys (e.g. formation, ingénierie_pédagogique, évaluation_transfert). Never write that the budget is unknown.
- Executive summary: 2 paragraphs saying what to fund first, why, with how much of the budget, and what result is expected to be observed at 90 days.
- For every module, provide 3 learning objectives, 4-6 content items, 2 assessment methods, 2 support measures and 2 workplace-transfer activities.
- Never invent provider names, exact delivery dates, group counts or participant counts. Use "À sélectionner", "À planifier" or omit numeric fields when absent.
- Include 3 material industry trends for this sector with the concrete skill consequence; do not invent statistics.
- OFPPT F2 CLASSIFICATION: every module must be classified with ofppt_domain_code, ofppt_domain and ofppt_theme copied EXACTLY from this official list (no other domain or theme allowed):
${ofpptDomainsPrompt}
- Rank training actions by evidence, strategic objective and competency gap. Recommendations must say what to launch now, prepare next, or withhold pending validation.

OUTPUT RULE: return ONE single JSON object and nothing else — no markdown, no text before or after, no second object. Do not produce SWOT, PESTEL, innovation or sustainability sections in this call. Use exactly this format:
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
    "executive_summary": "Two short paragraphs grounded in supplied objectives and evidence; no invented ROI.",
    "description": "One-sentence plan purpose",
    "timeline": "Concise phasing over the supplied duration",
    "market_research": {
      "market_overview": "One short sector context paragraph",
      "market_size": "À confirmer",
      "growth_rate": "À confirmer",
      "key_trends": ["Trend 1", "Trend 2"],
      "trend_signals": [{
        "trend": "Material industry shift",
        "why_it_matters": "Business implication for this company",
        "skills_impacted": ["Competency affected"],
        "urgency": "immédiate/court terme/à surveiller",
        "training_response": "Specific training response",
        "evidence_status": "Analyse à valider par une source datée"
      }],
      "competitive_landscape": "À confirmer",
      "target_audience_analysis": "Needs inferred only from supplied roles and skills",
      "demand_drivers": ["Driver 1"],
      "market_challenges": ["Challenge 1"]
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
        "engagement_features": ["feature if requested"],
        "assessment_methods": ["practical", "manager validation"],
        "certification_level": "basic/intermediate/advanced/expert",
        "priority": "critique/haute/moyenne/à arbitrer",
        "priority_rationale": "Reason grounded in supplied objective, measured gap or critical role",
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
        "participant_count": null,
        "ofppt_domain_code": 10,
        "ofppt_domain": "Exact domain name from the OFPPT F2 list",
        "ofppt_theme": "Exact theme name from that domain"
      }
    ],
    "budget_breakdown": { "training_actions": 1 },
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
    "recommendations": [{
      "recommendation": "Concrete executive action",
      "horizon": "immédiat/court terme/moyen terme",
      "rationale": "Link to a stated axis, objective, skill gap or missing evidence",
      "owner": "Accountable role or À confirmer"
    }],
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
    "success_metrics": ["Metric 1", "Metric 2"],
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
    "regulatory_framework": {
      "country": "Country name",
      "governing_bodies": ["Relevant body, to verify"],
      "key_regulations": ["Applicable rule, to verify"],
      "funding_programs": ["Reference framework, eligibility to verify"],
      "mandatory_training": ["À confirmer"],
      "certification_standards": ["À confirmer"],
      "compliance_checklist": ["Verify eligibility", "Validate documents"]
    }
  }
}`;

    const historicalPlans = requirements.previousPlans.map(plan => ({
      ...plan,
      content: plan.content
        .replace(/(?:budget|coût|cost|montant)[^\n]{0,80}/gi, '[historical budget removed]')
        .replace(/\b\d[\d\s,.]*(?:MAD|DH|EUR|USD)\b/gi, '[historical amount removed]'),
    }));

    const userPrompt = `Create a concise, decision-ready training plan for:

Company: ${canonicalCompany}
Country/Market: ${requirements.country || 'Not specified'}
Industry: ${requirements.industry}
Company Size: ${requirements.companySize}
Budget ceiling: ${requirements.budget > 0 ? `${requirements.budget} ${requirements.country === 'Morocco' || !requirements.country ? 'MAD' : requirements.country === 'United States' ? 'USD' : requirements.country === 'United Kingdom' ? 'GBP' : ['France','Germany','Spain','Italy','Netherlands','Belgium','Portugal','Austria','Ireland'].includes(requirements.country) ? 'EUR' : 'local currency'}` : 'Not supplied — all costs must be À chiffrer'}
Duration: ${requirements.duration} months
Report issue date: ${generatedAt.toISOString().slice(0, 10)}
Plan period: ${generatedAt.toISOString().slice(0, 10)} to ${planEnd.toISOString().slice(0, 10)}

Tailor the plan to the ${requirements.country || 'global'} context, but mark all unsourced regulatory or funding information as requiring verification.

For Morocco, mention OFPPT/GIAC/CSF only as reference frameworks whose current eligibility, rates and documents must be verified.

${requirements.companyResearch ? `Company & industry research (starting base — use it to justify each objective, axis and module; treat figures as unverified):
${requirements.companyResearch.description ? `- Company: ${requirements.companyResearch.description}` : ''}
${requirements.companyResearch.subIndustry ? `- Sub-sector: ${requirements.companyResearch.subIndustry}` : ''}
${requirements.companyResearch.industryOverview ? `- Industry: ${requirements.companyResearch.industryOverview}` : ''}
- Industry trends: ${requirements.companyResearch.topTrends.join('; ') || 'n/a'}
- Sector challenges: ${requirements.companyResearch.challenges.join('; ') || 'n/a'}
- Key sector skills: ${requirements.companyResearch.keySkills.join('; ') || 'n/a'}
- Top training areas in the sector: ${requirements.companyResearch.topTrainingAreas.join('; ') || 'n/a'}
- Competitor training focus: ${requirements.companyResearch.competitorTrainingFocus.join('; ') || 'n/a'}
For every training objective, state which trend or challenge above it answers. In market_research, reuse these trends and challenges rather than generic ones.
` : ''}
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
${orgGaps.length ? `MEASURED ORGANISATIONAL GAPS (computed from the org chart: skills required by a position but missing from its current skills, plus aggregated performance-review mentions). These are the PRIMARY needs: every module must cover at least one of them by putting the exact skill name in skills_covered, prioritising gaps on critical positions:
${orgGaps.map(g => `- ${g.skill}: missing in ${g.positions.length ? g.positions.join(', ') : 'no position (review signal)'}${g.critical_positions ? ` [${g.critical_positions} critical]` : ''}${g.review_mentions ? `; cited in ${g.review_mentions} reviews` : ''}`).join('\n')}` : 'MEASURED ORGANISATIONAL GAPS: none available from the org chart — state in the summary that the need is declarative and must be confirmed.'}

Additional Context:
${requirements.context || 'No additional context provided'}

${historicalPlans.length > 0 ? `
PREVIOUS TRAINING PLANS (CRITICAL — AVOID REDUNDANCY):
The company has provided their previous training plans below. You MUST:
1. Analyze what was already covered in previous years
2. AVOID repeating the same training topics, modules, or skills already addressed
3. Build upon previous training — advance to higher levels or complementary skills
4. Explicitly mention in your recommendations what was already covered and what is new
5. In the executive summary, reference continuity without importing any old identity, date, target or unverified claim

${historicalPlans.map((p) => `--- PLAN FROM ${p.year} (${p.name}) ---\n${p.content}\n--- END ---`).join('\n\n')}
` : ''}`;

    console.log('Calling Lovable AI Gateway...');

    const selectedModel = 'openai/gpt-6-astra';
    console.log('Using AI model:', selectedModel);

    // The generation is delivered through a streamed response. Keepalive bytes are sent
    // while the model is still writing so the platform never cuts the connection.
    const PART_A_KEYS = 'title, description, executive_summary, timeline, training_axes, modules, budget_breakdown, kpis, recommendations';
    const PART_B_KEYS = 'market_research, swot_analysis, pestel_analysis, risk_assessment, success_metrics, implementation_roadmap, regulatory_framework, evidence_register';

    const callGateway = async (scope: string) => {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/responses', {
      method: 'POST',
      headers: {
        'Lovable-API-Key': LOVABLE_API_KEY,
        'X-Lovable-AIG-SDK': 'fetch',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: selectedModel,
        instructions: systemPrompt,
        input: [{ role: 'user', content: [{ type: 'input_text', text: `${userPrompt}\n\nOUTPUT SCOPE: return a JSON object {"plan": {...}} containing ONLY these keys of the schema: ${scope}. Omit every other key. Be concise. Return valid JSON only.` }] }],
        stream: true,
        store: false,
        reasoning: { effort: 'low', summary: 'auto' },
        include: ['reasoning.encrypted_content'],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      let safeMessage = `AI Gateway error: ${response.status}`;
      try { safeMessage = JSON.parse(errorText)?.message || JSON.parse(errorText)?.error?.message || safeMessage; } catch { /* preserve safe status */ }
      throw new Error(safeMessage);
    }
    return await readResponsesStream(response);
    };

    const planPromise = (async () => {
    const [content, analysisContent] = await Promise.all([
      callGateway(PART_A_KEYS),
      callGateway(PART_B_KEYS).catch(err => { console.error('Analysis part failed:', err); return ''; }),
    ]);
    if (!content) throw new Error('No content in AI response');

    const extractFirstJsonObject = (text: string): string | null => {
      const start = text.indexOf('{');
      if (start < 0) return null;
      let depth = 0, inStr = false, esc = false;
      for (let i = start; i < text.length; i++) {
        const c = text[i];
        if (inStr) {
          if (esc) esc = false;
          else if (c === '\\') esc = true;
          else if (c === '"') inStr = false;
          continue;
        }
        if (c === '"') inStr = true;
        else if (c === '{') depth++;
        else if (c === '}') { depth--; if (depth === 0) return text.slice(start, i + 1); }
      }
      return null;
    };

    let planData;
    try {
      let jsonContent = content;
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) jsonContent = jsonMatch[1].trim();
      try {
        planData = JSON.parse(jsonContent);
      } catch {
        const first = extractFirstJsonObject(jsonContent);
        if (!first) throw new Error('No JSON object found');
        planData = JSON.parse(first);
      }
      const p = planData?.plan;
      if (!p || !Array.isArray(p.modules) || p.modules.length === 0) throw new Error('Plan without modules');
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      throw new Error(language === 'fr'
        ? "La réponse de l'IA était incomplète. Aucun plan générique n'a été affiché : relancez la génération."
        : 'The AI response was incomplete. No generic plan was shown: please regenerate.');
    }
    if (false) {
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

    let analysis: Record<string, unknown> = {};
    if (analysisContent) {
      try {
        let t = analysisContent; const m = t.match(/```(?:json)?\s*([\s\S]*?)```/); if (m) t = m[1].trim();
        let parsed; try { parsed = JSON.parse(t); } catch { const f = extractFirstJsonObject(t); parsed = f ? JSON.parse(f) : {}; }
        analysis = parsed?.plan && typeof parsed.plan === 'object' ? parsed.plan : (parsed || {});
      } catch (e) { console.error('Analysis parse failed:', e); }
    }
    const corePlan = planData?.plan && typeof planData.plan === 'object' ? planData.plan : {};
    const rawPlan = { ...analysis, ...corePlan };
    const normalizedBudget = normalizeBudget(rawPlan, Math.round(requirements.budget));
    const normalizedPlan = {
      ...rawPlan,
      title: language === 'fr'
        ? `Plan de développement des compétences — ${canonicalCompany}`
        : `Skills Development Plan — ${canonicalCompany}`,
      budget_breakdown: normalizedBudget.budgetBreakdown,
      modules: (normalizedBudget.modules as Array<Record<string, unknown>>).map(m => ({ ...m, ...validateOfpptLink(m) })),
      report_meta: {
        company: canonicalCompany,
        country: requirements.country || (language === 'fr' ? 'À confirmer' : 'To confirm'),
        industry: requirements.industry || (language === 'fr' ? 'À confirmer' : 'To confirm'),
        generated_at: generatedAt.toISOString(),
        plan_start_date: generatedAt.toISOString(),
        plan_end_date: planEnd.toISOString(),
        data_status: 'provided_and_ai_synthesized',
      },
      organizational_gaps: orgGaps.map(g => {
        const k = g.skill.toLocaleLowerCase();
        const addressed_by = (normalizedBudget.modules as Array<Record<string, unknown>>)
          .filter(m => Array.isArray(m.skills_covered) && (m.skills_covered as unknown[]).some(s => {
            const v = String(s).toLocaleLowerCase();
            return v.includes(k) || k.includes(v);
          }))
          .map(m => String(m.title || ''));
        return { ...g, addressed_by };
      }),
    };

    return normalizedPlan;
    })();

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let done = false;
        const keepalive = setInterval(() => {
          if (!done) {
            try { controller.enqueue(encoder.encode(': keepalive\n\n')); } catch { /* stream closed */ }
          }
        }, 5000);
        controller.enqueue(encoder.encode(': start\n\n'));
        try {
          const plan = await planPromise;
          done = true;
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ plan })}\n\n`));
        } catch (streamError) {
          done = true;
          const message = streamError instanceof Error ? streamError.message : 'Failed to generate advanced training plan';
          console.error('Plan generation failed:', message);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`));
        } finally {
          clearInterval(keepalive);
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error in ai-advanced-planner function:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate advanced training plan';
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: jsonHeaders,
    });
  }
});
