// Qimatak root-cause diagnostic engine.
// Takes a business problem described by a manager and returns:
// - a cause breakdown across skill / process / management / tools / organisation
// - a Training Fit Score (0-100) telling whether training is really the answer
// - recommended interventions (most of them NOT training)
// - suggested KPIs for the before/after impact loop
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const MODEL = 'google/gemini-3.7-flash';

const CAUSE_KEYS = ['skill', 'process', 'management', 'tools', 'organization'] as const;

interface DiagnoseBody {
  problem_description: string;
  title?: string;
  department?: string;
  affected_population?: string;
  headcount_affected?: number;
  symptoms?: string[];
  business_kpis?: Array<{ name?: string; value?: string | number; unit?: string }>;
  evidence_sources?: Record<string, number>;
  company?: { name?: string; industry?: string; employee_count?: number; city?: string };
  language?: 'fr' | 'en';
}

function systemPrompt(lang: 'fr' | 'en') {
  if (lang === 'en') {
    return `You are Qimatak, a senior organisational performance diagnostician for Moroccan companies.

Your core principle: not every performance drop is a training need. A lack of results can come from skills, but also from processes, tools, management, incentives or organisation. You diagnose BEFORE recommending training.

Rules:
- Distribute 100 points across the five causes: skill, process, management, tools, organization.
- training_fit_score (0-100) measures how much TRAINING is the right primary answer. It must be consistent with the skill weight: a low skill weight means a low score.
- Most recommended actions must be NON-training (fix workflow, coach supervisors, update procedure, change tool, clarify roles). Add a training action only for the population that genuinely needs it, and say how many people.
- Costs in MAD. Assume ~40 MAD/hour/person as the OFPPT reimbursable reference and ~2 training days (14h) per person unless the problem says otherwise.
- estimated_training_cost_mad = cost of training the whole affected population.
- avoided_training_cost_mad = what is saved by training only the population that truly needs it.
- Be concrete and operational. No filler. Never recommend "train everyone".`;
  }
  return `Tu es Qimatak, diagnosticien senior de la performance organisationnelle pour les entreprises marocaines.

Ton principe fondateur : toute baisse de performance n'est pas un besoin de formation. Un manque de résultat peut venir de la compétence, mais aussi du processus, des outils, du management, des incitations ou de l'organisation. Tu diagnostiques AVANT de recommander une formation.

Règles :
- Répartis 100 points entre les cinq causes : skill (compétence), process (processus), management, tools (outils), organization (organisation).
- training_fit_score (0-100) mesure à quel point la FORMATION est la bonne réponse prioritaire. Il doit rester cohérent avec le poids de la compétence : un faible poids compétence implique un score faible.
- La majorité des actions recommandées doivent être NON formatives (corriger le workflow, coacher les superviseurs, mettre à jour la procédure, changer l'outil, clarifier les rôles). N'ajoute une action de formation que pour la population qui en a réellement besoin, en précisant le nombre de personnes.
- Coûts en MAD. Référence : ~40 MAD/heure/personne (plafond OFPPT) et ~2 jours (14h) par personne sauf indication contraire.
- estimated_training_cost_mad = coût si l'on formait toute la population concernée.
- avoided_training_cost_mad = économie réalisée en ne formant que la population réellement concernée.
- Sois concret et opérationnel. Pas de remplissage. Ne recommande jamais « former tout le monde ».`;
}

function userPrompt(b: DiagnoseBody, lang: 'fr' | 'en') {
  const ctx = [
    `PROBLEM: ${b.problem_description}`,
    b.title ? `TITLE: ${b.title}` : '',
    b.department ? `DEPARTMENT: ${b.department}` : '',
    b.affected_population ? `POPULATION: ${b.affected_population}` : '',
    b.headcount_affected ? `HEADCOUNT AFFECTED: ${b.headcount_affected}` : '',
    b.symptoms?.length ? `SYMPTOMS: ${b.symptoms.join(', ')}` : '',
    b.business_kpis?.length ? `KPIS: ${JSON.stringify(b.business_kpis)}` : '',
    b.evidence_sources ? `EVIDENCE AVAILABLE: ${JSON.stringify(b.evidence_sources)}` : '',
    b.company ? `COMPANY: ${JSON.stringify(b.company)}` : '',
  ].filter(Boolean).join('\n');

  const shape = `Return ONLY valid JSON with this exact shape:
{
  "cause_breakdown": { "skill": 0, "process": 0, "management": 0, "tools": 0, "organization": 0 },
  "training_fit_score": 0,
  "ai_confidence": 0,
  "ai_verdict": "one short sentence: is training the priority or not",
  "ai_summary": "3-5 sentences explaining the real root cause and what to do first",
  "estimated_training_cost_mad": 0,
  "avoided_training_cost_mad": 0,
  "trainable_headcount": 0,
  "actions": [
    {
      "action_type": "process|management|tools|organization|training",
      "title": "short imperative title",
      "description": "what exactly to do",
      "rationale": "why this addresses the root cause",
      "target_population": "who",
      "headcount": 0,
      "priority": "high|medium|low",
      "effort": "low|medium|high",
      "expected_impact": "measurable expected effect",
      "estimated_cost_mad": 0,
      "is_training": false
    }
  ],
  "kpis": [
    { "kpi_name": "indicator", "unit": "%", "baseline_value": 0, "target_value": 0, "direction": "decrease|increase" }
  ],
  "missing_evidence": ["what data would raise confidence"]
}
Percentages in cause_breakdown must sum to 100. Provide 3 to 6 actions and 2 to 4 kpis. Write all human-readable text in ${lang === 'fr' ? 'French' : 'English'}.`;

  return `${ctx}\n\n${shape}`;
}

function normalise(raw: Record<string, unknown>) {
  const cb = (raw.cause_breakdown ?? {}) as Record<string, number>;
  const clean: Record<string, number> = {};
  let total = 0;
  for (const k of CAUSE_KEYS) {
    const v = Number(cb[k]);
    clean[k] = Number.isFinite(v) && v > 0 ? v : 0;
    total += clean[k];
  }
  if (total <= 0) {
    for (const k of CAUSE_KEYS) clean[k] = 20;
  } else if (Math.abs(total - 100) > 0.5) {
    for (const k of CAUSE_KEYS) clean[k] = Math.round((clean[k] / total) * 100);
  }

  const clamp = (n: unknown, min: number, max: number, fallback: number) => {
    const v = Number(n);
    return Number.isFinite(v) ? Math.min(max, Math.max(min, Math.round(v))) : fallback;
  };

  return {
    cause_breakdown: clean,
    training_fit_score: clamp(raw.training_fit_score, 0, 100, clean.skill),
    ai_confidence: clamp(raw.ai_confidence, 0, 100, 60),
    ai_verdict: String(raw.ai_verdict ?? ''),
    ai_summary: String(raw.ai_summary ?? ''),
    estimated_training_cost_mad: Number(raw.estimated_training_cost_mad) || 0,
    avoided_training_cost_mad: Number(raw.avoided_training_cost_mad) || 0,
    trainable_headcount: Number(raw.trainable_headcount) || 0,
    actions: Array.isArray(raw.actions) ? raw.actions.slice(0, 8) : [],
    kpis: Array.isArray(raw.kpis) ? raw.kpis.slice(0, 6) : [],
    missing_evidence: Array.isArray(raw.missing_evidence) ? raw.missing_evidence.slice(0, 6) : [],
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
    if (!LOVABLE_API_KEY) return json({ error: 'Missing LOVABLE_API_KEY' }, 500);

    // Require a signed-in caller.
    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401);
    const verify = await fetch(`${Deno.env.get('SUPABASE_URL')}/auth/v1/user`, {
      headers: { Authorization: authHeader, apikey: Deno.env.get('SUPABASE_ANON_KEY') ?? '' },
    });
    if (!verify.ok) return json({ error: 'Unauthorized' }, 401);

    const body = (await req.json()) as DiagnoseBody;
    if (!body?.problem_description || body.problem_description.trim().length < 20) {
      return json({ error: 'problem_description must be at least 20 characters' }, 400);
    }
    const lang = body.language === 'en' ? 'en' : 'fr';

    const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Lovable-API-Key': LOVABLE_API_KEY },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt(lang) },
          { role: 'user', content: userPrompt(body, lang) },
        ],
        response_format: { type: 'json_object' },
        stream: true,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return json({ error: `AI gateway ${res.status}: ${text}` }, res.status);
    }

    // Consume the stream inside the function so long generations never time out.
    let buffer = '';
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let pending = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      pending += decoder.decode(value, { stream: true });
      const lines = pending.split('\n');
      pending = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const payload = line.slice(6).trim();
        if (!payload || payload === '[DONE]') continue;
        try {
          const chunk = JSON.parse(payload);
          buffer += chunk?.choices?.[0]?.delta?.content ?? '';
        } catch { /* ignore keep-alive fragments */ }
      }
    }

    const match = buffer.match(/\{[\s\S]*\}/);
    if (!match) return json({ error: 'AI returned no usable JSON' }, 502);

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(match[0]);
    } catch {
      return json({ error: 'AI returned malformed JSON' }, 502);
    }

    return json(normalise(parsed));
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Unexpected error' }, 500);
  }
});
