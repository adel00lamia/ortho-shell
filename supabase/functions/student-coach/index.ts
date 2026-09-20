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
  resumeText?: string;
  companyName?: string;
  sector?: string;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  language?: 'en' | 'fr';
  stream?: boolean;
}

interface CvBody {
  mode: 'cv';
  studentProfile: Record<string, unknown>;
  resumeText?: string;
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

interface ResumePrepBody {
  mode: 'resumeprep';
  resumeText: string;
  jobTarget?: string;
  companyName?: string;
  sector?: string;
  language?: 'en' | 'fr';
}

type Body = InterviewBody | CvBody | FeedbackBody | SoftSkillBody | ResumePrepBody;

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

      // --- Humanization layer ---------------------------------------------
      // Each turn rotates: a tone, a micro-quirk, and a sentence-rhythm cue.
      // Combined with a ban list of robotic phrasing, this keeps Sarah alive.
      const TONES_FR = [
        { key: 'curieuse',      desc: "curieuse et engagée — pose un suivi naturel, montre de l'intérêt sincère" },
        { key: 'encourageante', desc: 'chaleureuse et encourageante — valorise un détail concret sans flatterie' },
        { key: 'analytique',    desc: "posée et analytique — reformule brièvement pour montrer que tu as bien écouté" },
        { key: 'directe',       desc: 'directe et professionnelle — va droit au point, ton RH senior' },
        { key: 'complice',      desc: 'légèrement complice — ton détendu, presque conversationnel, sans familiarité' },
        { key: 'rassurante',    desc: "douce et rassurante — abaisse la pression, normalise l'hésitation" },
        { key: 'pragmatique',   desc: 'pragmatique et concrète — ancre la réponse dans un détail terrain' },
        { key: 'pensive',       desc: "légèrement pensive — marque une mini-pause (\"hmm…\", \"alors…\") avant de rebondir" },
      ];
      const TONES_EN = [
        { key: 'curious',     desc: 'curious and engaged — ask a natural follow-up, show genuine interest' },
        { key: 'encouraging', desc: 'warm and encouraging — highlight one concrete detail, no flattery' },
        { key: 'analytical',  desc: 'composed and analytical — briefly paraphrase to show you really listened' },
        { key: 'direct',      desc: 'direct and professional — to the point, senior HR voice' },
        { key: 'easygoing',   desc: 'lightly conversational — relaxed but never casual or familiar' },
        { key: 'reassuring',  desc: 'soft and reassuring — lower the pressure, normalize hesitation' },
        { key: 'pragmatic',   desc: 'pragmatic and concrete — anchor the reply in a small real-world detail' },
        { key: 'thoughtful',  desc: 'slightly thoughtful — a tiny pause ("hmm…", "okay so…") before bouncing back' },
      ];
      const QUIRKS_FR = [
        'glisse une mini-reformulation entre guillemets de ce que vient de dire l\'étudiant ("donc, si je comprends bien, …")',
        'commence par un connecteur oral très court ("Hmm.", "Okay.", "Mmh.") puis enchaîne directement',
        'utilise une comparaison très simple du quotidien (1 image max) pour rendre le feedback concret',
        'pose la question suivante sous forme légèrement ouverte ("Raconte-moi…", "Comment…", "Qu\'est-ce qui…")',
        'rebondis sur UN mot précis qu\'a employé l\'étudiant pour montrer une écoute fine',
        'introduis une variation de rythme : une phrase très courte (3-5 mots), puis une un peu plus longue',
        'remplace toute ouverture par une simple respiration écrite ("Bien.") puis va droit au feedback',
      ];
      const QUIRKS_EN = [
        'slip in a tiny paraphrase in quotes of what the student just said ("so, if I get this right, …")',
        'start with a very short spoken connector ("Hmm.", "Okay.", "Mmh.") then move on directly',
        'use one very simple everyday comparison (1 image max) to make the feedback concrete',
        'phrase the next question in a slightly open way ("Tell me…", "How…", "What made…")',
        'bounce off ONE specific word the student used to show fine listening',
        'vary the rhythm: one very short sentence (3-5 words), then a slightly longer one',
        'replace any opener with a single written breath ("Right.") then go straight to feedback',
      ];
      const tonePool  = fr ? TONES_FR  : TONES_EN;
      const quirkPool = fr ? QUIRKS_FR : QUIRKS_EN;
      const turnIdx = body.history.filter((m) => m.role === 'assistant').length;
      const tone  = tonePool[turnIdx % tonePool.length];
      // Offset the quirk so tone+quirk pairing keeps shifting and never locks.
      const quirk = quirkPool[(turnIdx * 3 + 1) % quirkPool.length];
      const recentOpeners = body.history
        .filter((m) => m.role === 'assistant')
        .slice(-4)
        .map((m) => m.content.trim().split(/\s+/).slice(0, 3).join(' ').toLowerCase());
      const avoidOpeners = recentOpeners.length
        ? (fr
          ? `\n- ÉVITE absolument de recommencer par ces ouvertures déjà utilisées récemment : ${recentOpeners.map((o) => `"${o}"`).join(', ')}.`
          : `\n- AVOID reusing any of these recently used openers: ${recentOpeners.map((o) => `"${o}"`).join(', ')}.`)
        : '';
      const bannedPhrasesFR = '"En tant que coach", "C\'est une excellente question", "Je suis ravie de", "N\'hésite pas à", "Pour conclure", "En somme", "Tout d\'abord", "Premièrement / Deuxièmement", "C\'est noté !" répété, "Wow !", "Incroyable !"';
      const bannedPhrasesEN = '"As a coach", "That\'s a great question", "I\'m delighted to", "Feel free to", "To conclude", "In summary", "First of all", "Firstly / Secondly", repeated "Noted!", "Wow!", "Incredible!"';
      const toneBlock = fr
        ? `\n\nTON DU TOUR ACTUEL (à respecter pour CETTE réponse uniquement, sans jamais le nommer) : ${tone.desc}.${avoidOpeners}\n- QUIRK HUMAIN DE CE TOUR (à appliquer subtilement, sans le nommer) : ${quirk}.\n- PHRASES INTERDITES (sonnent robotiques ou IA) : ${bannedPhrasesFR}. N'utilise JAMAIS ces formulations.\n- RYTHME : alterne phrases courtes et phrases moyennes ; pas deux phrases de même longueur d'affilée.\n- La correction gentille reste OBLIGATOIRE à chaque tour, mais elle passe À TRAVERS ce ton, pas comme un bloc séparé.\n- Au prochain tour tu changeras naturellement de registre ET de quirk ; ne te fige jamais sur une seule couleur.`
        : `\n\nTONE FOR THIS TURN (apply to THIS reply only, never name it): ${tone.desc}.${avoidOpeners}\n- HUMAN QUIRK FOR THIS TURN (apply it subtly, never name it): ${quirk}.\n- BANNED PHRASES (sound robotic or AI-ish): ${bannedPhrasesEN}. NEVER use these.\n- RHYTHM: alternate short and medium sentences; never two same-length sentences in a row.\n- Gentle correction is MANDATORY every turn, but it must flow THROUGH this tone, not as a separate block.\n- On the next turn the register AND the quirk will naturally shift; never lock into a single color.`;

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

FORMAT DE CHAQUE RÉPONSE (sauf la toute première) — TRÈS COURT, NATUREL, ORAL:
1) Réaction + micro-feedback en UNE SEULE phrase courte (max 20 mots), naturelle, qui pointe 1 point précis (positif OU à améliorer, pas les deux).
2) [TIP]1 phrase max, un conseil concret OU un mini-exemple reformulé. Pas les deux.[/TIP]
3) Ligne vide.
4) La question suivante : 1 phrase, max 12 mots.

LONGUEUR TOTALE CIBLE: 3 à 4 phrases. JAMAIS plus. Sois humaine, pas un manuel.

RÈGLES STRICTES:
- UNE seule question à la fois.
- VARIE OBLIGATOIREMENT ton ouverture à chaque tour. Ne réutilise JAMAIS la même formule deux fois de suite.
- Banque d'ouvertures à alterner (et invente-en d'autres) : "D'accord.", "Je vois.", "Hmm, intéressant.", "Bien noté.", "Ok, j'entends.", "Merci pour ce partage.", "C'est clair.", "Parfait.", "Compris.", "Mmh.", une simple reformulation courte ("Donc tu as géré ça en équipe..."), ou même AUCUNE ouverture (entrée directe dans le feedback).
- INTERDIT de commencer par "Très bien" ou "Super" plus d'une fois sur l'ensemble de la conversation.
- Évite les tics : pas de "Excellent !", "Génial !", "Bravo !" répétés.
- Corrige avec douceur quand c'est utile, sinon encourage brièvement.
- Si l'étudiant hésite : rassure en 1 phrase puis donne un indice court.

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

FORMAT FOR EACH REPLY (except the very first) — VERY SHORT, NATURAL, SPOKEN:
1) Reaction + micro-feedback in ONE short sentence (max 20 words), natural, pointing to ONE specific thing (positive OR to improve, not both).
2) [TIP]1 sentence max — a concrete tip OR a tiny rephrased example. Not both.[/TIP]
3) Blank line.
4) The next question: 1 sentence, max 12 words.

TOTAL TARGET LENGTH: 3 to 4 sentences. NEVER more. Be human, not a manual.

STRICT RULES:
- ONE question at a time.
- ALWAYS vary your opener every turn. NEVER reuse the same phrase twice in a row.
- Opener bank to rotate through (and invent more): "Okay.", "I see.", "Hmm, interesting.", "Noted.", "Got it.", "Thanks for sharing.", "Makes sense.", "Right.", "Mmh.", a short paraphrase ("So you handled it as a team..."), or NO opener at all (jump straight into feedback).
- FORBIDDEN to start with "Great" or "Excellent" more than once across the whole conversation.
- Avoid verbal tics: no repeated "Awesome!", "Amazing!", "Well done!".
- Correct gently when useful; otherwise just encourage briefly.
- If the student hesitates: reassure in 1 sentence then give a short hint.

Student profile: ${JSON.stringify(body.studentProfile ?? {})}`;

      const warmupOverride = isWarmup
        ? (fr
          ? `\n\nMODE ÉCHAUFFEMENT ACTIVÉ: Reste UNIQUEMENT sur des questions très simples d'introduction (présentation, motivation, qualités, centres d'intérêt, projet d'études). N'augmente JAMAIS la difficulté. Le but est de mettre l'étudiant en confiance. Après 4-5 questions, propose gentiment de passer à un niveau supérieur.`
          : `\n\nWARM-UP MODE ACTIVE: Stay ONLY on very simple introduction questions (self-intro, motivation, strengths, interests, studies). NEVER increase difficulty. The goal is to build the student's confidence. After 4-5 questions, gently suggest moving to a higher level.`)
        : '';
      const resume = (body.resumeText ?? '').trim().slice(0, 12000);
      const resumeBlock = resume
        ? (fr
          ? `\n\nCV DE L'ÉTUDIANT (seule source de vérité, ne rien inventer) :\n<<<${resume}>>>\n- Base tes questions sur CE CV : expériences, projets, compétences, trous ou changements de parcours.\n- Cite parfois un élément précis du CV ("Sur ton stage chez X…").\n- Ne mentionne JAMAIS une expérience absente du CV.`
          : `\n\nSTUDENT RESUME (sole source of truth, invent nothing):\n<<<${resume}>>>\n- Base your questions on THIS resume: experiences, projects, skills, gaps or career switches.\n- Sometimes quote a precise resume item ("About your internship at X…").\n- NEVER mention an experience that is not in the resume.`)
        : '';
      const company = (body.companyName ?? '').trim().slice(0, 120);
      const sector = (body.sector ?? '').trim().slice(0, 120);
      const targetBlock = (company || sector)
        ? (fr
          ? `\n\nCONTEXTE DE CANDIDATURE :${company ? `\n- Entreprise visée : ${company}` : ''}${sector ? `\n- Secteur : ${sector}` : ''}\n- Pose des questions telles qu'un recruteur de ce secteur les poserait (enjeux métier généraux du secteur).\n- N'invente AUCUN chiffre, client, projet ou actualité de cette entreprise. Si tu n'as pas l'information, reste sur des enjeux généraux du secteur.`
          : `\n\nAPPLICATION CONTEXT:${company ? `\n- Target company: ${company}` : ''}${sector ? `\n- Sector: ${sector}` : ''}\n- Ask questions the way a recruiter in this sector would (general sector stakes).\n- Invent NO figures, clients, projects or news about this company. When unknown, stay on general sector stakes.`)
        : '';
      const finalSystem = system + warmupOverride + resumeBlock + targetBlock + toneBlock;

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
          { role: 'user', content: JSON.stringify({ profile: body.studentProfile, resumeText: (body.resumeText ?? '').slice(0, 12000) }) },
        ],
        true,
      );
      return new Response(JSON.stringify({ cv: safeParseJson(reply) }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (body.mode === 'resumeprep') {
      const resume = (body.resumeText ?? '').trim().slice(0, 12000);
      if (!resume) {
        return new Response(JSON.stringify({ error: fr ? 'CV vide' : 'Empty resume' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const system = fr
        ? `Tu es Sarah, RH senior. À partir du CV fourni, du poste ciblé, de l'entreprise et du secteur (si présents), prépare l'étudiant à son entretien. N'invente AUCUNE expérience du candidat : appuie-toi uniquement sur le CV ; si une information manque, écris "À compléter". Pour l'entreprise et le secteur, reste sur des enjeux généraux et vérifiables du secteur ; n'invente aucun chiffre, client, projet ou actualité de l'entreprise, et formule les questions comme des questions probables d'un recruteur de ce secteur.
Réponds en JSON pur :
{"summary": string (2 phrases sur le profil tel qu'un recruteur de ce secteur le lit),
 "strengths": string[] (3 atouts issus du CV, reliés au poste/secteur si pertinent),
 "risks": string[] (3 points que le recruteur va creuser : trous, changements, manques),
 "sectorFocus": string[] (3 enjeux du secteur/poste à connaître avant l'entretien),
 "askThem": string[] (3 questions pertinentes à poser à l'entreprise),
 "questions": [{"question": string, "why": string (ce que le recruteur évalue, 1 phrase), "keyPoints": string[] (2 ou 3 points à placer), "modelAnswer": string (réponse modèle prête à dire, 1re personne, trame Situation/Tâche/Action/Résultat, 5 à 7 phrases, basée sur le CV), "personalize": string[] (2 éléments à adapter)}] (9 questions : 2 d'introduction, 3 comportementales, 2 techniques ou métier propres au secteur, 1 sur la connaissance de l'entreprise/secteur, 1 sur les motivations)}`
        : `You are Sarah, senior HR. From the resume, the target role, the company and the sector (when provided), prepare the student for the interview. Invent NO candidate experience: rely only on the resume; if information is missing write "To complete". For company and sector, stay on general verifiable sector stakes; invent no figures, clients, projects or company news, and phrase questions as likely questions from a recruiter in that sector.
Respond in pure JSON:
{"summary": string (2 sentences on how a recruiter in this sector reads this profile),
 "strengths": string[] (3 assets from the resume, tied to role/sector when relevant),
 "risks": string[] (3 things the recruiter will dig into: gaps, switches, missing items),
 "sectorFocus": string[] (3 sector/role stakes to know before the interview),
 "askThem": string[] (3 relevant questions to ask the company),
 "questions": [{"question": string, "why": string (what the recruiter assesses, 1 sentence), "keyPoints": string[] (2 or 3 points to land), "modelAnswer": string (ready-to-say model answer, first person, Situation/Task/Action/Result frame, 5 to 7 sentences, based on the resume), "personalize": string[] (2 items to adapt)}] (9 questions: 2 intro, 3 behavioral, 2 sector-specific technical/role, 1 on company/sector knowledge, 1 motivation)}`;

      const reply = await callGemini(
        [
          { role: 'system', content: system },
          {
            role: 'user',
            content: JSON.stringify({
              jobTarget: body.jobTarget ?? '',
              companyName: (body.companyName ?? '').slice(0, 120),
              sector: (body.sector ?? '').slice(0, 120),
              resumeText: resume,
            }),
          },
        ],
        true,
      );
      return new Response(JSON.stringify({ prep: safeParseJson(reply) }), {
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
