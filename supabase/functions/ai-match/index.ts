import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { skills, budget, duration, type } = await req.json();

    console.log('Finding AI matches for:', { skills, budget, duration, type });

    // Mock course database for AI matching
    const availableCourses = [
      {
        id: '1',
        title: 'Advanced Cybersecurity Training',
        description: 'Comprehensive security training covering threat detection, incident response, and security frameworks.',
        trainer: 'Dr. Sarah Johnson',
        rating: 4.8,
        duration: '40 hours',
        price: 2500,
        category: 'cybersecurity',
        skills: ['threat-detection', 'incident-response', 'security-frameworks', 'cybersecurity'],
        participants: 25,
        location: 'Casablanca',
        type: 'hybrid'
      },
      {
        id: '2',
        title: 'Digital Marketing Mastery',
        description: 'Complete digital marketing course including SEO, social media, and analytics.',
        trainer: 'Ahmed Benali',
        rating: 4.6,
        duration: '30 hours',
        price: 1800,
        category: 'marketing',
        skills: ['seo', 'social-media', 'analytics', 'digital-marketing'],
        participants: 30,
        location: 'Online',
        type: 'online'
      },
      {
        id: '3',
        title: 'Project Management Professional',
        description: 'PMP certification preparation with real-world project scenarios.',
        trainer: 'Fatima El Mansouri',
        rating: 4.9,
        duration: '60 hours',
        price: 3200,
        category: 'management',
        skills: ['project-planning', 'risk-management', 'agile', 'management'],
        participants: 20,
        location: 'Rabat',
        type: 'onsite'
      },
      {
        id: '4',
        title: 'Cloud Security Essentials',
        description: 'Essential cloud security practices for AWS, Azure, and Google Cloud.',
        trainer: 'Omar Kadiri',
        rating: 4.7,
        duration: '35 hours',
        price: 2200,
        category: 'cybersecurity',
        skills: ['cloud-security', 'aws', 'azure', 'cybersecurity'],
        participants: 18,
        location: 'Online',
        type: 'online'
      },
      {
        id: '5',
        title: 'Leadership & Team Management',
        description: 'Develop leadership skills and team management capabilities.',
        trainer: 'Aicha Benjelloun',
        rating: 4.8,
        duration: '25 hours',
        price: 1500,
        category: 'management',
        skills: ['leadership', 'team-management', 'communication', 'management'],
        participants: 22,
        location: 'Casablanca',
        type: 'hybrid'
      }
    ];

    const systemPrompt = `You are an AI training consultant that matches courses to user requirements. 
    
    Analyze the user's requirements and available courses to find the best matches based on:
    1. Skills overlap (highest priority)
    2. Budget constraints
    3. Duration preferences
    4. Delivery type preferences
    5. Overall course quality (rating)
    
    Return a JSON response with the top 3 most relevant courses ranked by match score.
    
    IMPORTANT: You must respond with valid JSON in exactly this format:
    {
      "matches": [
        {
          "id": "course_id",
          "title": "course title",
          "description": "course description",
          "trainer": "trainer name",
          "rating": 4.8,
          "duration": "40 hours",
          "price": 2500,
          "category": "category",
          "skills": ["skill1", "skill2"],
          "participants": 25,
          "location": "location",
          "type": "online|onsite|hybrid",
          "matchScore": 0.95,
          "matchReason": "explanation of why this is a good match"
        }
      ]
    }`;

    const userPrompt = `Find the best training courses for these requirements:
    
    Desired Skills: ${skills.join(', ')}
    Budget: ${budget} MAD
    Preferred Duration: ${duration}
    Delivery Type: ${type}
    
    Available Courses:
    ${JSON.stringify(availableCourses, null, 2)}
    
    Return the top 3 matches with match scores and explanations.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('OpenAI response received');

    let aiMatches;
    try {
      aiMatches = JSON.parse(data.choices[0].message.content);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', parseError);
      // Fallback: return filtered courses based on simple matching
      const fallbackMatches = availableCourses
        .filter(course => {
          const skillsMatch = skills.some(skill => 
            course.skills.some(courseSkill => 
              courseSkill.toLowerCase().includes(skill.toLowerCase())
            )
          );
          const budgetMatch = course.price <= budget * 1.2; // 20% budget flexibility
          return skillsMatch && budgetMatch;
        })
        .slice(0, 3)
        .map(course => ({
          ...course,
          matchScore: 0.8,
          matchReason: "Matched based on skills and budget criteria"
        }));

      aiMatches = { matches: fallbackMatches };
    }

    console.log('AI matches generated successfully');

    return new Response(JSON.stringify(aiMatches), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-match function:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to find course matches',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});