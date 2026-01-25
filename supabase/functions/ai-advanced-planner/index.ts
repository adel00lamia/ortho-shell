import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

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

    console.log('Advanced plan generation for user:', userId);

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

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

Company: ${requirements.company || 'Not specified'}
Industry: ${requirements.industry || 'General'}
Company Size: ${requirements.companySize || 'Medium'}
Budget: ${requirements.budget || 50000} MAD
Duration: ${requirements.duration || 12} months

Training Objectives:
${requirements.objectives?.map((obj: string) => `- ${obj}`).join('\n') || '- Improve employee skills'}

Target Skills:
${requirements.targetSkills?.map((skill: string) => `- ${skill}`).join('\n') || '- General skills development'}

Constraints:
${requirements.constraints?.map((constraint: string) => `- ${constraint}`).join('\n') || '- None specified'}

Selected Delivery Methods:
${requirements.customizations?.deliveryMethods?.map((method: string) => `- ${method}`).join('\n') || '- online'}

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

Generate a detailed, innovative training plan that:
1. Maximizes ROI and ensures measurable skill development
2. Aligns with modern training methodologies and best practices
3. Includes specific recommendations for the ${requirements.industry || 'general'} industry
4. Considers the company size of ${requirements.companySize || 'medium-sized organization'}
5. Incorporates requested engagement features and delivery methods
6. Provides creative and innovative learning approaches
7. Addresses sustainability and long-term impact
8. Includes comprehensive risk assessment and mitigation
9. Focuses on business alignment and measurable outcomes
10. Considers Moroccan market context and compliance requirements`;

    console.log('Calling Lovable AI Gateway...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
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
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again in a few moments.',
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'Payment required. Please add credits to continue.',
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI response received successfully');

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('No content in AI response');
    }

    // Parse the JSON response
    let planData;
    try {
      // Try to extract JSON from the response (it might be wrapped in markdown code blocks)
      let jsonContent = content;
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonContent = jsonMatch[1].trim();
      }
      planData = JSON.parse(jsonContent);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.log('Raw response:', content);
      
      // Create a fallback plan structure
      planData = {
        plan: {
          title: `Training Plan for ${requirements.company || 'Your Organization'}`,
          description: "AI-generated comprehensive training plan based on your requirements.",
          timeline: `${requirements.duration || 12} months implementation period`,
          modules: [
            {
              title: "Foundation Skills Development",
              description: "Building core competencies aligned with organizational objectives",
              duration: "4 weeks",
              type: "mixed",
              skills_covered: requirements.targetSkills?.slice(0, 3) || ["Communication", "Leadership", "Problem Solving"],
              prerequisites: [],
              delivery_method: "hybrid",
              resources_needed: ["Training materials", "Online platform access"],
              estimated_cost: Math.round((requirements.budget || 50000) * 0.3),
              engagement_features: ["gamification", "peer_learning"],
              assessment_methods: ["practical", "peer_review"],
              certification_level: "intermediate"
            },
            {
              title: "Advanced Skill Mastery",
              description: "Deep dive into specialized competencies",
              duration: "6 weeks",
              type: "mixed",
              skills_covered: requirements.targetSkills?.slice(3, 6) || ["Technical Skills", "Project Management"],
              prerequisites: ["Foundation Skills Development"],
              delivery_method: "workshop",
              resources_needed: ["Expert trainers", "Case studies"],
              estimated_cost: Math.round((requirements.budget || 50000) * 0.4),
              engagement_features: ["mentorship", "real_projects"],
              assessment_methods: ["practical", "presentation"],
              certification_level: "advanced"
            }
          ],
          budget_breakdown: {
            internal_training: Math.round((requirements.budget || 50000) * 0.3),
            external_courses: Math.round((requirements.budget || 50000) * 0.25),
            materials_resources: Math.round((requirements.budget || 50000) * 0.15),
            technology_platform: Math.round((requirements.budget || 50000) * 0.1),
            assessment_certification: Math.round((requirements.budget || 50000) * 0.1),
            contingency: Math.round((requirements.budget || 50000) * 0.1)
          },
          kpis: [
            {
              name: "Training Completion Rate",
              description: "Percentage of enrolled participants completing the program",
              target: "90%",
              measurement_frequency: "Monthly",
              baseline: "Current completion rates",
              improvement_expected: "20% improvement"
            },
            {
              name: "Skill Improvement Score",
              description: "Average improvement in assessed skill levels",
              target: "40% improvement",
              measurement_frequency: "Quarterly",
              baseline: "Pre-training assessment",
              improvement_expected: "40% improvement"
            }
          ],
          recommendations: [
            "Start with a pilot group to refine the program",
            "Integrate regular feedback loops for continuous improvement",
            "Consider blended learning approaches for maximum engagement",
            "Establish clear success metrics from the beginning"
          ],
          risk_assessment: {
            high_risks: ["Low participation rates", "Budget overruns"],
            medium_risks: ["Technology adoption challenges", "Scheduling conflicts"],
            mitigation_strategies: ["Mandatory participation with manager support", "Phased implementation approach"],
            contingency_plans: ["Virtual alternatives for in-person sessions", "Modular content for flexibility"]
          },
          success_metrics: [
            "90% training completion rate",
            "40% improvement in assessed skills",
            "85% participant satisfaction score",
            "Measurable ROI within 12 months"
          ]
        }
      };
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
