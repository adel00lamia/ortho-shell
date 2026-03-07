import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { action, data } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let systemPrompt = "";
    let userPrompt = "";

    if (action === "generate-jd") {
      systemPrompt = `You are an expert HR consultant specializing in job description creation for both Moroccan and international markets. Generate comprehensive, professional job descriptions.`;
      userPrompt = `Generate a detailed job description for the following role:
Title: ${data.title}
Department: ${data.department || "Not specified"}
Level: ${data.level || "mid"}
Industry: ${data.industry || "General"}
Company context: ${data.companyContext || "Not specified"}
Language: ${data.language || "en"}

Return a JSON object with this structure:
{
  "title": "string",
  "description": "string (2-3 sentences)",
  "responsibilities": ["string array, 5-7 items"],
  "technicalSkills": ["string array"],
  "softSkills": ["string array"],
  "competencies": [{"name": "string", "level": number (1-5)}],
  "qualifications": ["string array"],
  "kpis": ["string array, 3-5 measurable KPIs"]
}`;
    } else if (action === "analyze-org") {
      systemPrompt = `You are an expert organizational development consultant. Analyze company structures, identify gaps, and provide actionable recommendations for upskilling and reskilling.`;
      userPrompt = `Analyze the following organizational data and generate a comprehensive assessment:

Company: ${data.companyName || "Unknown"}
Industry: ${data.industry || "General"}
Departments: ${JSON.stringify(data.departments || [])}
Positions: ${JSON.stringify(data.positions || [])}
Job Descriptions: ${JSON.stringify(data.jobDescriptions || [])}
Performance Evaluations: ${JSON.stringify(data.evaluations || [])}

Generate a JSON report with this structure:
{
  "executiveSummary": "string (3-5 sentences)",
  "maturityScore": number (0-100),
  "orgStructureAnalysis": {
    "strengths": ["string array"],
    "weaknesses": ["string array"],
    "recommendations": ["string array"]
  },
  "skillsGapAnalysis": {
    "criticalGaps": [{"skill": "string", "severity": "high|medium|low", "affectedPositions": number, "recommendation": "string"}],
    "overallCoverage": number (0-100)
  },
  "positionPlanning": {
    "openPositions": [{"title": "string", "department": "string", "priority": "high|medium|low", "reason": "string"}],
    "upskillCandidates": [{"currentRole": "string", "targetRole": "string", "matchScore": number, "gapAreas": ["string"], "estimatedTime": "string"}],
    "reskillOpportunities": [{"currentRole": "string", "suggestedRole": "string", "rationale": "string", "trainingNeeded": ["string"]}]
  },
  "suggestedDepartments": [{"name": "string", "description": "string", "headCount": number, "positions": [{"title": "string", "level": "string", "status": "filled|open|planned"}]}],
  "prioritizedActions": [{"action": "string", "priority": "high|medium|low", "impact": "string", "timeline": "string", "estimatedCost": "string"}],
  "swotCompetencies": {
    "strengths": ["string array"],
    "weaknesses": ["string array"],
    "opportunities": ["string array"],
    "threats": ["string array"]
  }
}`;
    } else if (action === "auto-detect-org") {
      systemPrompt = `You are an AI organizational structure analyst. Based on available data (job descriptions, evaluations, employee names), infer and suggest the most likely organizational structure.`;
      userPrompt = `Based on the following data, suggest an organizational structure:

Job Descriptions: ${JSON.stringify(data.jobDescriptions || [])}
Evaluations: ${JSON.stringify(data.evaluations || [])}
Company: ${data.companyName || "Unknown"}
Industry: ${data.industry || "General"}

Return a JSON structure:
{
  "suggestedDepartments": [
    {
      "name": "string",
      "description": "string",
      "level": number,
      "parentDepartment": "string or null",
      "suggestedHead": "string or null",
      "positions": [
        {
          "title": "string",
          "level": "junior|mid|senior|lead|manager|director|vp|c-level",
          "status": "filled|open|planned",
          "currentHolder": "string or null",
          "isCritical": boolean,
          "skills": ["string array"]
        }
      ]
    }
  ],
  "reasoning": "string explaining the analysis",
  "confidence": number (0-100)
}`;
    } else {
      throw new Error(`Unknown action: ${action}`);
    }

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
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content || "";

    // Extract JSON from response
    let parsed;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1].trim());
      } else {
        const directMatch = content.match(/\{[\s\S]*\}/);
        if (directMatch) {
          parsed = JSON.parse(directMatch[0]);
        } else {
          parsed = { raw: content };
        }
      }
    } catch {
      parsed = { raw: content };
    }

    return new Response(JSON.stringify({ result: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-org-assessment error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
