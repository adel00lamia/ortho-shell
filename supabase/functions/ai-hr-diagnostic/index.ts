import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const requestSchema = z.object({
  locale: z.string().max(10).optional(),
  profile: z.object({
    first_name: z.string().max(120).optional(),
    company: z.string().max(200).optional(),
    sector: z.string().max(120).optional(),
    company_size: z.string().max(60).optional(),
    job_title: z.string().max(200).optional(),
    hr_function: z.string().max(120),
    seniority: z.string().max(60).optional(),
    team_size: z.string().max(60).optional(),
  }),
  answers: z.array(z.object({
    question: z.string().max(500),
    answer: z.string().max(2000),
  })).max(60),
  baseline: z.object({
    dimensions: z.record(z.number()),
    opportunityScore: z.number(),
    profileLabel: z.string().max(120),
    profileLevel: z.string().max(40),
  }),
  catalog: z.object({
    useCases: z.array(z.object({
      id: z.string().max(60),
      title: z.string().max(200),
      description: z.string().max(600),
      humanControl: z.boolean().optional(),
    })).max(60),
    modules: z.array(z.object({
      id: z.string().max(60),
      title: z.string().max(200),
      summary: z.string().max(600),
    })).max(40),
  }),
});

const resultSchema = {
  type: "object",
  properties: {
    dimensions: {
      type: "object",
      description: "Scores 0-100 for each dimension key",
      properties: {
        time: { type: "number" },
        data: { type: "number" },
        automation: { type: "number" },
        ai: { type: "number" },
        governance: { type: "number" },
      },
      required: ["time", "data", "automation", "ai", "governance"],
      additionalProperties: false,
    },
    opportunityScore: { type: "number" },
    profileLabel: {
      type: "string",
      enum: ["Explorateur IA", "Optimisateur RH", "Transformateur IA", "HR AI Leader"],
    },
    profileLevel: { type: "string", enum: ["Foundation", "Practitioner", "Advanced"] },
    profileBlurb: { type: "string" },
    frictions: {
      type: "array",
      items: {
        type: "object",
        properties: { label: { type: "string" }, why: { type: "string" } },
        required: ["label", "why"],
        additionalProperties: false,
      },
    },
    useCases: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          description: { type: "string" },
          impact: { type: "number" },
          ease: { type: "number" },
          humanControl: { type: "boolean" },
        },
        required: ["id", "title", "description", "impact", "ease", "humanControl"],
        additionalProperties: false,
      },
    },
    timeSaving: {
      type: "object",
      properties: { low: { type: "number" }, high: { type: "number" } },
      required: ["low", "high"],
      additionalProperties: false,
    },
    quickWins: { type: "array", items: { type: "string" } },
    governance: { type: "array", items: { type: "string" } },
    modules: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          summary: { type: "string" },
          level: { type: "string", enum: ["Foundation", "Practitioner", "Advanced"] },
          reason: { type: "string" },
        },
        required: ["id", "title", "summary", "level", "reason"],
        additionalProperties: false,
      },
    },
  },
  required: [
    "dimensions", "opportunityScore", "profileLabel", "profileLevel", "profileBlurb",
    "frictions", "useCases", "timeSaving", "quickWins", "governance", "modules",
  ],
  additionalProperties: false,
} as const;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const parsed = requestSchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Invalid input', details: parsed.error.flatten() }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY is not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { profile, answers, baseline, catalog, locale } = parsed.data;
    const lang = locale === 'en' ? 'English' : 'French';

    const systemPrompt = `You are a senior AI × HR transformation consultant working with Moroccan organizations for Qimatak.
You analyse a real HR practitioner's diagnostic answers and produce a personalised AI × HR roadmap.

Rules:
- Write every user-facing string in ${lang}, professional and concrete, no buzzwords.
- Ground EVERY conclusion in the participant's actual answers; quote their own wording where useful.
- Dimension scores (0-100): time = Time & Process Inefficiency, data = Data & Decision Readiness,
  automation = Automation Potential, ai = AI Readiness, governance = Governance & Risk Readiness.
  For time/data/automation a HIGH score means high friction/potential. For ai/governance a HIGH score means high maturity.
- opportunityScore (0-100): high = strong opportunity for AI impact, NOT high maturity.
  Stay within ±12 points of the deterministic baseline unless the answers clearly justify more; explain via profileBlurb.
- frictions: exactly the 3 most costly frictions, each derived from the answers.
- useCases: exactly 5, ranked most valuable first, chosen from the provided catalog when a good fit
  (reuse the catalog id and adapt the title/description to this person's context). If nothing fits,
  invent one with id starting with "custom_". impact and ease are integers 1-5. humanControl = true when
  the output must always be reviewed by a human (legal, disciplinary, pay, hiring decisions).
- timeSaving: indicative hours saved per week (low < high, realistic, 1 decimal max).
- quickWins: exactly 3 actions doable this week without any tool purchase.
- governance: 3 to 5 reminders about what must not be automated without human control, tailored to the role.
- modules: 3 to 5 training modules chosen from the catalog (reuse the id, title and summary), each with a
  recommended level and a one-sentence reason tied to this participant's answers.`;

    const userPrompt = `PARTICIPANT
Role/HR function: ${profile.hr_function}
Job title: ${profile.job_title || 'n/a'}
Sector: ${profile.sector || 'n/a'} | Company size: ${profile.company_size || 'n/a'} | HR team size: ${profile.team_size || 'n/a'}
Seniority: ${profile.seniority || 'n/a'}

ANSWERS
${answers.map((a, i) => `${i + 1}. ${a.question}\n   -> ${a.answer}`).join('\n')}

DETERMINISTIC BASELINE (computed from the same answers by our scoring engine)
${JSON.stringify(baseline)}

USE CASE CATALOG
${catalog.useCases.map((u) => `- ${u.id}: ${u.title} — ${u.description}${u.humanControl ? ' [human control required]' : ''}`).join('\n')}

TRAINING MODULE CATALOG
${catalog.modules.map((m) => `- ${m.id}: ${m.title} — ${m.summary}`).join('\n')}

Produce the personalised diagnostic now.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3.7-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'return_diagnostic',
            description: 'Return the personalised AI × HR diagnostic',
            parameters: resultSchema,
          },
        }],
        tool_choice: { type: 'function', function: { name: 'return_diagnostic' } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      const errorText = await response.text();
      console.error('AI gateway error:', status, errorText);
      const message = status === 429
        ? 'Trop de requêtes. Réessayez dans quelques instants.'
        : status === 402
          ? 'Crédits IA épuisés. Contactez l’administrateur de l’espace.'
          : status === 403
            ? 'Accès à l’IA bloqué par la politique de l’espace de travail.'
            : 'Le moteur IA est momentanément indisponible.';
      return new Response(JSON.stringify({ error: message }), {
        status: status === 429 || status === 402 || status === 403 ? status : 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) {
      console.error('No tool call returned', JSON.stringify(data).slice(0, 800));
      return new Response(JSON.stringify({ error: 'Aucun diagnostic généré.' }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ result: JSON.parse(args) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('ai-hr-diagnostic error:', error);
    return new Response(JSON.stringify({ error: 'Échec de la génération du diagnostic.' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
