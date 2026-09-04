// AI × HR Copilot — coach pédagogique pour les exercices des modules recommandés.
// Accès anonyme par code participant : le code est vérifié côté serveur via portal_participant_id.
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

const requestSchema = z.object({
  code: z.string().min(4).max(40),
  moduleId: z.string().min(1).max(80),
  moduleTitle: z.string().max(200),
  lessonId: z.string().min(1).max(80),
  lessonTitle: z.string().max(200),
  goal: z.string().max(600),
  keyIdea: z.string().max(600).optional(),
  points: z.array(z.string().max(400)).max(8).optional(),
  submission: z.string().min(5).max(4000),
  locale: z.string().max(10).optional(),
  context: z.object({
    hr_function: z.string().max(120).optional(),
    job_title: z.string().max(200).optional(),
    sector: z.string().max(120).optional(),
    company_size: z.string().max(60).optional(),
    top_frictions: z.array(z.string().max(200)).max(5).optional(),
  }).optional(),
});

const feedbackSchema = {
  type: "object",
  properties: {
    verdict: { type: "string", enum: ["solide", "à renforcer", "à revoir"] },
    strengths: { type: "array", items: { type: "string" }, description: "1 to 2 concrete strengths" },
    improvements: { type: "array", items: { type: "string" }, description: "2 to 3 precise improvements" },
    reworked: { type: "string", description: "An improved version of the participant's work, ready to reuse" },
    nextStep: { type: "string", description: "One concrete action to do this week" },
  },
  required: ["verdict", "strengths", "improvements", "reworked", "nextStep"],
  additionalProperties: false,
} as const;

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const parsed = requestSchema.safeParse(await req.json());
    if (!parsed.success) {
      return json({ error: 'Invalid input', details: parsed.error.flatten() }, 400);
    }
    const input = parsed.data;

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!SUPABASE_URL || !SERVICE_KEY) return json({ error: 'Supabase env not configured' }, 500);
    if (!LOVABLE_API_KEY) return json({ error: 'LOVABLE_API_KEY is not configured' }, 500);

    // Vérification du code participant (aucun accès sans code valide).
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: participantId, error: rpcError } = await admin.rpc('portal_participant_id', { _code: input.code });
    if (rpcError) {
      console.error('portal_participant_id failed:', rpcError.message);
      return json({ error: 'Could not verify access code' }, 500);
    }
    if (!participantId) return json({ error: 'Code d’accès invalide' }, 403);

    const lang = input.locale === 'en' ? 'English' : 'French';
    const ctx = input.context ?? {};

    const systemPrompt = `You are a senior AI × HR trainer for QimataQ, coaching HR practitioners in Morocco.
You review one short practical exercise from a Copilot learning module and give teaching feedback.

Rules:
- Write every string in ${lang}, professional, warm and concrete. No buzzwords, no flattery, no markdown.
- Be specific: quote or reuse the participant's own wording instead of generic advice.
- strengths: 1 to 2 items, each one sentence, only if genuinely present.
- improvements: 2 to 3 items, each one actionable sentence explaining WHAT to change and WHY.
- reworked: an improved, ready-to-reuse version of what the participant produced (max 180 words).
  Keep their context and constraints; do not invent facts, figures or legal references.
- nextStep: one concrete action doable this week, tied to their role.
- Never give legal advice. Remind that individual HR decisions stay with a human whenever the exercise touches
  hiring, pay, discipline or performance.
- If the submission is off-topic or too thin, set verdict "à revoir" and explain kindly what is missing.`;

    const userPrompt = `MODULE: ${input.moduleTitle} (${input.moduleId})
LESSON: ${input.lessonTitle} (${input.lessonId})
KEY IDEA: ${input.keyIdea || 'n/a'}
LESSON POINTS:
${(input.points ?? []).map((p) => `- ${p}`).join('\n') || '- n/a'}

WHAT YOU MUST DO WITH THE SUBMISSION:
${input.goal}

PARTICIPANT CONTEXT
HR function: ${ctx.hr_function || 'n/a'} | Job title: ${ctx.job_title || 'n/a'}
Sector: ${ctx.sector || 'n/a'} | Company size: ${ctx.company_size || 'n/a'}
Main frictions from their diagnostic: ${(ctx.top_frictions ?? []).join(' ; ') || 'n/a'}

PARTICIPANT SUBMISSION
"""
${input.submission}
"""

Give your teaching feedback now.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-3.7-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        tools: [{
          type: 'function',
          function: { name: 'submit_feedback', description: 'Return the teaching feedback', parameters: feedbackSchema },
        }],
        tool_choice: { type: 'function', function: { name: 'submit_feedback' } },
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(`AI gateway failed [${response.status}]: ${body}`);
      if (response.status === 429) {
        return json({ error: 'Trop de demandes en même temps. Réessayez dans un instant.' }, 429);
      }
      if (response.status === 402) {
        return json({ error: 'Crédits IA épuisés pour cet espace de travail.' }, 402);
      }
      return json({ error: 'Le coach IA est indisponible', status: response.status, details: body }, response.status);
    }

    const payload = await response.json();
    const call = payload?.choices?.[0]?.message?.tool_calls?.[0];
    const raw = call?.function?.arguments;
    if (!raw) {
      console.error('No tool call in AI response:', JSON.stringify(payload).slice(0, 800));
      return json({ error: 'Réponse IA inexploitable' }, 502);
    }

    let feedback: unknown;
    try {
      feedback = JSON.parse(raw);
    } catch (_e) {
      console.error('Could not parse tool arguments:', String(raw).slice(0, 800));
      return json({ error: 'Réponse IA inexploitable' }, 502);
    }

    return json({ feedback });
  } catch (error) {
    console.error('ai-hr-copilot-coach error:', error instanceof Error ? error.message : String(error));
    return json({ error: 'Erreur inattendue du coach IA' }, 500);
  }
});
