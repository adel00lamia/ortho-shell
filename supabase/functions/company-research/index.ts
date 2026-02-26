import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { companyName } = await req.json();
    if (!companyName || typeof companyName !== 'string' || companyName.length > 200) {
      return new Response(JSON.stringify({ error: 'Valid company name is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Researching company:', companyName);

    // Step 1: Try to find the company website and branding via Firecrawl
    let branding: any = null;
    let websiteContent: string | null = null;

    if (FIRECRAWL_API_KEY) {
      try {
        // Search for the company website
        const searchResponse = await fetch('https://api.firecrawl.dev/v1/search', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: `${companyName} official website company`,
            limit: 3,
            scrapeOptions: { formats: ['markdown'] },
          }),
        });

        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          const topResult = searchData.data?.[0];

          if (topResult?.url) {
            console.log('Found website:', topResult.url);
            websiteContent = topResult.markdown || topResult.description || '';

            // Try to get branding from the found URL
            try {
              const brandingResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  url: topResult.url,
                  formats: ['branding'],
                  onlyMainContent: true,
                }),
              });

              if (brandingResponse.ok) {
                const brandingData = await brandingResponse.json();
                branding = brandingData.data?.branding || brandingData.branding || null;
                console.log('Branding extracted:', branding ? 'yes' : 'no');
              }
            } catch (e) {
              console.warn('Branding extraction failed:', e);
            }
          }
        }
      } catch (e) {
        console.warn('Firecrawl search failed:', e);
      }
    }

    // Step 2: Use AI to analyze and generate industry insights
    const aiPrompt = `Research and analyze the company "${companyName}".
${websiteContent ? `\nHere is content from their website:\n${websiteContent.slice(0, 3000)}` : ''}

Return a JSON object with this exact structure:
{
  "company": {
    "name": "Official company name",
    "description": "Brief company description (2-3 sentences)",
    "website": "company website URL if known",
    "industry": "Primary industry sector",
    "subIndustry": "Specific sub-sector",
    "companySize": "Estimated size: Startup/Small/Medium/Large/Enterprise",
    "founded": "Year founded if known",
    "headquarters": "Location if known"
  },
  "industryAnalysis": {
    "sector": "Industry sector name",
    "overview": "Brief industry overview (2-3 sentences)",
    "marketSize": "Estimated market size",
    "growthRate": "Industry growth rate",
    "topTrends": ["trend1", "trend2", "trend3", "trend4", "trend5"],
    "keySkills": ["skill1", "skill2", "skill3", "skill4", "skill5", "skill6", "skill7", "skill8"],
    "challenges": ["challenge1", "challenge2", "challenge3"]
  },
  "benchmark": {
    "avgTrainingBudgetPerEmployee": "Amount in MAD",
    "avgTrainingHoursPerYear": "Number of hours",
    "topTrainingAreas": ["area1", "area2", "area3", "area4", "area5"],
    "industryCompletionRate": "Percentage",
    "avgROI": "Percentage or ratio",
    "certificationRate": "Percentage of employees with certifications",
    "digitalLearningAdoption": "Percentage",
    "competitorTrainingFocus": ["focus1", "focus2", "focus3"]
  },
  "recommendations": {
    "suggestedObjectives": ["objective1", "objective2", "objective3"],
    "prioritySkills": ["skill1", "skill2", "skill3", "skill4", "skill5"],
    "suggestedBudget": "Recommended budget range in MAD",
    "suggestedDuration": "Recommended training plan duration in months",
    "deliveryMethods": ["method1", "method2"]
  }
}`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: 'You are a business research analyst and training industry expert. Always respond with valid JSON only. Provide realistic, data-driven insights based on real industry benchmarks.' },
          { role: 'user', content: aiPrompt }
        ],
        temperature: 0.5,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errorText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again shortly.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required. Please add credits.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;
    if (!content) throw new Error('No content in AI response');

    let research;
    try {
      let jsonContent = content;
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) jsonContent = jsonMatch[1].trim();
      research = JSON.parse(jsonContent);
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      throw new Error('Failed to parse research data');
    }

    // Merge branding data
    const result = {
      ...research,
      branding: branding ? {
        logo: branding.logo || branding.images?.logo || null,
        favicon: branding.images?.favicon || null,
        colors: branding.colors || null,
        colorScheme: branding.colorScheme || null,
      } : null,
    };

    console.log('Research complete for:', companyName);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in company-research:', error);
    return new Response(JSON.stringify({ error: 'Failed to research company' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
