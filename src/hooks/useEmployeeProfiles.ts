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

export interface DataSourceStats {
  employees: number;
  evaluations: number;
  jobDescriptions: number;
  departments: number;
  positions: number;
  cvUploaded: number;
}

export function useEmployeeProfiles() {
  const { companyId } = useCompanyId();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<WorkforceProfile | null>(null);
  const [dataStats, setDataStats] = useState<DataSourceStats | null>(null);

  const loadDataStats = async () => {
    if (!companyId) return;

    const [employeesRes, evaluationsRes, jobDescriptionsRes, departmentsRes, positionsRes] = await Promise.all([
      supabase.from('company_employees').select('id, full_name, resume_url', { count: 'exact', head: false }).eq('company_id', companyId).eq('status', 'active'),
      supabase.from('performance_evaluations').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
      supabase.from('job_descriptions').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
      supabase.from('departments').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
      supabase.from('positions').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
    ]);

    const cvCount = (evaluationsRes.data || []).length; // approximation from evaluations with resume data

    setDataStats({
      employees: employeesRes.count || 0,
      evaluations: evaluationsRes.count || 0,
      jobDescriptions: jobDescriptionsRes.count || 0,
      departments: departmentsRes.count || 0,
      positions: positionsRes.count || 0,
      cvUploaded: cvCount,
    });
  };

  const runProfiling = async () => {
    if (!companyId) {
      toast.error('Company not found');
      return;
    }

    setLoading(true);
    try {
      // Fetch all data sources in parallel including org chart
      const [employeesRes, evaluationsRes, jobDescriptionsRes, departmentsRes, positionsRes] = await Promise.all([
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
        supabase
          .from('departments')
          .select('*')
          .eq('company_id', companyId),
        supabase
          .from('positions')
          .select('*')
          .eq('company_id', companyId),
      ]);

      const employees = employeesRes.data || [];
      const evaluations = evaluationsRes.data || [];
      const jobDescriptions = jobDescriptionsRes.data || [];
      const departments = departmentsRes.data || [];
      const positions = positionsRes.data || [];

      if (employees.length === 0) {
        toast.error(language === 'fr' ? 'Aucun employé trouvé. Ajoutez des employés d\'abord.' : 'No employees found. Add employees first.');
        setLoading(false);
        return;
      }

      // Build enriched employee data by matching evaluations, positions, and departments
      const enrichedEmployees = employees.map(emp => {
        const evaluation = evaluations.find(
          e => e.employee_name === emp.full_name || e.employee_email === emp.email
        );
        const jd = jobDescriptions.find(
          j => j.department === emp.department && j.title === emp.position
        ) || jobDescriptions.find(j => j.department === emp.department);

        // Find matching position from org chart
        const position = positions.find(
          p => p.current_holder_name === emp.full_name || p.current_holder_email === emp.email
        ) || positions.find(
          p => p.title === emp.position
        );

        // Find department info from org chart
        const dept = departments.find(
          d => d.name === emp.department
        );

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
          orgChartPosition: position ? {
            title: position.title,
            level: position.level,
            isCritical: position.is_critical,
            matchScore: position.match_score,
            skillsCurrent: position.skills_current,
            skillsRequired: position.skills_required,
            upskillPotential: position.upskill_potential,
            reskillCandidate: position.reskill_candidate,
          } : null,
          departmentInfo: dept ? {
            name: dept.name,
            headName: dept.head_employee_name,
            level: dept.level,
            employeeCount: dept.employee_count,
          } : null,
        };
      });

      // Build org chart structure for context
      const orgChartContext = {
        departments: departments.map(d => ({
          name: d.name,
          level: d.level,
          headName: d.head_employee_name,
          employeeCount: d.employee_count,
          parentDepartmentId: d.parent_department_id,
        })),
        positions: positions.map(p => ({
          title: p.title,
          department: departments.find(d => d.id === p.department_id)?.name || 'Unknown',
          level: p.level,
          isCritical: p.is_critical,
          holderName: p.current_holder_name,
          matchScore: p.match_score,
          skillsCurrent: p.skills_current,
          skillsRequired: p.skills_required,
        })),
      };

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
            orgChart: orgChartContext,
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

  return { profile, loading, runProfiling, dataStats, loadDataStats };
}
