// Student Coach edge function: handles AI mock-interview turns, CV suggestions,
// post-interview feedback scoring, and soft-skill practice scenarios.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const MODEL = 'google/gemini-3-flash-preview';

interface InterviewBody {
  mode: 'interview';
  position: string;
  difficulty?: 'warmup' | 'junior' | 'mid' | 'senior';
  style?: 'behavioral' | 'technical' | 'mixed';
  studentProfile?: Record<string, unknown>;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  language?: 'en' | 'fr';
}

interface CvBody {
  mode: 'cv';
  studentProfile: Record<string, unknown>;
  jobTarget?: string;
  language?: 'en' | 'fr';
}

interface FeedbackBody {
  mode: 'feedback';
  position: string;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  language?: 'en' | 'fr';
}

interface SoftSkillBody {
  mode: 'softskill';
  skillKey: string;
  skillTitle: string;
  level?: number;
  studentProfile?: Record<string, unknown>;
  language?: 'en' | 'fr';
}

type Body = InterviewBody | CvBody | FeedbackBody | SoftSkillBody;

async function callGemini(messages: Array<{ role: string; content: string }>, expectJson = false) {
  const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      ...(expectJson ? { response_format: { type: 'json_object' } } : {}),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Response(JSON.stringify({ error: `AI gateway ${res.status}: ${text}` }), {
      status: res.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

function safeParseJson(raw: string) {
  try { return JSON.parse(raw); } catch { /* fallthrough */ }
  const match = raw.match(/\{[\s\S]*\}/);
  if (match) { try { return JSON.parse(match[0]); } catch { /* ignore */ } }
  return { error: 'Could not parse AI response', raw };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = (await req.json()) as Body;
    const fr = body.language === 'fr';

    if (body.mode === 'interview') {
      const diff = body.difficulty ?? 'mid';
      const style = body.style ?? 'mixed';
      const isWarmup = diff === 'warmup';
      const diffLabel = fr
        ? { warmup: 'échauffement très doux (présentation et questions ultra simples uniquement)', junior: 'junior (questions accessibles)', mid: 'intermédiaire (exigeant mais juste)', senior: 'senior (exigeant, suivis approfondis)' }[diff]
        : { warmup: 'gentle warm-up (introduction and ultra-simple questions only)', junior: 'junior (entry-level questions)', mid: 'mid-level (challenging but fair)', senior: 'senior (challenging, deep follow-ups)' }[diff];
      const styleLabel = fr
        ? { behavioral: 'comportementales (STAR)', technical: 'techniques (cas pratiques, fondamentaux)', mixed: 'mixtes (comportementales + techniques)' }[style]
        : { behavioral: 'behavioral (STAR)', technical: 'technical (case studies, fundamentals)', mixed: 'mixed (behavioral + technical)' }[style];

      const system = fr
        ? `Tu es un coach-recruteur BIENVEILLANT et PÉDAGOGIQUE qui aide un étudiant à s'entraîner pour un entretien ${diffLabel} pour le poste "${body.position}".

OBJECTIF: l'étudiant doit APPRENDRE de cet entretien, pas être piégé. Sois encourageant.

DÉROULEMENT OBLIGATOIRE:
1) Première question: présentation simple ("Bonjour ! Pour commencer, peux-tu te présenter brièvement : ton parcours, ce qui t'intéresse ?"). Reste chaleureux.
2) Questions 2-3: questions d'introduction faciles (motivation pour le poste, ce que tu connais de ce métier, une qualité dont tu es fier).
3) Ensuite seulement: questions ${styleLabel} progressivement plus engageantes — JAMAIS de questions piège.

RÈGLES:
- UNE seule question à la fois, courte et claire (max 2 phrases).
- Reformule en termes simples si la question est technique.
- Après chaque réponse: 1) un retour positif et constructif (2-3 phrases) qui ENSEIGNE quelque chose (ex: "Bonne réponse ! Astuce: utilise la méthode STAR — Situation, Tâche, Action, Résultat."), 2) puis la question suivante.
- Si la réponse est vide ou hésitante: rassure, donne un indice, et propose de réessayer.
- Vouvoie ou tutoie selon le ton de l'étudiant.

Profil étudiant: ${JSON.stringify(body.studentProfile ?? {})}`
        : `You are a KIND and EDUCATIONAL coach-recruiter helping a student practice for a ${diffLabel} interview for "${body.position}".

GOAL: the student must LEARN from this interview, not be trapped. Be encouraging.

REQUIRED FLOW:
1) First question: simple introduction ("Hi! To start, can you briefly introduce yourself — your background and what interests you?"). Stay warm.
2) Questions 2-3: easy warm-up questions (motivation for the role, what you know about this job, a strength you're proud of).
3) Only then: ${styleLabel} questions, progressively more engaging — NEVER trick questions.

RULES:
- ONE question at a time, short and clear (max 2 sentences).
- Rephrase in simple terms if a question is technical.
- After each answer: 1) positive constructive feedback (2-3 sentences) that TEACHES something (e.g. "Good answer! Tip: use the STAR method — Situation, Task, Action, Result."), 2) then the next question.
- If the answer is empty or hesitant: reassure, give a hint, offer to try again.

Student profile: ${JSON.stringify(body.studentProfile ?? {})}`;

      const messages = [
        { role: 'system', content: system },
        ...body.history.map((m) => ({ role: m.role, content: m.content })),
      ];
      if (body.history.length === 0) {
        messages.push({ role: 'user', content: fr ? "Commence par te présenter chaleureusement et pose ta première question d'introduction." : 'Start by warmly introducing yourself and ask your first introduction question.' });
      }
      const reply = await callGemini(messages);
      return new Response(JSON.stringify({ reply }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (body.mode === 'feedback') {
      const system = fr
        ? `Tu es un coach carrière. Évalue cet entretien pour le poste "${body.position}". Retourne UNIQUEMENT du JSON: {"overallScore": number 0-100, "communication": number 0-10, "technical": number 0-10, "structure": number 0-10, "confidence": number 0-10, "strengths": string[] (3), "improvements": string[] (3 conseils actionnables), "suggestedAnswer": string (exemple de bonne réponse à la dernière question), "verdict": string (1 phrase)}`
        : `You are a career coach. Evaluate this interview for the role "${body.position}". Return ONLY JSON: {"overallScore": number 0-100, "communication": number 0-10, "technical": number 0-10, "structure": number 0-10, "confidence": number 0-10, "strengths": string[] (3), "improvements": string[] (3 actionable tips), "suggestedAnswer": string (model answer to the last question), "verdict": string (1 sentence)}`;
      const transcript = body.history.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');
      const reply = await callGemini(
        [{ role: 'system', content: system }, { role: 'user', content: transcript }],
        true,
      );
      return new Response(JSON.stringify({ feedback: safeParseJson(reply) }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (body.mode === 'softskill') {
      const lvl = body.level ?? 3;
      const system = fr
        ? `Tu es un coach en soft skills. Génère un mini-parcours pour "${body.skillTitle}" adapté au niveau auto-évalué ${lvl}/5. Retourne UNIQUEMENT du JSON: {"overview": string (2 phrases), "lessons": [{"title": string, "summary": string, "duration": string}] (4 leçons), "exercises": string[] (3 exercices pratiques cette semaine), "scenario": {"context": string, "challenge": string, "tips": string[]} (mise en situation réaliste pour un étudiant marocain), "resources": [{"title": string, "type": "video"|"article"|"book"}] (3)}`
        : `You are a soft-skills coach. Build a mini-track for "${body.skillTitle}" tuned to self-rated level ${lvl}/5. Return ONLY JSON: {"overview": string (2 sentences), "lessons": [{"title": string, "summary": string, "duration": string}] (4 lessons), "exercises": string[] (3 actionable practice exercises this week), "scenario": {"context": string, "challenge": string, "tips": string[]} (realistic scenario for a Moroccan student), "resources": [{"title": string, "type": "video"|"article"|"book"}] (3)}`;
      const reply = await callGemini(
        [
          { role: 'system', content: system },
          { role: 'user', content: JSON.stringify({ profile: body.studentProfile ?? {}, skill: body.skillKey }) },
        ],
        true,
      );
      return new Response(JSON.stringify({ track: safeParseJson(reply) }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (body.mode === 'cv') {
      const system = fr
        ? `Tu es un coach carrière. Génère un CV structuré JSON pour ce candidat${body.jobTarget ? ` ciblant le poste "${body.jobTarget}"` : ''}. Format: {"summary": string (3 phrases), "highlights": string[] (5 points forts), "experiences": [{title,company,period,bullets:string[]}], "skills": string[], "atsKeywords": string[] (8 mots-clés ATS pertinents), "improvements": string[] (3 conseils pour améliorer le CV)}. Réponds en JSON pur.`
        : `You are a career coach. Generate a structured JSON resume for this candidate${body.jobTarget ? ` targeting the role "${body.jobTarget}"` : ''}. Format: {"summary": string (3 sentences), "highlights": string[] (5 key strengths), "experiences": [{title,company,period,bullets:string[]}], "skills": string[], "atsKeywords": string[] (8 relevant ATS keywords), "improvements": string[] (3 tips to improve)}. Respond in pure JSON.`;

      const reply = await callGemini(
        [
          { role: 'system', content: system },
          { role: 'user', content: JSON.stringify(body.studentProfile) },
        ],
        true,
      );
      return new Response(JSON.stringify({ cv: safeParseJson(reply) }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown mode' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
