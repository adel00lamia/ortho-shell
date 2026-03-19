import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyId } from './useCompanyId';

export interface CompanyContext {
  company: {
    id: string;
    name: string;
    industry: string | null;
    companySize: string | null;
    employeeCount: number | null;
    city: string | null;
    cnssNumber: string | null;
    rcNumber: string | null;
    iceNumber: string | null;
    contactEmail: string | null;
    domain: string | null;
  } | null;
  employees: { id: string; fullName: string; email: string | null; department: string | null; position: string | null; contractType: string | null; hireDate: string | null }[];
  departments: { id: string; name: string; employeeCount: number; headName: string | null; level: number }[];
  positions: { id: string; title: string; departmentId: string | null; holderName: string | null; isCritical: boolean; matchScore: number | null; level: string | null }[];
  evaluations: { id: string; employeeName: string; overallRating: number | null; department: string | null; strengths: string[] | null; areasForImprovement: string[] | null; trainingRecommendations: string[] | null }[];
  jobDescriptions: { id: string; title: string; department: string | null; level: string | null; requiredSkills: any }[];
  stats: {
    totalEmployees: number;
    totalDepartments: number;
    totalPositions: number;
    totalEvaluations: number;
    totalJDs: number;
    avgRating: number;
    criticalPositions: number;
    skillGaps: string[];
    topTrainingNeeds: string[];
  };
}

async function fetchCompanyContext(companyId: string): Promise<CompanyContext> {
  const [companyRes, employeesRes, deptsRes, positionsRes, evalsRes, jdsRes] = await Promise.all([
    supabase.from('companies').select('*').eq('id', companyId).single(),
    supabase.from('company_employees').select('id, full_name, email, department, position, contract_type, hire_date').eq('company_id', companyId).eq('status', 'active'),
    supabase.from('departments').select('id, name, employee_count, head_employee_name, level').eq('company_id', companyId),
    supabase.from('positions').select('id, title, department_id, current_holder_name, is_critical, match_score, level').eq('company_id', companyId),
    supabase.from('performance_evaluations').select('id, employee_name, overall_rating, department, strengths, areas_for_improvement, training_recommendations').eq('company_id', companyId),
    supabase.from('job_descriptions').select('id, title, department, level, required_skills').eq('company_id', companyId),
  ]);

  const company = companyRes.data;
  const employees = (employeesRes.data || []).map(e => ({
    id: e.id, fullName: e.full_name, email: e.email, department: e.department,
    position: e.position, contractType: e.contract_type, hireDate: e.hire_date,
  }));
  const departments = (deptsRes.data || []).map(d => ({
    id: d.id, name: d.name, employeeCount: d.employee_count, headName: d.head_employee_name, level: d.level,
  }));
  const positions = (positionsRes.data || []).map(p => ({
    id: p.id, title: p.title, departmentId: p.department_id, holderName: p.current_holder_name,
    isCritical: p.is_critical ?? false, matchScore: p.match_score, level: p.level,
  }));
  const evaluations = (evalsRes.data || []).map(e => ({
    id: e.id, employeeName: e.employee_name, overallRating: e.overall_rating,
    department: e.department, strengths: e.strengths, areasForImprovement: e.areas_for_improvement,
    trainingRecommendations: e.training_recommendations,
  }));
  const jobDescriptions = (jdsRes.data || []).map(j => ({
    id: j.id, title: j.title, department: j.department, level: j.level, requiredSkills: j.required_skills,
  }));

  // Compute aggregate stats
  const ratings = evaluations.filter(e => e.overallRating).map(e => e.overallRating!);
  const avgRating = ratings.length > 0 ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10 : 0;
  const criticalPositions = positions.filter(p => p.isCritical).length;

  // Aggregate training needs from evaluations
  const trainingNeedsCounts: Record<string, number> = {};
  evaluations.forEach(e => {
    (e.trainingRecommendations || []).forEach(t => {
      trainingNeedsCounts[t] = (trainingNeedsCounts[t] || 0) + 1;
    });
  });
  const topTrainingNeeds = Object.entries(trainingNeedsCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([skill]) => skill);

  // Aggregate skill gaps from evaluations
  const gapCounts: Record<string, number> = {};
  evaluations.forEach(e => {
    (e.areasForImprovement || []).forEach(g => {
      gapCounts[g] = (gapCounts[g] || 0) + 1;
    });
  });
  const skillGaps = Object.entries(gapCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([gap]) => gap);

  return {
    company: company ? {
      id: company.id, name: company.name, industry: company.industry,
      companySize: company.company_size, employeeCount: company.employee_count,
      city: company.city, cnssNumber: company.cnss_number, rcNumber: company.rc_number,
      iceNumber: company.ice_number, contactEmail: company.contact_email, domain: company.domain,
    } : null,
    employees,
    departments,
    positions,
    evaluations,
    jobDescriptions,
    stats: {
      totalEmployees: employees.length,
      totalDepartments: departments.length,
      totalPositions: positions.length,
      totalEvaluations: evaluations.length,
      totalJDs: jobDescriptions.length,
      avgRating,
      criticalPositions,
      skillGaps,
      topTrainingNeeds,
    },
  };
}

export function useCompanyProfile() {
  const { companyId, loading: companyLoading } = useCompanyId();

  const { data: context = null, isLoading } = useQuery({
    queryKey: ['company-profile-context', companyId],
    queryFn: () => fetchCompanyContext(companyId!),
    enabled: !!companyId,
    staleTime: 1000 * 60 * 5,
  });

  return {
    context,
    loading: companyLoading || isLoading,
    companyId,
  };
}
