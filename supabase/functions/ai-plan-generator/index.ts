import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

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
    const { objectives, diagnosticData } = await req.json();

    console.log('Generating training plan with data:', { objectives, diagnosticData });

    const prompt = `You are an expert training consultant. Based on the following diagnostic data, generate a comprehensive annual training plan in JSON format.

DIAGNOSTIC DATA:
- Objectives: ${objectives}
- Industry: ${diagnosticData.industry}
- Company Size: ${diagnosticData.companySize}
- Budget Range: ${diagnosticData.budgetRange}
- Languages: ${diagnosticData.languages?.join(', ')}
- Current Skills: ${JSON.stringify(diagnosticData.currentSkills)}
- Target Skills: ${JSON.stringify(diagnosticData.targetSkills)}
- Priorities: ${diagnosticData.priorities?.join(', ')}
- Constraints: ${diagnosticData.constraints?.join(', ')}

Generate a JSON response with this exact structure:
{
  "title": "Annual Training Plan for [Company]",
  "description": "Comprehensive description of the training plan",
  "objectives": ["objective1", "objective2", "objective3"],
  "targetSkills": ["skill1", "skill2", "skill3"],
  "modules": [
    {
      "title": "Module Title",
      "description": "Module description",
      "type": "internal" or "external",
      "duration": "duration in hours",
      "skills": ["skill1", "skill2"],
      "certification": true/false,
      "ofpptCompliant": true/false,
      "giacApproved": true/false
    }
  ],
  "durationMonths": 12,
  "estimatedBudget": numeric_value,
  "type": "mixed" | "internal" | "external",
  "internalExternalSplit": {
    "internal": 70,
    "external": 30
  },
  "kpis": {
    "completionRate": 85,
    "satisfactionScore": 4.5,
    "skillImprovement": 40,
    "roiTarget": 300
  },
  "giacApproved": false,
  "ofpptCompliant": true,
  "implementationPhases": [
    {
      "phase": "Phase 1",
      "months": "1-3",
      "focus": "Foundation Skills",
      "modules": ["module1", "module2"]
    }
  ]
}

Important guidelines:
1. Ensure OFPPT compliance for Moroccan companies
2. Consider GIAC certification for cybersecurity modules
3. Balance internal/external training based on budget and constraints
4. Include measurable KPIs
5. Suggest realistic timeframes
6. Factor in the specified budget range
7. Align with the stated objectives and skill gaps
8. Consider language preferences for training delivery`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an expert training consultant specializing in creating comprehensive annual training plans. Always respond with valid JSON format.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('OpenAI response:', data);

    const generatedContent = data.choices[0].message.content;
    
    // Parse the JSON response
    let trainingPlan;
    try {
      trainingPlan = JSON.parse(generatedContent);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.log('Raw response:', generatedContent);
      
      // Fallback plan if JSON parsing fails
      trainingPlan = {
        title: "Custom Annual Training Plan",
        description: "AI-generated training plan based on your diagnostic assessment",
        objectives: [objectives],
        targetSkills: Object.keys(diagnosticData.targetSkills || {}),
        modules: [
          {
            title: "Foundation Skills Development",
            description: "Building core competencies based on identified skill gaps",
            type: "mixed",
            duration: "40 hours",
            skills: Object.keys(diagnosticData.targetSkills || {}),
            certification: true,
            ofpptCompliant: true,
            giacApproved: false
          }
        ],
        durationMonths: 12,
        estimatedBudget: 50000,
        type: "mixed",
        internalExternalSplit: { internal: 60, external: 40 },
        kpis: {
          completionRate: 80,
          satisfactionScore: 4.0,
          skillImprovement: 35,
          roiTarget: 250
        },
        giacApproved: false,
        ofpptCompliant: true,
        implementationPhases: [
          {
            phase: "Phase 1",
            months: "1-6",
            focus: "Foundation Building",
            modules: ["Foundation Skills Development"]
          }
        ]
      };
    }

    console.log('Generated training plan:', trainingPlan);

    return new Response(JSON.stringify(trainingPlan), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-plan-generator function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Failed to generate training plan'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});