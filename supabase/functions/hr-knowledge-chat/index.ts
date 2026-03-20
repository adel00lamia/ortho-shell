import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader || "" } } }
    );

    const { data: { user } } = await supabase.auth.getUser();

    const { question, companyId, language = "en" } = await req.json();

    if (!question || !companyId) {
      return new Response(
        JSON.stringify({ error: "Question and companyId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch relevant knowledge articles from the company
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: articles } = await serviceClient
      .from("hr_knowledge_articles")
      .select("title, content, summary, category, tags")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(30);

    // Simple keyword-based relevance scoring
    const questionLower = question.toLowerCase();
    const questionWords = questionLower.split(/\s+/).filter((w: string) => w.length > 3);

    const scoredArticles = (articles || []).map((a: any) => {
      const text = `${a.title} ${a.content} ${a.summary || ""} ${a.category} ${(a.tags || []).join(" ")}`.toLowerCase();
      let score = 0;
      questionWords.forEach((word: string) => {
        if (text.includes(word)) score += 1;
      });
      return { ...a, relevanceScore: score };
    });

    const relevantArticles = scoredArticles
      .filter((a: any) => a.relevanceScore > 0)
      .sort((a: any, b: any) => b.relevanceScore - a.relevanceScore)
      .slice(0, 5);

    // Build context from articles
    const knowledgeContext = relevantArticles.length > 0
      ? relevantArticles.map((a: any, i: number) =>
          `[Source ${i + 1}: ${a.title}]\nCategory: ${a.category}\n${a.content.substring(0, 2000)}`
        ).join("\n\n---\n\n")
      : "No specific company knowledge articles found. Answer based on general HR expertise.";

    const langInstruction = language === "fr"
      ? "\n\nCRITICAL: Respond entirely in French."
      : "";

    const systemPrompt = `You are an expert HR knowledge assistant for this company. You have access to the company's internal knowledge base of HR articles, policies, skills frameworks, and legal/regulatory documents.

INSTRUCTIONS:
- Answer questions based on the knowledge base content provided below when available
- If the knowledge base contains relevant information, cite the source by mentioning the article title
- If no relevant content is found, provide expert general HR advice and clearly state it's general guidance
- Be concise, actionable, and professional
- For legal/regulatory questions, always recommend consulting with a legal professional for specific situations${langInstruction}

COMPANY KNOWLEDGE BASE:
${knowledgeContext}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content || "I couldn't generate a response.";

    const sources = relevantArticles.map((a: any) => ({
      title: a.title,
      category: a.category,
    }));

    return new Response(
      JSON.stringify({ answer, sources }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("HR Knowledge Chat error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process your question. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
