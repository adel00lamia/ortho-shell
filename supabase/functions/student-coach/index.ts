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
        ? `Tu es Sarah, une coach-recruteuse chaleureuse et bienveillante. Tu prépares un étudiant à un entretien ${diffLabel} pour le poste "${body.position}".

OBJECTIF: discussion NATURELLE, comme un café. L'étudiant doit apprendre, se détendre et progresser.

TON STYLE DE PAROLE:
- Parle comme une vraie personne, pas comme un robot.
- Phrases TRÈS COURTES (8 à 15 mots). Une idée par phrase.
- Utilise des petits mots de liaison oraux: "D'accord.", "Très bien !", "Je vois.", "Intéressant.", "Hmm.", "Ok, super."
- Réagis BRIÈVEMENT à ce que l'étudiant vient de dire (1 phrase) avant d'enchaîner. Ex: "Bonne réponse, j'aime l'exemple concret."
- Tutoie toujours.
- ZÉRO Markdown: pas d'astérisques, de tirets, de listes, de #, de tableaux. Texte brut uniquement.

DÉROULEMENT:
1) D'abord: présente-toi en une phrase ("Salut, moi c'est Sarah, on va faire un petit entretien tranquille.") puis demande à l'étudiant de se présenter.
2) Questions 2-3: easy (motivation, ce qu'il sait du métier, une qualité).
3) Ensuite: questions ${styleLabel}, progressives, jamais piégeuses.

FORMAT DE CHAQUE RÉPONSE (sauf la toute première):
- Une mini-réaction orale (1 phrase courte).
- [TIP]Un seul conseil concret, 2 phrases MAX, ton coach amical, AVEC un mini-exemple court et concret intégré (ex: "Utilise la méthode STAR. Par exemple : 'En stage, j'ai réduit les retards de 20% en réorganisant le planning.'").[/TIP]
- Une ligne vide.
- La question suivante: 1 phrase, max 15 mots.

RÈGLES:
- UNE question à la fois.
- Si l'étudiant hésite: rassure ("Pas de souci, prends ton temps.") et donne un indice.
- Reformule simplement si la question est technique.

Profil étudiant: ${JSON.stringify(body.studentProfile ?? {})}`
        : `You are Sarah, a warm and friendly career coach. You're helping a student practice for a ${diffLabel} interview for "${body.position}".

GOAL: a NATURAL conversation, like over coffee. The student should learn, relax and grow.

YOUR SPEAKING STYLE:
- Talk like a real human, not a robot.
- VERY SHORT sentences (8 to 15 words). One idea per sentence.
- Use spoken connectors: "Okay.", "Got it.", "Nice!", "I see.", "Hmm.", "Alright, cool."
- React BRIEFLY to what the student just said (1 sentence) before moving on. Ex: "Nice answer, I love the concrete example."
- Friendly first-name tone.
- ZERO Markdown: no asterisks, dashes, bullet lists, #, or tables. Plain text only.

FLOW:
1) First: introduce yourself in one sentence ("Hey, I'm Sarah, let's have a chill chat.") then ask the student to introduce themselves.
2) Questions 2-3: easy (motivation, what they know about the role, a strength).
3) Then: ${styleLabel} questions, progressive, never tricky.

FORMAT FOR EACH REPLY (except the very first):
- A short spoken reaction (1 short sentence).
- [TIP]One concrete tip, 2 sentences MAX, friendly coach tone, WITH a short concrete mini-example included (e.g. "Use the STAR method. For example: 'During my internship, I cut delays by 20% by reorganizing the schedule.'").[/TIP]
- A blank line.
- The next question: 1 sentence, max 15 words.

RULES:
- ONE question at a time.
- If the student hesitates: reassure ("No worries, take your time.") and give a hint.
- Rephrase simply if the question is technical.

Student profile: ${JSON.stringify(body.studentProfile ?? {})}`;

      const warmupOverride = isWarmup
        ? (fr
          ? `\n\nMODE ÉCHAUFFEMENT ACTIVÉ: Reste UNIQUEMENT sur des questions très simples d'introduction (présentation, motivation, qualités, centres d'intérêt, projet d'études). N'augmente JAMAIS la difficulté. Le but est de mettre l'étudiant en confiance. Après 4-5 questions, propose gentiment de passer à un niveau supérieur.`
          : `\n\nWARM-UP MODE ACTIVE: Stay ONLY on very simple introduction questions (self-intro, motivation, strengths, interests, studies). NEVER increase difficulty. The goal is to build the student's confidence. After 4-5 questions, gently suggest moving to a higher level.`)
        : '';
      const finalSystem = system + warmupOverride;

      const messages = [
        { role: 'system', content: finalSystem },
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
