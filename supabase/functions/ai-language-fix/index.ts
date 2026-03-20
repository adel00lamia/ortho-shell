import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { departments, positions, jobDescriptions, targetLanguage } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const langLabel = targetLanguage === "fr" ? "French" : "English";

    const prompt = `You are a translation and language standardization assistant for an HR platform.

The user wants ALL text fields standardized to ${langLabel}.

Below is the current data. For each item, detect the current language. If it's NOT in ${langLabel}, translate it. If it's already in ${langLabel}, keep it as-is. Preserve proper nouns (people's names) unchanged.

Return a JSON object with three arrays:
- "departments": array of { "id": string, "name": string, "description": string | null } — only include items that were changed
- "positions": array of { "id": string, "title": string } — only include items that were changed
- "jobDescriptions": array of { "id": string, "title": string, "department": string | null, "description": string | null } — only include items that were changed

If nothing needs changing for a category, return an empty array.

DATA:
Departments: ${JSON.stringify(departments.map((d: any) => ({ id: d.id, name: d.name, description: d.description })))}

Positions: ${JSON.stringify(positions.map((p: any) => ({ id: p.id, title: p.title })))}

Job Descriptions: ${JSON.stringify(jobDescriptions.map((j: any) => ({ id: j.id, title: j.title, department: j.department, description: j.description })))}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a precise multilingual translator for HR data. Return ONLY valid JSON, no markdown fences." },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_translations",
              description: "Return the translated items that need updating",
              parameters: {
                type: "object",
                properties: {
                  departments: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        name: { type: "string" },
                        description: { type: "string" },
                      },
                      required: ["id", "name"],
                    },
                  },
                  positions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        title: { type: "string" },
                      },
                      required: ["id", "title"],
                    },
                  },
                  jobDescriptions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        title: { type: "string" },
                        department: { type: "string" },
                        description: { type: "string" },
                      },
                      required: ["id", "title"],
                    },
                  },
                },
                required: ["departments", "positions", "jobDescriptions"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_translations" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error: " + response.status);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    let result = { departments: [], positions: [], jobDescriptions: [] };

    if (toolCall?.function?.arguments) {
      result = JSON.parse(toolCall.function.arguments);
    }

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-language-fix error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
