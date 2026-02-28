import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://esm.sh/zod@3.23.8';

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

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
  regenerateSection: z.enum(['slides', 'quiz', 'script', 'all']).optional().default('all'),
  existingContent: z.object({
    slides: z.array(z.any()).optional(),
    quiz: z.array(z.any()).optional(),
    script: z.string().optional(),
  }).optional(),
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

    const { title, description, skills, audience, duration, regenerateSection, existingContent } = parsed.data;

    console.log('Generating content for module for user:', userId, { title, regenerateSection });

    let systemPrompt: string;
    let userPrompt: string;

    if (regenerateSection === 'slides') {
      systemPrompt = `You are an expert training content creator. Generate only training slides content.
IMPORTANT: Respond with valid JSON: { "slides": [{ "title": "slide title", "content": "detailed slide content", "type": "text" }] }
Generate 8-12 slides with comprehensive, engaging content. Include different slide types: "text", "video", "exercise", "resource".`;
      userPrompt = `Regenerate slides for training module:\nTitle: ${title}\nDescription: ${description}\nSkills: ${skills.join(', ')}\nDuration: ${duration} hours\nMake content practical and engaging with real-world examples.`;
    } else if (regenerateSection === 'quiz') {
      systemPrompt = `You are an expert assessment designer. Generate quiz questions for a training module.
IMPORTANT: Respond with valid JSON: { "quiz": [{ "question": "question text", "options": ["opt1", "opt2", "opt3", "opt4"], "correct": 0 }] }
Generate 5-8 questions with 4 options each. Mix difficulty levels.`;
      userPrompt = `Regenerate quiz for training module:\nTitle: ${title}\nDescription: ${description}\nSkills: ${skills.join(', ')}\nEnsure questions test practical understanding.`;
    } else if (regenerateSection === 'script') {
      systemPrompt = `You are an expert training facilitator. Generate an instructor script for a training module.
IMPORTANT: Respond with valid JSON: { "script": "complete training script..." }
Include introduction, key talking points, transitions, activities, and conclusion.`;
      userPrompt = `Regenerate instructor script for training module:\nTitle: ${title}\nDescription: ${description}\nSkills: ${skills.join(', ')}\nDuration: ${duration} hours\nMake it conversational and engaging.`;
    } else {
      systemPrompt = `You are an expert training content creator. Generate comprehensive training module content including slides, script, and quiz questions.

IMPORTANT: You must respond with valid JSON in exactly this format:
{
  "content": {
    "slides": [{ "title": "slide title", "content": "detailed slide content", "type": "text" }],
    "script": "complete training script for instructor",
    "quiz": [{ "question": "question text", "options": ["option1", "option2", "option3", "option4"], "correct": 0 }]
  }
}

Generate content for:
- 8-12 slides with comprehensive content (use types: "text", "video", "exercise", "resource")
- A detailed instructor script
- 5-8 quiz questions with 4 options each

Make content engaging, practical, and aligned with the learning objectives.`;
      userPrompt = `Create training module content for:\n\nTitle: ${title}\nDescription: ${description}\nSkills to cover: ${skills.join(', ')}\nTarget audience: ${audience.join(', ')}\nDuration: ${duration} hours\n\nGenerate comprehensive content including slides, instructor script, and assessment quiz.\nEnsure content is practical, engaging, and includes real-world examples.`;
    }

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
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    let generatedContent;
    try {
      let rawContent = data.choices[0].message.content;
      const jsonMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) rawContent = jsonMatch[1].trim();
      generatedContent = JSON.parse(rawContent);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      const rawContent = data.choices[0].message.content;
      if (regenerateSection === 'slides') {
        generatedContent = { slides: [{ title: "Generated Content", content: rawContent, type: "text" }] };
      } else if (regenerateSection === 'quiz') {
        generatedContent = { quiz: [{ question: "What is the main topic?", options: [title, "Other", "N/A", "None"], correct: 0 }] };
      } else if (regenerateSection === 'script') {
        generatedContent = { script: rawContent };
      } else {
        generatedContent = {
          content: {
            slides: [{ title: "Generated Content", content: rawContent, type: "text" }],
            script: rawContent,
            quiz: [{ question: "What is the main topic of this module?", options: [title, "General knowledge", "Other topic", "Not specified"], correct: 0 }]
          }
        };
      }
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
