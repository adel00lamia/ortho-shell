import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://esm.sh/zod@3.23.8';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const requestSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional().default(''),
  skills: z.array(z.string().max(200)).max(50).optional().default([]),
  audience: z.array(z.string().max(200)).max(20).optional().default([]),
  duration: z.number().min(0.5).max(500).optional().default(8),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const rawBody = await req.json();
    const parsed = requestSchema.safeParse(rawBody);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Invalid input', details: parsed.error.flatten() }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { title, description, skills, audience, duration } = parsed.data;

    console.log('Generating content for module for user:', user.id, { title });

    const systemPrompt = `You are an expert training content creator. Generate comprehensive training module content including slides, script, and quiz questions.

IMPORTANT: You must respond with valid JSON in exactly this format:
{
  "content": {
    "slides": [{ "title": "slide title", "content": "detailed slide content" }],
    "script": "complete training script for instructor",
    "quiz": [{ "question": "question text", "options": ["option1", "option2", "option3", "option4"], "correct": 0 }]
  }
}

Generate content for:
- 8-12 slides with comprehensive content
- A detailed instructor script
- 5-8 quiz questions with 4 options each

Make content engaging, practical, and aligned with the learning objectives.`;

    const userPrompt = `Create training module content for:

Title: ${title}
Description: ${description}
Skills to cover: ${skills.join(', ')}
Target audience: ${audience.join(', ')}
Duration: ${duration} hours

Generate comprehensive content including slides, instructor script, and assessment quiz.
Ensure content is practical, engaging, and includes real-world examples.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
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

    let generatedContent;
    try {
      generatedContent = JSON.parse(data.choices[0].message.content);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', parseError);
      const rawContent = data.choices[0].message.content;
      generatedContent = {
        content: {
          slides: [{ title: "Generated Content", content: rawContent }],
          script: rawContent,
          quiz: [{ question: "What is the main topic of this module?", options: [title, "General knowledge", "Other topic", "Not specified"], correct: 0 }]
        }
      };
    }

    return new Response(JSON.stringify(generatedContent), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in module-content-generator function:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate content' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
