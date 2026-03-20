import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

export interface AutoEvaluateResult {
  suggestedRating: number;
  confidence: number;
  competencyScores: Array<{ name: string; score: number; category: string; rationale: string }>;
  strengths: string[];
  areasForImprovement: string[];
  trainingRecommendations: string[];
  summary: string;
}

export interface SmartRecommendation {
  title: string;
  description: string;
  type: 'course' | 'mentoring' | 'project' | 'certification' | 'workshop';
  duration: string;
  priority: 'high' | 'medium' | 'low';
  expectedImpact: string;
  skillsTargeted: string[];
}

export interface SmartRecommendationsResult {
  recommendations: SmartRecommendation[];
  developmentPath: string;
  estimatedTimeToTarget: string;
}

export interface PeerBenchmarkResult {
  percentileRank: number;
  overallComparison: 'above_average' | 'average' | 'below_average';
  strengthsVsPeers: Array<{ skill: string; employeeLevel: string; peerAverage: string; standing: 'ahead' | 'on_par' | 'behind' }>;
  gapsVsPeers: Array<{ skill: string; gap: string; recommendation: string }>;
  insights: string[];
  summary: string;
}

export function useAIPerformanceReview() {
  const { language } = useLanguage();
  const [loading, setLoading] = useState<string | null>(null);

  const invoke = async <T>(action: string, body: Record<string, unknown>): Promise<T | null> => {
    setLoading(action);
    try {
      const { data, error } = await supabase.functions.invoke('ai-performance-review', {
        body: { action, language, ...body },
      });

      if (error) throw error;
      if (data?.error) {
        if (data.error.includes('Rate limit')) throw new Error('rate_limited');
        throw new Error(data.error);
      }
      return data.result as T;
    } catch (err) {
      console.error(`AI ${action} error:`, err);
      throw err;
    } finally {
      setLoading(null);
    }
  };

  const autoEvaluate = (params: {
    employeeName: string;
    department?: string;
    jobTitle?: string;
    resumeSummary?: Record<string, unknown>;
    competencyScores?: Array<{ name: string; score: number; category: string }>;
  }) => invoke<AutoEvaluateResult>('auto_evaluate', params);

  const getSmartRecommendations = (params: {
    employeeName: string;
    department?: string;
    jobTitle?: string;
    competencyScores?: Array<{ name: string; score: number; category: string }>;
    strengths?: string[];
    areasForImprovement?: string[];
  }) => invoke<SmartRecommendationsResult>('smart_recommendations', params);

  const getPeerBenchmark = (params: {
    employeeName: string;
    department?: string;
    competencyScores?: Array<{ name: string; score: number; category: string }>;
    strengths?: string[];
    areasForImprovement?: string[];
    allEvaluations?: unknown[];
  }) => invoke<PeerBenchmarkResult>('peer_benchmark', params);

  return {
    autoEvaluate,
    getSmartRecommendations,
    getPeerBenchmark,
    loading,
  };
}
