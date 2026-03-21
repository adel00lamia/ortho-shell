import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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

    const {
      resumeSummary,
      jobCompetencies,
      competencyScores,
      employeeName,
      jobTitle,
      language = "en",
    } = await req.json();

    const langInstruction =
      language === "fr"
        ? "\n\nCRITICAL: Tu DOIS écrire TOUT le contenu en français. Chaque titre, description, recommandation doit être en français. Seules les clés JSON restent en anglais."
        : "";

    const systemPrompt = `You are an expert HR skills analyst specializing in competency-based workforce assessment. You produce calibrated, evidence-based gap analyses with actionable training recommendations.

SCORING GUIDELINES:
- "Expert" = industry certifications + 8+ years specialized experience
- "Advanced" = proven track record + 5+ years
- "Intermediate" = working knowledge + 2-5 years  
- "Beginner" = basic understanding, <2 years
- When data is sparse, be conservative and note low confidence
- Match scores should reflect BOTH breadth (how many requirements met) and depth (skill level vs required level)${langInstruction}`;

    const userPrompt = `Analyze the following employee's skills against job requirements and produce a detailed gap analysis:

Employee: ${employeeName}
Job Title: ${jobTitle || "N/A"}

Resume/CV Summary:
- Experience: ${resumeSummary?.experience || "Not provided"}
- Education: ${resumeSummary?.education || "Not provided"}  
- Skills: ${JSON.stringify(resumeSummary?.skills || [])}
- Certifications: ${JSON.stringify(resumeSummary?.certifications || [])}

Job Competencies Required:
${JSON.stringify(jobCompetencies || [], null, 2)}

Current Competency Scores (from performance evaluation):
${JSON.stringify(competencyScores || [], null, 2)}

ANALYSIS INSTRUCTIONS:
1. Cross-reference CV skills with competency scores — if a skill appears in both, confidence is higher
2. For each matched skill, assess current level vs required level using evidence from both sources
3. Identify gaps ordered by priority: critical (blocks core job functions) > high (limits effectiveness) > medium (growth area) > low (nice-to-have)
4. For each gap, recommend specific training: format (online/workshop/mentoring/certification), duration, and expected outcome
5. Produce an overall match percentage that weights critical skills more heavily
6. Write a concise executive summary highlighting top 3 actions to close the most impactful gaps`;

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
          tools: [
            {
              type: "function",
              function: {
                name: "provide_skills_analysis",
                description: "Provide structured skills analysis",
                parameters: {
                  type: "object",
                  properties: {
                    overallMatch: {
                      type: "number",
                      description: "Overall match percentage 0-100",
                    },
                    matchedSkills: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          skill: { type: "string" },
                          level: { type: "string" },
                          matchScore: { type: "number" },
                        },
                      },
                      description: "Skills that match the job requirements",
                    },
                    gaps: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          skill: { type: "string" },
                          requiredLevel: { type: "string" },
                          currentLevel: { type: "string" },
                          priority: { type: "string", enum: ["high", "medium", "low"] },
                          recommendation: { type: "string" },
                        },
                      },
                      description: "Skill gaps identified",
                    },
                    trainingPlan: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          skill: { type: "string" },
                          action: { type: "string" },
                          duration: { type: "string" },
                          priority: { type: "string" },
                        },
                      },
                      description: "Recommended training actions",
                    },
                    summary: {
                      type: "string",
                      description: "Overall summary of the analysis",
                    },
                  },
                  required: [
                    "overallMatch",
                    "matchedSkills",
                    "gaps",
                    "trainingPlan",
                    "summary",
                  ],
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "provide_skills_analysis" },
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", errorText);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        {
          status: response.status === 429 ? 429 : 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (toolCall?.function?.arguments) {
      let analysis;
      try {
        analysis =
          typeof toolCall.function.arguments === "string"
            ? JSON.parse(toolCall.function.arguments)
            : toolCall.function.arguments;
      } catch {
        return new Response(
          JSON.stringify({ error: "Failed to parse AI response" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(JSON.stringify({ analysis }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ error: "No analysis generated" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Skills analysis error:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred during skills analysis. Please try again." }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
