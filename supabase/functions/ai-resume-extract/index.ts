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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const { filePath, employeeName } = await req.json();

    if (!filePath) {
      return new Response(JSON.stringify({ error: "filePath is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Download file from storage using service role (private bucket)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("employee-cvs")
      .download(filePath);

    if (downloadError || !fileData) {
      console.error("Download error:", downloadError);
      return new Response(
        JSON.stringify({ error: "Could not download file" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Convert file to base64 for the AI model
    const arrayBuffer = await fileData.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
    );

    const mimeType = filePath.endsWith(".pdf")
      ? "application/pdf"
      : "application/octet-stream";

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
            {
              role: "system",
              content:
                "Tu es un expert RH. Extrais les informations structurées d'un CV/résumé. Réponds TOUJOURS en français.",
            },
            {
              role: "user",
              content: [
                {
                  type: "file",
                  file: {
                    filename: filePath.split("/").pop(),
                    file_data: `data:${mimeType};base64,${base64}`,
                  },
                },
                {
                  type: "text",
                  text: `Extrais les informations suivantes du CV de ${employeeName || "cet employé"}. Sois précis et exhaustif.`,
                },
              ],
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "extract_resume_data",
                description: "Extraire les données structurées du CV",
                parameters: {
                  type: "object",
                  properties: {
                    experience: {
                      type: "string",
                      description:
                        "Résumé de l'expérience professionnelle (postes, entreprises, durées). En français.",
                    },
                    education: {
                      type: "string",
                      description:
                        "Diplômes et formations (établissements, années). En français.",
                    },
                    skills: {
                      type: "array",
                      items: { type: "string" },
                      description:
                        "Liste des compétences techniques et soft skills identifiées.",
                    },
                    certifications: {
                      type: "array",
                      items: { type: "string" },
                      description:
                        "Liste des certifications professionnelles.",
                    },
                  },
                  required: ["experience", "education", "skills", "certifications"],
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "extract_resume_data" },
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);
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
      let extracted;
      try {
        extracted =
          typeof toolCall.function.arguments === "string"
            ? JSON.parse(toolCall.function.arguments)
            : toolCall.function.arguments;
      } catch {
        return new Response(
          JSON.stringify({ error: "Failed to parse AI response" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(JSON.stringify({ extracted }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ error: "No extraction generated" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Resume extract error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
