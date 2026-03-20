const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  action: "auto_evaluate" | "smart_recommendations" | "peer_benchmark";
  employeeName: string;
  department?: string;
  jobTitle?: string;
  resumeSummary?: Record<string, unknown>;
  competencyScores?: Array<{ name: string; score: number; category: string }>;
  strengths?: string[];
  areasForImprovement?: string[];
  // For benchmarking
  allEvaluations?: Array<{
    employee_name: string;
    department?: string;
    overall_rating?: number;
    competency_scores?: unknown;
    strengths?: string[];
    areas_for_improvement?: string[];
  }>;
  language?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: RequestBody = await req.json();
    const { action, language = "en" } = body;

    const langInstruction =
      language === "fr"
        ? "\n\nCRITICAL: Tu DOIS écrire TOUT le contenu en français. Chaque titre, description, recommandation doit être en français. Seules les clés JSON restent en anglais."
        : "";

    let systemPrompt: string;
    let userPrompt: string;
    let toolDef: Record<string, unknown>;

    if (action === "auto_evaluate") {
      systemPrompt = `You are an expert HR performance analyst. Based on the employee's resume/CV and job description data, pre-fill a performance evaluation with suggested ratings and competency scores.${langInstruction}`;
      userPrompt = `Auto-evaluate the following employee:

Employee: ${body.employeeName}
Department: ${body.department || "N/A"}
Job Title: ${body.jobTitle || "N/A"}

Resume/CV Summary:
${JSON.stringify(body.resumeSummary || {}, null, 2)}

Current Competency Scores (if any):
${JSON.stringify(body.competencyScores || [], null, 2)}

Based on their resume and job requirements, suggest:
1. An overall rating (1-5)
2. Updated competency scores
3. Key strengths
4. Areas for improvement
5. Training recommendations`;

      toolDef = {
        name: "auto_evaluate",
        description: "Provide auto-evaluation results",
        parameters: {
          type: "object",
          properties: {
            suggestedRating: { type: "number", description: "Suggested overall rating 1-5" },
            confidence: { type: "number", description: "Confidence in the rating 0-100" },
            competencyScores: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  score: { type: "number" },
                  category: { type: "string" },
                  rationale: { type: "string" },
                },
                required: ["name", "score", "category", "rationale"],
              },
            },
            strengths: { type: "array", items: { type: "string" } },
            areasForImprovement: { type: "array", items: { type: "string" } },
            trainingRecommendations: { type: "array", items: { type: "string" } },
            summary: { type: "string" },
          },
          required: ["suggestedRating", "confidence", "competencyScores", "strengths", "areasForImprovement", "trainingRecommendations", "summary"],
        },
      };
    } else if (action === "smart_recommendations") {
      systemPrompt = `You are an expert learning & development specialist. Based on performance evaluation data, recommend specific, actionable training modules and development activities.${langInstruction}`;
      userPrompt = `Generate smart training recommendations for:

Employee: ${body.employeeName}
Department: ${body.department || "N/A"}
Job Title: ${body.jobTitle || "N/A"}

Current Competency Scores:
${JSON.stringify(body.competencyScores || [], null, 2)}

Strengths: ${JSON.stringify(body.strengths || [])}
Areas for Improvement: ${JSON.stringify(body.areasForImprovement || [])}

Provide specific training recommendations with estimated durations, priorities, and expected impact.`;

      toolDef = {
        name: "smart_recommendations",
        description: "Provide training recommendations",
        parameters: {
          type: "object",
          properties: {
            recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  type: { type: "string", enum: ["course", "mentoring", "project", "certification", "workshop"] },
                  duration: { type: "string" },
                  priority: { type: "string", enum: ["high", "medium", "low"] },
                  expectedImpact: { type: "string" },
                  skillsTargeted: { type: "array", items: { type: "string" } },
                },
                required: ["title", "description", "type", "duration", "priority", "expectedImpact", "skillsTargeted"],
              },
            },
            developmentPath: { type: "string", description: "Overall development path summary" },
            estimatedTimeToTarget: { type: "string" },
          },
          required: ["recommendations", "developmentPath", "estimatedTimeToTarget"],
        },
      };
    } else if (action === "peer_benchmark") {
      systemPrompt = `You are an HR analytics expert. Compare an individual employee's performance against their peers and provide actionable insights.${langInstruction}`;

      const peerData = (body.allEvaluations || []).map((e) => ({
        name: e.employee_name,
        dept: e.department,
        rating: e.overall_rating,
        strengths: e.strengths?.slice(0, 3),
        gaps: e.areas_for_improvement?.slice(0, 3),
      }));

      userPrompt = `Benchmark this employee against peers:

Target Employee: ${body.employeeName}
Department: ${body.department || "N/A"}
Competency Scores: ${JSON.stringify(body.competencyScores || [])}
Strengths: ${JSON.stringify(body.strengths || [])}
Areas for Improvement: ${JSON.stringify(body.areasForImprovement || [])}

Peer Data (${peerData.length} employees):
${JSON.stringify(peerData, null, 2)}

Provide: percentile ranking, strengths vs peers, gaps vs peers, and actionable insights.`;

      toolDef = {
        name: "peer_benchmark",
        description: "Provide peer benchmarking analysis",
        parameters: {
          type: "object",
          properties: {
            percentileRank: { type: "number", description: "Percentile ranking 0-100" },
            overallComparison: { type: "string", enum: ["above_average", "average", "below_average"] },
            strengthsVsPeers: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  skill: { type: "string" },
                  employeeLevel: { type: "string" },
                  peerAverage: { type: "string" },
                  standing: { type: "string", enum: ["ahead", "on_par", "behind"] },
                },
                required: ["skill", "employeeLevel", "peerAverage", "standing"],
              },
            },
            gapsVsPeers: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  skill: { type: "string" },
                  gap: { type: "string" },
                  recommendation: { type: "string" },
                },
                required: ["skill", "gap", "recommendation"],
              },
            },
            insights: { type: "array", items: { type: "string" } },
            summary: { type: "string" },
          },
          required: ["percentileRank", "overallComparison", "strengthsVsPeers", "gapsVsPeers", "insights", "summary"],
        },
      };
    } else {
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          tools: [{ type: "function", function: toolDef }],
          tool_choice: { type: "function", function: { name: toolDef.name } },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI API error:", response.status, errText);
      return new Response(
        JSON.stringify({ error: response.status === 429 ? "Rate limit exceeded" : "AI service error" }),
        {
          status: response.status === 429 ? 429 : response.status === 402 ? 402 : 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (toolCall?.function?.arguments) {
      let result;
      try {
        result =
          typeof toolCall.function.arguments === "string"
            ? JSON.parse(toolCall.function.arguments)
            : toolCall.function.arguments;
      } catch {
        return new Response(JSON.stringify({ error: "Failed to parse AI response" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "No result generated" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Performance review AI error:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred. Please try again." }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
