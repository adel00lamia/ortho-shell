// Scenario tests for the student-coach interview prompt.
// Verifies that Sarah (the AI HR coach):
//  1. Varies her openers across turns (no robotic repetition).
//  2. Gently corrects vague / off-topic answers.
//  3. Reassures when the student hesitates.
//
// Run with:
//   supabase functions test student-coach --pattern "interview scenarios"
// or via the Lovable test_edge_functions tool.

import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL") ?? Deno.env.get("SUPABASE_URL");
const ANON_KEY =
  Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY");

const FN_URL = `${SUPABASE_URL}/functions/v1/student-coach`;

type Msg = { role: "user" | "assistant"; content: string };

interface Scenario {
  name: string;
  language: "fr" | "en";
  turns: string[]; // user turns, played sequentially
}

const SCENARIOS: Scenario[] = [
  {
    name: "hesitation (fr)",
    language: "fr",
    turns: [
      "Euh... bonjour, je m'appelle Yassine.",
      "Hmm... je ne sais pas trop quoi dire.",
      "Désolé, je bloque un peu.",
    ],
  },
  {
    name: "vague answers (fr)",
    language: "fr",
    turns: [
      "Bonjour, je suis étudiant en informatique.",
      "Je suis motivé et j'aime le travail d'équipe.",
      "J'ai fait des projets, c'était bien.",
      "Mes qualités ? Sérieux, et autre chose aussi.",
    ],
  },
  {
    name: "off-topic (en)",
    language: "en",
    turns: [
      "Hi, I'm Sara, a CS student.",
      "Honestly, I love football. Did you watch the game last night?",
      "Anyway, what's the weather like for you today?",
    ],
  },
];

const FORBIDDEN_OPENERS = [
  /^très bien[.,!\s]/i,
  /^excellent[.,!\s]/i,
  /^super[.,!\s]/i,
  /^génial[.,!\s]/i,
  /^bravo[.,!\s]/i,
  /^great[.,!\s]/i,
  /^awesome[.,!\s]/i,
  /^amazing[.,!\s]/i,
  /^well done[.,!\s]/i,
];

function firstWords(text: string, n = 4): string {
  return text
    .replace(/^[\s"'`*_-]+/, "")
    .split(/\s+/)
    .slice(0, n)
    .join(" ")
    .toLowerCase();
}

async function callTurn(history: Msg[], language: "fr" | "en"): Promise<string> {
  const res = await fetch(FN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ANON_KEY}`,
      apikey: ANON_KEY ?? "",
    },
    body: JSON.stringify({
      mode: "interview",
      position: "Développeur Full-Stack Junior",
      difficulty: "junior",
      style: "mixed",
      language,
      history,
    }),
  });
  const text = await res.text();
  assertEquals(res.status, 200, `HTTP ${res.status}: ${text}`);
  const data = JSON.parse(text);
  return String(data.reply ?? "");
}

async function runScenario(s: Scenario) {
  const history: Msg[] = [];
  const replies: string[] = [];

  // First AI greeting (no user turn yet)
  const greeting = await callTurn(history, s.language);
  history.push({ role: "assistant", content: greeting });
  replies.push(greeting);

  for (const userTurn of s.turns) {
    history.push({ role: "user", content: userTurn });
    const reply = await callTurn(history, s.language);
    history.push({ role: "assistant", content: reply });
    replies.push(reply);
  }

  // --- Assertions ---

  // 1. Forbidden enthusiastic openers used at most once.
  let forbiddenHits = 0;
  for (const reply of replies) {
    if (FORBIDDEN_OPENERS.some((re) => re.test(reply.trim()))) forbiddenHits++;
  }
  assert(
    forbiddenHits <= 1,
    `[${s.name}] Too many enthusiastic openers (${forbiddenHits}):\n${replies.join("\n---\n")}`,
  );

  // 2. No two consecutive replies start with the same 3-word opener.
  for (let i = 1; i < replies.length; i++) {
    const a = firstWords(replies[i - 1], 3);
    const b = firstWords(replies[i], 3);
    assert(
      a !== b,
      `[${s.name}] Repeated opener between turns ${i - 1} and ${i}: "${a}"`,
    );
  }

  // 3. Across all replies, the same 3-word opener should not dominate (>40%).
  const counts = new Map<string, number>();
  for (const r of replies) {
    const k = firstWords(r, 3);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const max = Math.max(...counts.values());
  assert(
    max / replies.length <= 0.4,
    `[${s.name}] One opener dominates (${max}/${replies.length}): ${[...counts.entries()]
      .map(([k, v]) => `${k}=${v}`)
      .join(", ")}`,
  );

  // 4. At least one reply contains a [TIP]...[/TIP] block (gentle correction).
  const hasTip = replies.some((r) => /\[TIP\][\s\S]*\[\/TIP\]/i.test(r));
  assert(hasTip, `[${s.name}] No [TIP] block found across replies — coach is not correcting.`);

  // 5. Replies stay short (target 3-4 sentences). Allow up to 6 sentences as a soft cap.
  for (const r of replies) {
    const sentences = r
      .replace(/\[TIP\][\s\S]*?\[\/TIP\]/gi, " ")
      .split(/(?<=[.!?])\s+/)
      .filter((x) => x.trim().length > 2);
    assert(
      sentences.length <= 6,
      `[${s.name}] Reply too long (${sentences.length} sentences):\n${r}`,
    );
  }

  return { replies, openers: [...counts.entries()] };
}

for (const scenario of SCENARIOS) {
  Deno.test(`interview scenarios — ${scenario.name}`, async () => {
    if (!SUPABASE_URL || !ANON_KEY) {
      console.warn("Skipping: missing SUPABASE env vars");
      return;
    }
    const result = await runScenario(scenario);
    console.log(
      `\n=== ${scenario.name} ===\nOpener distribution:`,
      result.openers,
      "\n",
    );
  });
}
