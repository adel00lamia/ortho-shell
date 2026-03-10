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

    const { filePath, documentType } = await req.json();

    if (!filePath) {
      return new Response(JSON.stringify({ error: "filePath is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    const arrayBuffer = await fileData.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
    );

    const mimeType = filePath.endsWith(".pdf")
      ? "application/pdf"
      : filePath.endsWith(".png")
      ? "image/png"
      : filePath.endsWith(".jpg") || filePath.endsWith(".jpeg")
      ? "image/jpeg"
      : "application/octet-stream";

    const docTypeLabels: Record<string, string> = {
      cnss: "CNSS (attestation d'affiliation, bordereau de déclaration)",
      rc: "Registre de Commerce (extrait RC, certificat d'immatriculation)",
      ice: "ICE (attestation d'Identifiant Commun de l'Entreprise)",
      patente: "Patente (taxe professionnelle, attestation fiscale)",
    };
    const docLabel = docTypeLabels[documentType || "cnss"] || "document légal marocain";

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
              content: `Tu es un expert en documents administratifs marocains. Extrais les informations d'un document de type ${docLabel}. Sois précis et retourne uniquement les données trouvées dans le document.`,
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
                  text: "Extrais toutes les informations de ce document CNSS. Identifie le numéro CNSS, la raison sociale, l'adresse, la ville, le secteur d'activité, l'effectif, le numéro ICE, le numéro RC, le téléphone, l'email, et tout autre identifiant légal présent.",
                },
              ],
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "extract_cnss_data",
                description: "Extraire les données structurées du document CNSS",
                parameters: {
                  type: "object",
                  properties: {
                    cnss_number: {
                      type: "string",
                      description: "Numéro d'affiliation CNSS",
                    },
                    company_name: {
                      type: "string",
                      description: "Raison sociale de l'entreprise",
                    },
                    ice_number: {
                      type: "string",
                      description: "Identifiant Commun de l'Entreprise (ICE)",
                    },
                    rc_number: {
                      type: "string",
                      description: "Numéro du Registre de Commerce (RC)",
                    },
                    address: {
                      type: "string",
                      description: "Adresse du siège social",
                    },
                    city: {
                      type: "string",
                      description: "Ville",
                    },
                    phone: {
                      type: "string",
                      description: "Numéro de téléphone",
                    },
                    email: {
                      type: "string",
                      description: "Email de contact",
                    },
                    industry: {
                      type: "string",
                      description: "Secteur d'activité",
                    },
                    employee_count: {
                      type: "number",
                      description: "Nombre de salariés déclarés",
                    },
                  },
                  required: ["cnss_number"],
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "extract_cnss_data" },
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
    console.error("CNSS extract error:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred during CNSS extraction." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
