import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import type { AggregatedSkill, CareerMatch } from '@/hooks/useCareerProfile';

export interface AICareerAnalysis {
  overallMatch: number;
  matchedSkills: Array<{ skill: string; level: string; matchScore: number }>;
  gaps: Array<{
    skill: string;
    requiredLevel: string;
    currentLevel: string;
    priority: 'high' | 'medium' | 'low';
    recommendation: string;
  }>;
  trainingPlan: Array<{
    skill: string;
    action: string;
    duration: string;
    priority: string;
  }>;
  summary: string;
}

interface CoachInput {
  skills: AggregatedSkill[];
  topMatch: CareerMatch | null;
  employeeName: string;
  position: string;
}

export function useAICareerCoach() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [analysis, setAnalysis] = useState<AICareerAnalysis | null>(null);

  const mutation = useMutation({
    mutationFn: async ({ skills, topMatch, employeeName, position }: CoachInput) => {
      if (!user) {
        toast.error(language === 'fr' ? 'Authentification requise' : 'Authentication required');
        throw new Error('Not authenticated');
      }

      const resumeSummary = {
        skills: skills.map(s => s.skillName),
        experience: `Current position: ${position}`,
        education: 'N/A',
        certifications: [],
      };

      const jobCompetencies = topMatch
        ? [...(topMatch.matchedSkills || []), ...(topMatch.missingSkills || [])].map(s => ({
            name: s,
            weight: topMatch.missingSkills?.includes(s) ? 'required' : 'preferred',
          }))
        : skills.map(s => ({ name: s.skillName, weight: 'required' }));

      const competencyScores = skills.map(s => ({
        name: s.skillName,
        current: s.currentLevel,
        target: s.targetLevel,
        category: s.categoryName,
      }));

      const { data, error } = await supabase.functions.invoke('ai-skills-analysis', {
        body: {
          resumeSummary,
          jobCompetencies,
          competencyScores,
          employeeName,
          jobTitle: topMatch?.title || position,
          language,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data.analysis as AICareerAnalysis;
    },
    onSuccess: (data) => {
      setAnalysis(data);
      toast.success(language === 'fr' ? 'Analyse IA terminée' : 'AI analysis complete');
    },
    onError: (e: any) => {
      const msg = e?.message || '';
      if (msg.includes('429') || msg.includes('rate limit')) {
        toast.error(language === 'fr' ? 'Limite atteinte, réessayez plus tard' : 'Rate limited, try again later');
      } else {
        toast.error(language === 'fr' ? 'Erreur lors de l\'analyse IA' : 'AI analysis failed');
      }
    },
  });

  return { analyze: mutation.mutate, isAnalyzing: mutation.isPending, analysis };
}
