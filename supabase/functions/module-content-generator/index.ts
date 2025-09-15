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
    const { title, description, skills, audience, duration } = await req.json();

    console.log('Generating content for module:', { title, description, skills, audience, duration });

    const systemPrompt = `You are an expert training content creator. Generate comprehensive training module content including slides, script, and quiz questions.

IMPORTANT: You must respond with valid JSON in exactly this format:
{
  "content": {
    "slides": [
      {
        "title": "slide title",
        "content": "detailed slide content with key points, examples, and explanations"
      }
    ],
    "script": "complete training script for instructor",
    "quiz": [
      {
        "question": "question text",
        "options": ["option1", "option2", "option3", "option4"],
        "correct": 0
      }
    ]
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
    console.log('OpenAI response received');

    let generatedContent;
    try {
      generatedContent = JSON.parse(data.choices[0].message.content);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', parseError);
      // Fallback: create structured content from the raw response
      const rawContent = data.choices[0].message.content;
      generatedContent = {
        content: {
          slides: [
            {
              title: "Generated Content",
              content: rawContent
            }
          ],
          script: rawContent,
          quiz: [
            {
              question: "What is the main topic of this module?",
              options: [title, "General knowledge", "Other topic", "Not specified"],
              correct: 0
            }
          ]
        }
      };
    }

    console.log('Content generated successfully');

    return new Response(JSON.stringify(generatedContent), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in module-content-generator function:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to generate content',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});