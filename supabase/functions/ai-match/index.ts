import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Authenticate the request
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { skills, budget, duration, type } = await req.json();

    console.log('Finding AI matches for user:', user.id, { skills, budget, duration, type });

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
      },
      {
        id: '6',
        title: 'Data Analytics Fundamentals',
        description: 'Learn data analysis, visualization, and business intelligence.',
        trainer: 'Youssef Alami',
        rating: 4.5,
        duration: '45 hours',
        price: 2800,
        category: 'analytics',
        skills: ['data-analysis', 'visualization', 'python', 'business-intelligence'],
        participants: 15,
        location: 'Online',
        type: 'online'
      }
    ];

    const matches = availableCourses
      .map(course => {
        let matchScore = 0;
        const matchReasons: string[] = [];

        const skillMatches = (skills || []).filter((skill: string) => 
          course.skills.some(courseSkill => 
            courseSkill.toLowerCase().includes(skill.toLowerCase()) ||
            skill.toLowerCase().includes(courseSkill.toLowerCase())
          )
        );
        
        if (skillMatches.length > 0) {
          matchScore += (skillMatches.length / Math.max(skills?.length || 1, 1)) * 0.4;
          matchReasons.push(`Matches ${skillMatches.length}/${skills?.length || 0} required skills`);
        }

        if (budget && course.price <= budget * 0.4) {
          matchScore += 0.25;
          matchReasons.push('Within budget range');
        } else if (budget && course.price <= budget * 0.6) {
          matchScore += 0.15;
          matchReasons.push('Slightly above budget but high value');
        }

        matchScore += (course.rating / 5) * 0.15;
        if (course.rating >= 4.5) matchReasons.push('Highly rated course');

        const courseDurationHours = parseInt(course.duration);
        const targetDurationHours = parseInt(duration) || 40;
        const durationDiff = Math.abs(courseDurationHours - targetDurationHours) / targetDurationHours;
        if (durationDiff <= 0.3) {
          matchScore += 0.1;
          matchReasons.push('Ideal duration match');
        }

        if (type === 'any' || course.type === type) {
          matchScore += 0.1;
          matchReasons.push(`${course.type} delivery format`);
        }

        return {
          ...course,
          matchScore: Math.min(matchScore, 0.95),
          matchReason: matchReasons.join(', ') || 'General recommendation'
        };
      })
      .filter(course => course.matchScore > 0.3)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 4);

    console.log(`Found ${matches.length} matching courses for user:`, user.id);

    return new Response(JSON.stringify({ matches }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-match function:', error);
    return new Response(JSON.stringify({ error: 'Failed to find course matches' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
