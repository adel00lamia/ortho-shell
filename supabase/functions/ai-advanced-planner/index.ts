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

    const systemPrompt = `You are an expert training consultant and strategist with deep knowledge of modern learning methodologies, industry best practices, and training ROI optimization. Create a comprehensive, actionable training plan that demonstrates innovation and creativity.

IMPORTANT: You must respond with valid JSON in exactly this format:
{
  "plan": {
    "title": "Comprehensive Training Plan Title",
    "description": "Detailed plan description with innovative approach",
    "timeline": "Detailed timeline breakdown with phases and milestones",
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
    "recommendations": [
      "Strategic recommendation with innovation focus",
      "Technology integration suggestion",
      "ROI optimization strategy",
      "Sustainability and scalability advice"
    ],
    "risk_assessment": {
      "high_risks": ["Risk 1 with impact assessment", "Risk 2 with probability"],
      "medium_risks": ["Medium risk 1", "Medium risk 2"],
      "mitigation_strategies": ["Comprehensive strategy 1", "Proactive strategy 2"],
      "contingency_plans": ["Backup plan 1", "Alternative approach 2"]
    },
    "success_metrics": [
      "Quantifiable success indicator 1",
      "Behavioral change metric 2",
      "Business impact measurement 3",
      "ROI calculation method 4"
    ],
    "innovation_features": {
      "ai_integration": "How AI will enhance the learning experience",
      "personalization": "Adaptive learning paths and customization",
      "social_learning": "Peer collaboration and knowledge sharing",
      "microlearning": "Bite-sized content and just-in-time learning",
      "gamification": "Points, badges, leaderboards, and challenges",
      "virtual_reality": "Immersive learning experiences if applicable",
      "mobile_learning": "On-the-go learning accessibility"
    },
    "sustainability_plan": {
      "long_term_vision": "3-5 year learning and development roadmap",
      "continuous_improvement": "Feedback loops and iterative enhancement",
      "knowledge_retention": "Strategies to ensure lasting learning impact",
      "culture_transformation": "Building a learning organization"
    }
  }
}

Create a plan that is:
1. Innovative and forward-thinking with modern learning approaches
2. Realistic and achievable within the budget and timeline
3. Aligned with business objectives and industry best practices
4. Includes diverse learning modalities (online, hybrid, mentorship, microlearning)
5. Has clear progression paths and skill development stages
6. Includes measurable KPIs with baseline and target metrics
7. Considers OFPPT compliance and Moroccan market context
8. Addresses modern training delivery methods and technologies
9. Incorporates engagement features like gamification and social learning
10. Provides comprehensive risk assessment and mitigation strategies
11. Focuses on ROI optimization and business impact
12. Includes sustainability and long-term development planning`;

    const userPrompt = `Create an innovative and comprehensive training plan for:

Company: ${requirements.company}
Industry: ${requirements.industry}
Company Size: ${requirements.companySize}
Budget: ${requirements.budget} MAD
Duration: ${requirements.duration} months

Training Objectives:
${requirements.objectives.map(obj => `- ${obj}`).join('\n')}

Target Skills:
${requirements.targetSkills.map(skill => `- ${skill}`).join('\n')}

Constraints:
${requirements.constraints.map(constraint => `- ${constraint}`).join('\n')}

Selected Delivery Methods:
${requirements.customizations?.deliveryMethods?.map(method => `- ${method}`).join('\n') || '- online'}

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
${requirements.context}

Generate a detailed, innovative training plan that:
1. Maximizes ROI and ensures measurable skill development
2. Aligns with modern training methodologies and best practices
3. Includes specific recommendations for the ${requirements.industry} industry
4. Considers the company size of ${requirements.companySize}
5. Incorporates requested engagement features and delivery methods
6. Provides creative and innovative learning approaches
7. Addresses sustainability and long-term impact
8. Includes comprehensive risk assessment and mitigation
9. Focuses on business alignment and measurable outcomes
10. Considers Moroccan market context and compliance requirements`;

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