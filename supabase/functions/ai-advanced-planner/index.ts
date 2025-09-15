import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { requirements, userId } = await req.json();

    console.log('Advanced plan generation for user:', userId, 'with model:', requirements.aiModel);

    const systemPrompt = `You are an expert training consultant and strategist. Create a comprehensive, actionable training plan based on the provided requirements.

IMPORTANT: You must respond with valid JSON in exactly this format:
{
  "plan": {
    "title": "Comprehensive Training Plan Title",
    "description": "Detailed plan description",
    "timeline": "Detailed timeline breakdown",
    "modules": [
      {
        "title": "Module Title",
        "description": "Module description",
        "duration": "X hours/days",
        "type": "internal/external/mixed",
        "skills_covered": ["skill1", "skill2"],
        "prerequisites": ["prereq1"],
        "delivery_method": "online/onsite/hybrid",
        "resources_needed": ["resource1"],
        "estimated_cost": 5000
      }
    ],
    "budget_breakdown": {
      "internal_training": 20000,
      "external_courses": 15000,
      "materials_resources": 5000,
      "technology_platform": 3000,
      "assessment_certification": 2000,
      "contingency": 5000
    },
    "kpis": [
      {
        "name": "KPI Name",
        "description": "How to measure this KPI",
        "target": "Specific target value",
        "measurement_frequency": "Monthly/Quarterly"
      }
    ],
    "recommendations": [
      "Strategic recommendation 1",
      "Strategic recommendation 2"
    ],
    "risk_assessment": {
      "high_risks": ["Risk 1", "Risk 2"],
      "mitigation_strategies": ["Strategy 1", "Strategy 2"]
    },
    "success_metrics": [
      "Metric 1",
      "Metric 2"
    ]
  }
}

Create a plan that is:
1. Realistic and achievable within the budget and timeline
2. Aligned with business objectives and industry best practices
3. Includes both internal and external training options
4. Has clear progression paths and prerequisites
5. Includes measurable KPIs and success metrics
6. Considers OFPPT compliance if applicable (Morocco context)
7. Addresses modern training delivery methods (online, hybrid, etc.)`;

    const userPrompt = `Create a comprehensive training plan for:

Company: ${requirements.company}
Industry: ${requirements.industry}
Company Size: ${requirements.companySize}
Budget: ${requirements.budget} MAD
Duration: ${requirements.duration} months

Objectives:
${requirements.objectives.map(obj => `- ${obj}`).join('\n')}

Target Skills:
${requirements.targetSkills.map(skill => `- ${skill}`).join('\n')}

Constraints:
${requirements.constraints.map(constraint => `- ${constraint}`).join('\n')}

Additional Context:
${requirements.context}

Generate a detailed training plan that maximizes ROI, ensures skill development, and aligns with modern training methodologies. Include specific recommendations for the ${requirements.industry} industry and consider the company size of ${requirements.companySize}.`;

    let planData;

    // Route to different AI services based on model selection
    switch (requirements.aiModel) {
      case 'perplexity':
        if (!perplexityApiKey) {
          throw new Error('Perplexity API key not configured');
        }
        planData = await generateWithPerplexity(systemPrompt, userPrompt);
        break;
      
      case 'claude-sonnet-4-20250514':
        if (!anthropicApiKey) {
          throw new Error('Anthropic API key not configured');
        }
        planData = await generateWithClaude(systemPrompt, userPrompt);
        break;
      
      default:
        if (!openAIApiKey) {
          throw new Error('OpenAI API key not configured');
        }
        planData = await generateWithOpenAI(systemPrompt, userPrompt, requirements.aiModel);
    }

    console.log('Advanced plan generated successfully');

    return new Response(JSON.stringify(planData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-advanced-planner function:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to generate advanced training plan',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function generateWithOpenAI(systemPrompt: string, userPrompt: string, model: string) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 4000,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('OpenAI API error:', errorData);
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}

async function generateWithClaude(systemPrompt: string, userPrompt: string) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${anthropicApiKey}`,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: `${systemPrompt}\n\n${userPrompt}`
        }
      ],
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('Claude API error:', errorData);
    throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return JSON.parse(data.content[0].text);
}

async function generateWithPerplexity(systemPrompt: string, userPrompt: string) {
  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${perplexityApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-sonar-large-128k-online',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.2,
      top_p: 0.9,
      max_tokens: 4000,
      return_images: false,
      return_related_questions: false,
      search_recency_filter: 'month',
      frequency_penalty: 1,
      presence_penalty: 0
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('Perplexity API error:', errorData);
    throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}