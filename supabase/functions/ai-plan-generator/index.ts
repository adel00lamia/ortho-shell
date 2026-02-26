import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://esm.sh/zod@3.23.8';

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const requestSchema = z.object({
  objectives: z.string().max(5000),
  diagnosticData: z.object({
    industry: z.string().max(100).optional().default('General'),
    companySize: z.string().max(50).optional().default('Medium'),
    budgetRange: z.string().max(100).optional().default(''),
    languages: z.array(z.string().max(50)).max(10).optional().default([]),
    currentSkills: z.record(z.unknown()).optional().default({}),
    targetSkills: z.record(z.unknown()).optional().default({}),
    priorities: z.array(z.string().max(500)).max(20).optional().default([]),
    constraints: z.array(z.string().max(500)).max(20).optional().default([]),
  }).passthrough(),
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
    if (user) userId = user.id;
  }

  try {
    const rawBody = await req.json();
    const parsed = requestSchema.safeParse(rawBody);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Invalid input', details: parsed.error.flatten() }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { objectives, diagnosticData } = parsed.data;

    console.log('Generating training plan for user:', userId);

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
  "description": "Comprehensive description",
  "objectives": ["objective1", "objective2"],
  "targetSkills": ["skill1", "skill2"],
  "modules": [{ "title": "Module Title", "description": "Module description", "type": "internal", "duration": "duration in hours", "skills": ["skill1"], "certification": true, "ofpptCompliant": true, "giacApproved": false }],
  "durationMonths": 12,
  "estimatedBudget": 50000,
  "type": "mixed",
  "internalExternalSplit": { "internal": 70, "external": 30 },
  "kpis": { "completionRate": 85, "satisfactionScore": 4.5, "skillImprovement": 40, "roiTarget": 300 },
  "giacApproved": false,
  "ofpptCompliant": true,
  "implementationPhases": [{ "phase": "Phase 1", "months": "1-3", "focus": "Foundation Skills", "modules": ["module1"] }]
}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: 'You are an expert training consultant specializing in creating comprehensive annual training plans. Always respond with valid JSON format.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;

    let trainingPlan;
    try {
      let jsonContent = generatedContent;
      const jsonMatch = generatedContent.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) jsonContent = jsonMatch[1].trim();
      trainingPlan = JSON.parse(jsonContent);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      trainingPlan = {
        title: "Custom Annual Training Plan",
        description: "AI-generated training plan based on your diagnostic assessment",
        objectives: [objectives],
        targetSkills: Object.keys(diagnosticData.targetSkills || {}),
        modules: [{ title: "Foundation Skills Development", description: "Building core competencies based on identified skill gaps", type: "mixed", duration: "40 hours", skills: Object.keys(diagnosticData.targetSkills || {}), certification: true, ofpptCompliant: true, giacApproved: false }],
        durationMonths: 12,
        estimatedBudget: 50000,
        type: "mixed",
        internalExternalSplit: { internal: 60, external: 40 },
        kpis: { completionRate: 80, satisfactionScore: 4.0, skillImprovement: 35, roiTarget: 250 },
        giacApproved: false,
        ofpptCompliant: true,
        implementationPhases: [{ phase: "Phase 1", months: "1-6", focus: "Foundation Building", modules: ["Foundation Skills Development"] }]
      };
    }

    return new Response(JSON.stringify(trainingPlan), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-plan-generator function:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate training plan' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
