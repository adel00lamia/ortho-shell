import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

export interface SkillLevel {
  skill: string;
  currentLevel: number;
  requiredLevel: number;
  source: string;
  confidence: string;
}

export interface SkillGap {
  skill: string;
  gap: number;
  priority: string;
  suggestedTraining: string;
  estimatedDuration?: string;
}

export interface EmployeeProfile {
  employeeName: string;
  detectedLevel: string;
  overallMatchScore: number;
  skillLevels: SkillLevel[];
  strengths: string[];
  gaps: SkillGap[];
  trainingUrgency: string;
}

export interface DepartmentRollup {
  department: string;
  employeeCount: number;
  avgMatchScore: number;
  criticalGaps: string[];
  topTrainingNeeds: {
    skill: string;
    affectedEmployees: number;
    avgGap: number;
    recommendedAction: string;
  }[];
  overallReadiness: string;
}

export interface CompanyPriority {
  priority: string;
  description: string;
  impactedDepartments?: string[];
  estimatedInvestment?: string;
}

export interface WorkforceProfile {
  employeeProfiles: EmployeeProfile[];
  departmentRollup: DepartmentRollup[];
  summary: string;
  companyWidePriorities: CompanyPriority[];
}

export function useEmployeeProfiles() {
  const { companyId } = useCompanyId();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<WorkforceProfile | null>(null);

  const runProfiling = async () => {
    if (!companyId) {
      toast.error('Company not found');
      return;
    }

    setLoading(true);
    try {
      // Fetch all data sources in parallel
      const [employeesRes, evaluationsRes, jobDescriptionsRes] = await Promise.all([
        supabase
          .from('company_employees')
          .select('*')
          .eq('company_id', companyId)
          .eq('status', 'active'),
        supabase
          .from('performance_evaluations')
          .select('*')
          .eq('company_id', companyId),
        supabase
          .from('job_descriptions')
          .select('*')
          .eq('company_id', companyId),
      ]);

      const employees = employeesRes.data || [];
      const evaluations = evaluationsRes.data || [];
      const jobDescriptions = jobDescriptionsRes.data || [];

      if (employees.length === 0) {
        toast.error(language === 'fr' ? 'Aucun employé trouvé. Ajoutez des employés d\'abord.' : 'No employees found. Add employees first.');
        setLoading(false);
        return;
      }

      // Build enriched employee data by matching evaluations
      const enrichedEmployees = employees.map(emp => {
        const evaluation = evaluations.find(
          e => e.employee_name === emp.full_name || e.employee_email === emp.email
        );
        const jd = jobDescriptions.find(
          j => j.department === emp.department && j.title === emp.position
        ) || jobDescriptions.find(j => j.department === emp.department);

        const yearsOfExperience = emp.hire_date
          ? Math.round((Date.now() - new Date(emp.hire_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000) * 10) / 10
          : null;

        return {
          name: emp.full_name,
          email: emp.email,
          department: emp.department || 'Unassigned',
          position: emp.position || 'N/A',
          contractType: emp.contract_type,
          yearsOfExperience,
          hireDate: emp.hire_date,
          evaluation: evaluation ? {
            overallRating: evaluation.overall_rating,
            competencyScores: evaluation.competency_scores,
            strengths: evaluation.strengths,
            areasForImprovement: evaluation.areas_for_improvement,
            trainingRecommendations: evaluation.training_recommendations,
            resumeSummary: evaluation.resume_summary,
            skillsAnalysis: evaluation.skills_analysis,
          } : null,
          jobDescription: jd ? {
            title: jd.title,
            level: jd.level,
            competencies: jd.competencies,
            requiredSkills: jd.required_skills,
          } : null,
        };
      });

      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'ai-employee-profiler',
        {
          body: {
            employees: enrichedEmployees,
            jobDescriptions: jobDescriptions.map(jd => ({
              title: jd.title,
              department: jd.department,
              level: jd.level,
              competencies: jd.competencies,
              requiredSkills: jd.required_skills,
            })),
            language,
          },
        }
      );

      if (fnError) throw fnError;

      if (fnData?.profile) {
        setProfile(fnData.profile);
        toast.success(
          language === 'fr'
            ? `Profilage terminé pour ${fnData.profile.employeeProfiles?.length || 0} employés`
            : `Profiling complete for ${fnData.profile.employeeProfiles?.length || 0} employees`
        );
      } else {
        throw new Error(fnData?.error || 'No profile returned');
      }
    } catch (err: any) {
      console.error('Profiling error:', err);
      toast.error(err.message || 'Profiling failed');
    } finally {
      setLoading(false);
    }
  };

  return { profile, loading, runProfiling };
}
