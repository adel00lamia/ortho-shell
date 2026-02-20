import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Authenticate the request
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { type, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const validTypes = ['job_responsibilities', 'job_competencies', 'performance_strengths', 'performance_improvements', 'training_recommendations', 'company_objectives'];
    if (!validTypes.includes(type)) {
      return new Response(JSON.stringify({ error: 'Invalid suggestion type' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let systemPrompt = "";
    let userPrompt = "";

    switch (type) {
      case 'job_responsibilities':
        systemPrompt = "You are an HR expert. Generate 3-5 key responsibilities for a job role.";
        userPrompt = `Job Title: ${context.title}\nDepartment: ${context.department}\nLevel: ${context.level}\n\nGenerate 3-5 specific, actionable responsibilities.`;
        break;
      
      case 'job_competencies':
        systemPrompt = "You are an HR expert. Suggest 3-5 key competencies with appropriate skill levels.";
        userPrompt = `Job Title: ${context.title}\nDepartment: ${context.department}\nLevel: ${context.level}\n\nSuggest 3-5 competencies with their required skill levels (1-5).`;
        break;

      case 'performance_strengths':
        systemPrompt = "You are an HR evaluator. Suggest 3-4 potential strengths based on competency scores.";
        userPrompt = `Employee: ${context.employeeName}\nJob: ${context.jobTitle}\nCompetency Scores: ${JSON.stringify(context.scores)}\n\nSuggest 3-4 specific strengths.`;
        break;

      case 'performance_improvements':
        systemPrompt = "You are an HR evaluator. Suggest 2-3 areas for improvement based on competency scores.";
        userPrompt = `Employee: ${context.employeeName}\nJob: ${context.jobTitle}\nCompetency Scores: ${JSON.stringify(context.scores)}\n\nSuggest 2-3 specific areas for improvement.`;
        break;

      case 'training_recommendations':
        systemPrompt = "You are a learning & development expert. Recommend specific training courses or programs.";
        userPrompt = `Areas for Improvement: ${context.improvements.join(', ')}\nJob: ${context.jobTitle}\n\nRecommend 3-4 specific training programs.`;
        break;

      case 'company_objectives':
        systemPrompt = "You are a business consultant. Suggest clear training objectives for a company.";
        userPrompt = `Industry: ${context.industry}\nCompany Size: ${context.size}\n\nSuggest 3-5 clear training objectives.`;
        break;
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        tools: [{
          type: "function",
          function: {
            name: "provide_suggestions",
            description: "Return a list of suggestions",
            parameters: {
              type: "object",
              properties: {
                suggestions: {
                  type: "array",
                  items: { type: "string" }
                }
              },
              required: ["suggestions"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "provide_suggestions" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your Lovable AI workspace." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('AI gateway error');
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      const result = JSON.parse(toolCall.function.arguments);
      return new Response(
        JSON.stringify({ suggestions: result.suggestions }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('No suggestions generated');

  } catch (error) {
    console.error('Error in ai-suggest-diagnostic:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate suggestions' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
