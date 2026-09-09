// Qimatak root-cause diagnostic engine.
// Takes a business problem described by a manager and returns:
// - a cause breakdown across the 7 explicit causes
// - per-cause evidence reasoning (supporting / contradicting / strength)
// - a Training Fit Score computed by THIS code from constrained signals
// - recommended interventions (most of them NOT training)
// - suggested KPIs for the before/after impact loop
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import {
  CAUSE_KEYS,
  computeConfidence,
  computeTrainingFit,
  evidenceCompleteness,
  normalizeCauseBreakdown,
  normalizeCauseEvidence,
  type TrainingFitSignals,
} from '../_shared/rootCause.ts';

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const MODEL = 'google/gemini-3.7-flash';

interface PulseAggregate {
  responses: number;
  audience?: string;
  questions?: Array<{ question: string; agreement?: number | null; answers?: number }>;
  comments?: string[];
}

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
  /** Aggregated Evidence Pulse results for a reassessment. */
  evidence_pulse?: PulseAggregate;
  /** Optional, user-supplied cost assumptions. Nothing is inferred when absent. */
  cost_assumptions?: { training_cost_per_person_mad?: number | null; total_training_budget_mad?: number | null };
  /** Confidence of the diagnosis being reassessed, for context only. */
  previous?: { training_fit_score?: number; ai_confidence?: number; ai_summary?: string };
}

function systemPrompt(lang: 'fr' | 'en') {
  if (lang === 'en') {
    return `You are Qimatak, a senior organisational performance diagnostician for Moroccan companies.

Your core principle: not every performance drop is a training need. Weak results can come from capability, but also from unclear expectations, the process itself, tools and data, management, incentives, or capacity and organisation. You diagnose BEFORE recommending training.

Rules:
- Distribute 100 points across the seven causes: skill (capability), clarity, process, tools_data, management, incentives, capacity_organization.
- Percentages are ESTIMATED HYPOTHESES, not measured truth. Write about them that way.
- For every cause above 10 points, return cause_evidence with the supporting evidence, any contradicting evidence, and a strength.
- Evidence must quote ONLY what the case supplies: the problem text, the symptoms, the KPI values, the declared evidence counts, the Evidence Pulse results. NEVER invent a document, an interview, a person or a figure that was not given.
- You do NOT decide the Training Fit Score. Instead return training_fit_signals; Qimatak computes the score from them.
- Most recommended actions must be NON-training (fix the workflow, coach supervisors, clarify the standard, change the tool, rebalance workload). Add a training action only for the population that genuinely needs it, and say how many people.
- NEVER infer a training cost from any regulatory or reimbursement reference. Do NOT invent a price per hour, a number of training days, or a budget.
- Only return estimated_training_cost_mad / avoided_training_cost_mad when the case explicitly supplies a cost assumption (COST ASSUMPTIONS block). Otherwise return 0 for both; the interface will display "to be costed".
- Always return trainable_headcount (how many people genuinely need training).
- Be concrete and operational. No filler. Never recommend "train everyone".`;
  }
  return `Tu es Qimatak, diagnosticien senior de la performance organisationnelle pour les entreprises marocaines.

Ton principe fondateur : toute baisse de performance n'est pas un besoin de formation. Un manque de résultat peut venir de la compétence, mais aussi d'attentes floues, du processus lui-même, des outils et des données, du management, des incitations, ou de la capacité et de l'organisation. Tu diagnostiques AVANT de recommander une formation.

Règles :
- Répartis 100 points entre les sept causes : skill (compétence), clarity (clarté des attentes), process (processus), tools_data (outils & données), management, incentives (incitations & KPI), capacity_organization (capacité & organisation).
- Les pourcentages sont des HYPOTHÈSES ESTIMÉES, pas une vérité mesurée. Formule-les ainsi.
- Pour chaque cause au-dessus de 10 points, renvoie cause_evidence : preuves à l'appui, preuves contradictoires s'il y en a, et force de la preuve.
- Les preuves doivent citer UNIQUEMENT ce que le dossier fournit : le texte du problème, les symptômes, les valeurs d'indicateurs, les sources de preuve déclarées, les résultats de l'Evidence Pulse. N'invente JAMAIS un document, un entretien, une personne ou un chiffre non fourni.
- Tu ne décides PAS du Training Fit Score. Renvoie training_fit_signals ; Qimatak calcule le score à partir de ces signaux.
- La majorité des actions recommandées doivent être NON formatives (corriger le workflow, coacher les superviseurs, clarifier le standard, changer l'outil, rééquilibrer la charge). N'ajoute une action de formation que pour la population qui en a réellement besoin, en précisant le nombre de personnes.
- N'infère JAMAIS un coût de formation à partir d'une référence réglementaire ou d'un taux de remboursement. N'invente ni prix horaire, ni nombre de jours, ni budget.
- Ne renseigne estimated_training_cost_mad / avoided_training_cost_mad que si le dossier fournit explicitement une hypothèse de coût (bloc COST ASSUMPTIONS). Sinon renvoie 0 pour les deux : l'interface affichera « à chiffrer ».
- Renvoie toujours trainable_headcount (nombre de personnes réellement concernées par une formation).
- Sois concret et opérationnel. Pas de remplissage. Ne recommande jamais « former tout le monde ».`;
}

function userPrompt(b: DiagnoseBody, lang: 'fr' | 'en') {
  const pulse = b.evidence_pulse;
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
    pulse
      ? `EVIDENCE PULSE (field answers collected from ${pulse.audience ?? 'staff'}, ${pulse.responses} responses; agreement is 0-100): ${JSON.stringify(pulse.questions ?? [])}${
          pulse.comments?.length ? `\nFIELD COMMENTS: ${JSON.stringify(pulse.comments.slice(0, 15))}` : ''
        }`
      : '',
    b.cost_assumptions && (b.cost_assumptions.training_cost_per_person_mad || b.cost_assumptions.total_training_budget_mad)
      ? `COST ASSUMPTIONS (supplied by the user, the ONLY basis for any amount): ${JSON.stringify(b.cost_assumptions)}`
      : 'COST ASSUMPTIONS: none supplied — return 0 for every cost field.',
    b.previous
      ? `PREVIOUS ASSESSMENT (for continuity only, re-judge freely): fit=${b.previous.training_fit_score}, confidence=${b.previous.ai_confidence}`
      : '',
  ].filter(Boolean).join('\n');

  const shape = `Return ONLY valid JSON with this exact shape:
{
  "cause_breakdown": { "skill": 0, "clarity": 0, "process": 0, "tools_data": 0, "management": 0, "incentives": 0, "capacity_organization": 0 },
  "cause_evidence": [
    {
      "cause": "skill|clarity|process|tools_data|management|incentives|capacity_organization",
      "supporting": ["evidence taken from the case only"],
      "contradicting": ["evidence that weakens this hypothesis, or empty"],
      "strength": "weak|moderate|strong",
      "confidence": 0
    }
  ],
  "training_fit_signals": {
    "capability_share": 0,
    "demonstrated_skill_gap": 0,
    "barrier_load": 0,
    "high_performers_succeed": true,
    "standards_and_tools_available": true
  },
  "ai_confidence": 0,
  "ai_verdict": "one short sentence: is training the priority or not",
  "ai_summary": "3-5 sentences explaining the likely root cause and what to do first",
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
  "missing_evidence": ["a short, answerable question or data point that would raise confidence"]
}
Notes on training_fit_signals: capability_share, demonstrated_skill_gap and barrier_load are 0-100. Set high_performers_succeed / standards_and_tools_available to null when the case does not say. demonstrated_skill_gap must be low unless the case really shows people do not know how.
Percentages in cause_breakdown must sum to 100. Provide 3 to 6 actions, 2 to 4 kpis and 2 to 5 missing_evidence items. Write all human-readable text in ${lang === 'fr' ? 'French' : 'English'}.`;

  return `${ctx}\n\n${shape}`;
}

function boolOrNull(v: unknown): boolean | null {
  if (v === true || v === 'true' || v === 'yes') return true;
  if (v === false || v === 'false' || v === 'no') return false;
  return null;
}

function normalise(raw: Record<string, unknown>, body: DiagnoseBody) {
  const cause_breakdown = normalizeCauseBreakdown(raw.cause_breakdown);
  const cause_evidence = normalizeCauseEvidence(raw.cause_evidence);

  const rawSignals = (raw.training_fit_signals ?? {}) as Record<string, unknown>;
  const signals: TrainingFitSignals = {
    capability_share: Number(rawSignals.capability_share ?? cause_breakdown.skill),
    demonstrated_skill_gap:
      rawSignals.demonstrated_skill_gap === null || rawSignals.demonstrated_skill_gap === undefined
        ? null
        : Number(rawSignals.demonstrated_skill_gap),
    barrier_load:
      rawSignals.barrier_load === null || rawSignals.barrier_load === undefined
        ? null
        : Number(rawSignals.barrier_load),
    high_performers_succeed: boolOrNull(rawSignals.high_performers_succeed),
    standards_and_tools_available: boolOrNull(rawSignals.standards_and_tools_available),
  };

  // The score is computed here, never taken from the model.
  const fit = computeTrainingFit(signals, cause_breakdown);

  const completeness = evidenceCompleteness({
    problem_description: body.problem_description,
    symptoms: body.symptoms,
    business_kpis: body.business_kpis,
    evidence_sources: body.evidence_sources,
    pulse_responses: body.evidence_pulse?.responses ?? 0,
  });

  return {
    cause_breakdown,
    cause_evidence,
    training_fit_score: fit.score,
    training_fit_explanation: fit.factors,
    training_fit_signals: fit.signals,
    evidence_completeness: completeness,
    ai_confidence: computeConfidence(raw.ai_confidence, completeness),
    ai_verdict: String(raw.ai_verdict ?? '').slice(0, 400),
    ai_summary: String(raw.ai_summary ?? '').slice(0, 2000),
    ...costEstimates(body, Number(raw.trainable_headcount) || 0),
    trainable_headcount: Number(raw.trainable_headcount) || 0,
    actions: Array.isArray(raw.actions) ? raw.actions.slice(0, 8) : [],
    kpis: Array.isArray(raw.kpis) ? raw.kpis.slice(0, 6) : [],
    missing_evidence: Array.isArray(raw.missing_evidence)
      ? raw.missing_evidence.map((m) => String(m ?? '').slice(0, 300)).filter(Boolean).slice(0, 6)
      : [],
    methodology: 'Qimatak Training Fit Score — version pilote',
    cause_model_version: CAUSE_KEYS.length,
  };
}

/**
 * Costs are NEVER inferred from a regulatory reimbursement reference.
 * They exist only when the user supplied a cost assumption.
 */
function costEstimates(body: DiagnoseBody, trainableHeadcount: number) {
  const perPerson = Number(body.cost_assumptions?.training_cost_per_person_mad) || 0;
  const totalBudget = Number(body.cost_assumptions?.total_training_budget_mad) || 0;
  const headcount = Number(body.headcount_affected) || 0;

  let estimated = 0;
  if (perPerson > 0 && headcount > 0) estimated = perPerson * headcount;
  else if (totalBudget > 0) estimated = totalBudget;

  let avoided = 0;
  if (estimated > 0 && headcount > 0 && trainableHeadcount > 0 && trainableHeadcount < headcount) {
    avoided = Math.round((estimated * (headcount - trainableHeadcount)) / headcount);
  }

  return {
    estimated_training_cost_mad: Math.round(estimated),
    avoided_training_cost_mad: avoided,
    cost_basis: estimated > 0 ? 'user_supplied_assumption' : 'none',
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

    return json(normalise(parsed, body));
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Unexpected error' }, 500);
  }
});
