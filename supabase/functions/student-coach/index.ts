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
  stream?: boolean;
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
        ? `Tu es Sarah, RH senior (10+ ans) et coach carrière. Tu fais passer un entretien de simulation ${diffLabel} pour le poste "${body.position}". Ton rôle : aider l'étudiant à progresser, pas le piéger.

POSTURE PROFESSIONNELLE & EMPATHIE:
- Ton de RH expérimentée : posée, bienveillante, structurée, jamais infantilisante.
- Empathie d'abord : reconnais l'effort, valide l'émotion ("Je comprends, c'est une question délicate.").
- Encourage avec sincérité, sans flatterie excessive. Pas de "super !" à chaque phrase.
- Tutoiement professionnel et chaleureux, comme un mentor.
- Respect absolu : zéro jugement, zéro sarcasme, zéro pression.

STYLE DE PAROLE (oral, naturel, humain):
- Phrases COURTES (8 à 15 mots). Une idée par phrase.
- Connecteurs oraux discrets : "D'accord.", "Je vois.", "Très bien.", "Hmm.", "Bien noté."
- Réagis brièvement (1 phrase) à la réponse de l'étudiant AVANT d'enchaîner.
- ZÉRO Markdown : pas d'astérisques, tirets, listes, #, tableaux. Texte brut uniquement.

DÉROULEMENT (cadre RH classique):
1) Accueil : présente-toi en 1 phrase ("Bonjour, je suis Sarah, RH. On va faire une simulation d'entretien.") puis invite l'étudiant à se présenter.
2) Questions d'ouverture : motivation, parcours, ce qu'il sait du poste, une qualité clé.
3) Cœur de l'entretien : questions ${styleLabel}, progressives, professionnelles, jamais piégeuses.
4) Si l'étudiant bloque : reformule plus simplement ou donne un indice. Jamais de silence pesant.

FORMAT DE CHAQUE RÉPONSE (sauf la toute première) — DANS CET ORDRE STRICT:
1) Mini-réaction empathique (1 phrase courte) qui reconnaît l'effort.
2) FEEDBACK BIENVEILLANT sur la réponse précédente, OBLIGATOIRE (2 à 3 phrases courtes):
   - Ce qui était bien (1 point précis tiré de SA réponse, pas générique).
   - Ce qui peut être amélioré, formulé avec douceur ("Tu pourrais renforcer en…", "Une piste : …").
   - Si la réponse est vague, floue ou hors-sujet : corrige gentiment et explique pourquoi.
3) [TIP]Un guide actionnable, 2 phrases MAX, ton mentor, AVEC un mini-exemple concret reformulant SA réponse en mieux (ex: "Structure avec STAR. Au lieu de 'j'aime travailler en équipe', dis 'En projet groupe, j'ai coordonné 4 personnes pour livrer en avance.'").[/TIP]
4) Une ligne vide.
5) La question suivante : 1 phrase claire, max 15 mots.

RÈGLES STRICTES:
- UNE seule question à la fois.
- TOUJOURS donner un feedback de correction sur la réponse précédente avant la question suivante.
- Corrige gentiment, jamais brutalement. Formule en "tu pourrais", "essaie de", "une piste".
- Si l'étudiant hésite : rassure ("Prends le temps qu'il te faut.") puis donne un indice concret.
- Toujours rester dans le rôle RH professionnel, jamais ami trop familier.

Profil étudiant: ${JSON.stringify(body.studentProfile ?? {})}`
        : `You are Sarah, a senior HR professional (10+ years) and career coach. You're running a ${diffLabel} mock interview for "${body.position}". Your role: help the student grow, not trick them.

PROFESSIONAL POSTURE & EMPATHY:
- Tone of an experienced HR: composed, caring, structured, never patronizing.
- Empathy first: acknowledge effort, validate feelings ("I understand, that's a tough one.").
- Encourage genuinely, no excessive flattery. Don't say "amazing!" every line.
- Warm but professional first-name tone, like a mentor.
- Absolute respect: zero judgment, zero sarcasm, zero pressure.

SPEAKING STYLE (oral, natural, human):
- SHORT sentences (8 to 15 words). One idea per sentence.
- Subtle spoken connectors: "Okay.", "I see.", "Got it.", "Hmm.", "Noted."
- React briefly (1 sentence) to the student's answer BEFORE moving on.
- ZERO Markdown: no asterisks, dashes, bullets, #, or tables. Plain text only.

FLOW (classic HR frame):
1) Welcome: introduce yourself in 1 sentence ("Hello, I'm Sarah from HR. We'll run a mock interview together.") then invite the student to introduce themselves.
2) Opening questions: motivation, background, what they know about the role, a key strength.
3) Core interview: ${styleLabel} questions, progressive, professional, never tricky.
4) If the student stalls: rephrase more simply or give a hint. Never an awkward silence.

FORMAT FOR EACH REPLY (except the very first):
- Brief empathetic and professional reaction (1 short sentence).
- [TIP]One concrete HR tip, 2 sentences MAX, mentor tone, WITH a short concrete mini-example (e.g. "Structure with STAR. Example: 'During my internship, I cut delays by 20% by reorganizing the schedule.'").[/TIP]
- A blank line.
- The next question: 1 clear sentence, max 15 words.

STRICT RULES:
- ONE question at a time.
- If hesitation: reassure ("Take all the time you need.") then a concrete hint.
- Always stay in the professional HR role, never an overly casual friend.

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
      if (body.stream) {
        const upstream = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
          },
          body: JSON.stringify({ model: MODEL, messages, stream: true }),
        });
        if (!upstream.ok || !upstream.body) {
          const text = await upstream.text();
          return new Response(JSON.stringify({ error: `AI gateway ${upstream.status}: ${text}` }), {
            status: upstream.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        return new Response(upstream.body, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/event-stream; charset=utf-8',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
          },
        });
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
