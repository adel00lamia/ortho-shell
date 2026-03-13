const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

    const { employees, jobDescriptions, language = "en" } = await req.json();

    const langInstruction =
      language === "fr"
        ? "\n\nCRITICAL: Tu DOIS écrire TOUT le contenu en français. Seules les clés JSON restent en anglais."
        : "";

    const systemPrompt = `You are an expert HR skills analyst and workforce planner. Analyze employee profiles holistically using all available data sources (CV/resume, years of experience, performance scores, certifications, education) to detect skill levels and match against job requirements.${langInstruction}`;

    const userPrompt = `Analyze the following employees and their associated job descriptions to produce a comprehensive workforce skill profile:

EMPLOYEES:
${JSON.stringify(employees, null, 2)}

JOB DESCRIPTIONS:
${JSON.stringify(jobDescriptions, null, 2)}

For each employee, analyze:
1. CV/Resume data (skills, experience, education, certifications)
2. Years of experience (from hire_date to now)
3. Performance evaluation scores and competency ratings
4. Education level and certifications
5. Current position vs job description requirements

Then produce a department-level rollup showing aggregate gaps and training priorities.`;

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
                name: "provide_workforce_profile",
                description: "Provide structured workforce skill profiles and department rollup",
                parameters: {
                  type: "object",
                  properties: {
                    employeeProfiles: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          employeeName: { type: "string" },
                          detectedLevel: { type: "string", enum: ["junior", "mid", "senior", "lead", "expert"] },
                          overallMatchScore: { type: "number", description: "0-100 match to current JD" },
                          skillLevels: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                skill: { type: "string" },
                                currentLevel: { type: "number", description: "1-5 scale" },
                                requiredLevel: { type: "number", description: "1-5 scale" },
                                source: { type: "string", description: "cv, experience, performance, certification" },
                                confidence: { type: "string", enum: ["high", "medium", "low"] },
                              },
                              required: ["skill", "currentLevel", "requiredLevel", "source", "confidence"],
                            },
                          },
                          strengths: { type: "array", items: { type: "string" } },
                          gaps: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                skill: { type: "string" },
                                gap: { type: "number" },
                                priority: { type: "string", enum: ["critical", "high", "medium", "low"] },
                                suggestedTraining: { type: "string" },
                                estimatedDuration: { type: "string" },
                              },
                              required: ["skill", "gap", "priority", "suggestedTraining"],
                            },
                          },
                          trainingUrgency: { type: "string", enum: ["immediate", "short-term", "medium-term", "long-term"] },
                        },
                        required: ["employeeName", "detectedLevel", "overallMatchScore", "skillLevels", "strengths", "gaps", "trainingUrgency"],
                      },
                    },
                    departmentRollup: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          department: { type: "string" },
                          employeeCount: { type: "number" },
                          avgMatchScore: { type: "number" },
                          criticalGaps: { type: "array", items: { type: "string" } },
                          topTrainingNeeds: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                skill: { type: "string" },
                                affectedEmployees: { type: "number" },
                                avgGap: { type: "number" },
                                recommendedAction: { type: "string" },
                              },
                              required: ["skill", "affectedEmployees", "avgGap", "recommendedAction"],
                            },
                          },
                          overallReadiness: { type: "string", enum: ["ready", "needs-development", "critical-gaps"] },
                        },
                        required: ["department", "employeeCount", "avgMatchScore", "criticalGaps", "topTrainingNeeds", "overallReadiness"],
                      },
                    },
                    summary: { type: "string" },
                    companyWidePriorities: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          priority: { type: "string" },
                          description: { type: "string" },
                          impactedDepartments: { type: "array", items: { type: "string" } },
                          estimatedInvestment: { type: "string" },
                        },
                        required: ["priority", "description"],
                      },
                    },
                  },
                  required: ["employeeProfiles", "departmentRollup", "summary", "companyWidePriorities"],
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "provide_workforce_profile" },
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
          status: response.status === 429 ? 429 : response.status === 402 ? 402 : 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (toolCall?.function?.arguments) {
      let profile;
      try {
        profile =
          typeof toolCall.function.arguments === "string"
            ? JSON.parse(toolCall.function.arguments)
            : toolCall.function.arguments;
      } catch {
        return new Response(
          JSON.stringify({ error: "Failed to parse AI response" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(JSON.stringify({ profile }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ error: "No profile generated" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Employee profiler error:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred during profiling. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
