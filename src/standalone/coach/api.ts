/**
 * Standalone interview-coach API layer.
 * Single point of contact with the backend: change these two constants (or the
 * fetch URL) to move this app to another project — nothing else depends on it.
 */

const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/student-coach`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export type CoachMsg = { role: 'user' | 'assistant'; content: string };

function headers() {
  return {
    'Content-Type': 'application/json',
    apikey: ANON_KEY,
    Authorization: `Bearer ${ANON_KEY}`,
  };
}

async function post<T>(body: Record<string, unknown>): Promise<T> {
  const res = await fetch(FUNCTIONS_URL, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json: any = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* keep raw */ }
  if (!res.ok) throw new Error(json?.error ?? `Erreur ${res.status}`);
  if (json?.error) throw new Error(json.error);
  return json as T;
}

/** Streams one interview turn (SSE) and reports the accumulated text. */
export async function streamInterviewTurn(args: {
  position: string;
  difficulty: 'warmup' | 'junior' | 'mid' | 'senior';
  style: 'behavioral' | 'technical' | 'mixed';
  history: CoachMsg[];
  resumeText?: string;
  companyName?: string;
  sector?: string;
  interviewerRole?: string;
  speakingStyle?: string;
  language: 'fr' | 'en';
  onText: (accumulated: string) => void;
}) {
  const res = await fetch(FUNCTIONS_URL, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      mode: 'interview',
      position: args.position,
      difficulty: args.difficulty,
      style: args.style,
      history: args.history,
      resumeText: args.resumeText || undefined,
      companyName: args.companyName || undefined,
      sector: args.sector || undefined,
      interviewerRole: args.interviewerRole || undefined,
      speakingStyle: args.speakingStyle || undefined,
      language: args.language,
      stream: true,
    }),
  });
  if (!res.ok || !res.body) throw new Error(`Erreur ${res.status}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  let acc = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop() ?? '';
    for (const line of lines) {
      const l = line.trim();
      if (!l.startsWith('data:')) continue;
      const payload = l.slice(5).trim();
      if (!payload || payload === '[DONE]') continue;
      try {
        const json = JSON.parse(payload);
        const delta = json.choices?.[0]?.delta?.content ?? json.choices?.[0]?.message?.content ?? '';
        if (delta) { acc += delta; args.onText(acc); }
      } catch { /* ignore keepalives */ }
    }
  }
  return acc;
}

export type ResumePrep = {
  summary?: string;
  strengths?: string[];
  risks?: string[];
  sectorFocus?: string[];
  askThem?: string[];
  questions?: Array<{
    question: string;
    why?: string;
    keyPoints?: string[];
    modelAnswer?: string;
    personalize?: string;
  }>;
};

export async function prepareFromResume(
  resumeText: string,
  jobTarget: string,
  language: 'fr' | 'en',
  context?: { companyName?: string; sector?: string; interviewerRole?: string; speakingStyle?: string },
) {
  const data = await post<{ prep: ResumePrep & { error?: string } }>({
    mode: 'resumeprep',
    resumeText,
    jobTarget: jobTarget || undefined,
    companyName: context?.companyName || undefined,
    sector: context?.sector || undefined,
    interviewerRole: context?.interviewerRole || undefined,
    speakingStyle: context?.speakingStyle || undefined,
    language,
  });
  if (data.prep?.error) throw new Error(data.prep.error);
  return data.prep;
}

export type GeneratedCv = {
  summary?: string;
  highlights?: string[];
  experiences?: Array<{ title?: string; company?: string; period?: string; bullets?: string[] }>;
  skills?: string[];
  atsKeywords?: string[];
};

export async function generateCv(args: {
  fullName: string;
  email: string;
  phone: string;
  resumeText: string;
  jobTarget: string;
  language: 'fr' | 'en';
}) {
  const data = await post<{ cv: GeneratedCv & { error?: string } }>({
    mode: 'cv',
    studentProfile: { full_name: args.fullName, email: args.email, phone: args.phone },
    resumeText: args.resumeText || undefined,
    jobTarget: args.jobTarget || undefined,
    language: args.language,
  });
  if (data.cv?.error) throw new Error(data.cv.error);
  return data.cv;
}

export type InterviewFeedback = {
  score?: number;
  scores?: Record<string, number>;
  strengths?: string[];
  improvements?: string[];
  modelAnswer?: string;
};

export async function requestFeedback(position: string, history: CoachMsg[], language: 'fr' | 'en') {
  const data = await post<{ feedback: InterviewFeedback & { error?: string } }>({
    mode: 'feedback', position, history, language,
  });
  if (data.feedback?.error) throw new Error(data.feedback.error);
  return data.feedback;
}
