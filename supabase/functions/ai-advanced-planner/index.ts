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

    const systemPrompt = `You are an expert training consultant, market analyst, and strategist with deep knowledge of modern learning methodologies, industry best practices, and training ROI optimization. Create a comprehensive, actionable training plan with full market and strategic analysis.${languageInstruction}

IMPORTANT: You must respond with valid JSON in exactly this format:
{
  "plan": {
    "title": "Comprehensive Training Plan Title",
    "executive_summary": "A 2-3 paragraph executive summary covering the strategic rationale, key objectives, expected outcomes, and ROI justification for this training investment.",
    "description": "Detailed plan description with innovative approach",
    "timeline": "Detailed timeline breakdown with phases and milestones",
    "market_research": {
      "market_overview": "Comprehensive overview of the training market in this industry and country",
      "market_size": "Estimated market size for training in this sector",
      "growth_rate": "Annual growth rate of the training market",
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
        "certification_level": "basic/intermediate/advanced/expert"
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
        "target": "Specific target value with timeline",
        "measurement_frequency": "Monthly/Quarterly/Bi-annual",
        "baseline": "Current state measurement",
        "improvement_expected": "Expected improvement percentage"
      }
    ],
    "recommendations": ["Strategic recommendation with innovation focus"],
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
          "deliverables": ["Deliverable 1", "Deliverable 2"]
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

Company: ${requirements.company || 'Not specified'}
Country/Market: ${requirements.country || 'Not specified'}
Industry: ${requirements.industry}
Company Size: ${requirements.companySize}
Budget: ${requirements.budget} ${requirements.country === 'Morocco' || !requirements.country ? 'MAD' : requirements.country === 'United States' ? 'USD' : requirements.country === 'United Kingdom' ? 'GBP' : ['France','Germany','Spain','Italy','Netherlands','Belgium','Portugal','Austria','Ireland'].includes(requirements.country) ? 'EUR' : 'local currency'}
Duration: ${requirements.duration} months

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

Additional Context:
${requirements.context || 'No additional context provided'}

${requirements.previousPlans && requirements.previousPlans.length > 0 ? `
PREVIOUS TRAINING PLANS (CRITICAL — AVOID REDUNDANCY):
The company has provided their previous training plans below. You MUST:
1. Analyze what was already covered in previous years
2. AVOID repeating the same training topics, modules, or skills already addressed
3. Build upon previous training — advance to higher levels or complementary skills
4. Explicitly mention in your recommendations what was already covered and what is new
5. In the executive summary, reference continuity with previous plans

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
      ? requirements.aiModel!
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
          title: `Training Plan for ${requirements.company || 'Your Organization'}`,
          description: "AI-generated comprehensive training plan based on your requirements.",
          timeline: `${requirements.duration} months implementation period`,
          modules: [{
            title: "Foundation Skills Development",
            description: "Building core competencies aligned with organizational objectives",
            duration: "4 weeks",
            type: "mixed",
            skills_covered: requirements.targetSkills.slice(0, 3),
            prerequisites: [],
            delivery_method: "hybrid",
            resources_needed: ["Training materials", "Online platform access"],
            estimated_cost: Math.round(requirements.budget * 0.3),
            engagement_features: ["gamification", "peer_learning"],
            assessment_methods: ["practical", "peer_review"],
            certification_level: "intermediate"
          }],
          budget_breakdown: {
            internal_training: Math.round(requirements.budget * 0.3),
            external_courses: Math.round(requirements.budget * 0.25),
            materials_resources: Math.round(requirements.budget * 0.15),
            technology_platform: Math.round(requirements.budget * 0.1),
            assessment_certification: Math.round(requirements.budget * 0.1),
            contingency: Math.round(requirements.budget * 0.1)
          },
          kpis: [{ name: "Training Completion Rate", description: "Percentage of enrolled participants completing the program", target: "90%", measurement_frequency: "Monthly", baseline: "Current completion rates", improvement_expected: "20% improvement" }],
          recommendations: ["Start with a pilot group to refine the program", "Integrate regular feedback loops"],
          risk_assessment: { high_risks: ["Low participation rates"], medium_risks: ["Technology adoption challenges"], mitigation_strategies: ["Mandatory participation with manager support"], contingency_plans: ["Virtual alternatives for in-person sessions"] },
          success_metrics: ["90% training completion rate", "40% improvement in assessed skills"]
        }
      };
    }

    return new Response(JSON.stringify(planData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-advanced-planner function:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate advanced training plan' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
