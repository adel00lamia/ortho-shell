import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyId } from '@/hooks/useCompanyId';
import { REFERENCE_RULES } from '@/lib/ofpptFinancials';
import type { CompanyFactbase } from '@/types/trainingPlan';

/**
 * Collects the company's REAL data (no invented value) to feed the AI plan and
 * the report: headcount, departments, positions, assessed skill levels,
 * training budget, payroll and the CSF reference rates.
 * Anything absent from the database stays absent — the report then prints
 * "À confirmer" instead of a fabricated figure.
 */
export function useCompanyFactbase() {
  const { companyId } = useCompanyId();

  const query = useQuery({
    queryKey: ['company-factbase', companyId],
    enabled: !!companyId,
    staleTime: 1000 * 60 * 5,
    queryFn: async (): Promise<CompanyFactbase> => {
      const [companyRes, employeesRes, positionsRes, skillsRes, employeeSkillsRes, ingenierieRes, plansRes] = await Promise.all([
        supabase.from('companies').select('name, industry, city, company_size, employee_count').eq('id', companyId!).maybeSingle(),
        supabase.from('company_employees').select('department, position').eq('company_id', companyId!).eq('status', 'active'),
        supabase.from('positions').select('title, level, is_critical, current_holder_name').eq('company_id', companyId!),
        supabase.from('skills').select('id, name_fr, max_level').eq('company_id', companyId!),
        supabase.from('employee_skills').select('skill_id, current_level, target_level, employee_name').eq('company_id', companyId!),
        supabase.from('ingenierie_de_formation')
          .select('exercise_year, gross_annual_payroll, tfp_amount, estimated_reimbursement')
          .eq('company_id', companyId!)
          .order('exercise_year', { ascending: false })
          .limit(1),
        supabase.from('training_plans').select('budget, created_at').eq('company_id', companyId!).order('created_at', { ascending: false }).limit(20),
      ]);

      const company = companyRes.data;
      const employees = employeesRes.data || [];
      const positions = positionsRes.data || [];
      const skills = skillsRes.data || [];
      const employeeSkills = employeeSkillsRes.data || [];
      const ingenierie = ingenierieRes.data?.[0];

      // Headcount: prefer the real employee records, fall back to the declared count.
      const recordedHeadcount = employees.length;
      const declaredHeadcount = typeof company?.employee_count === 'number' ? company.employee_count : undefined;
      const headcount = recordedHeadcount > 0 ? recordedHeadcount : declaredHeadcount;
      const headcountSource: CompanyFactbase['headcountSource'] = recordedHeadcount > 0
        ? 'employee_records'
        : declaredHeadcount
          ? 'declared_profile'
          : 'none';

      const countBy = (values: Array<string | null | undefined>) => {
        const counts = new Map<string, number>();
        values.forEach(value => {
          const key = (value || '').trim();
          if (!key) return;
          counts.set(key, (counts.get(key) || 0) + 1);
        });
        return [...counts.entries()]
          .sort((a, b) => b[1] - a[1])
          .map(([name, count]) => ({ name, headcount: count }));
      };

      const departments = countBy(employees.map(e => e.department));
      const employeePositions = countBy(employees.map(e => e.position));
      const criticalTitles = new Set(
        positions.filter(p => p.is_critical && p.title).map(p => (p.title as string).trim()),
      );
      const positionRows = (employeePositions.length
        ? employeePositions
        : countBy(positions.map(p => p.title))
      ).slice(0, 12).map(row => ({
        title: row.name,
        headcount: row.headcount,
        isCritical: criticalTitles.has(row.name) || undefined,
      }));

      // Assessed skill levels — averaged from real assessments only.
      const skillNameById = new Map(skills.map(s => [s.id, { name: s.name_fr as string, maxLevel: s.max_level as number }]));
      const aggregated = new Map<string, { current: number[]; target: number[]; people: Set<string>; maxLevel?: number }>();
      employeeSkills.forEach(row => {
        const meta = skillNameById.get(row.skill_id as string);
        if (!meta) return;
        const entry = aggregated.get(meta.name) || { current: [], target: [], people: new Set<string>(), maxLevel: meta.maxLevel };
        if (typeof row.current_level === 'number') entry.current.push(row.current_level);
        if (typeof row.target_level === 'number') entry.target.push(row.target_level);
        if (row.employee_name) entry.people.add(row.employee_name as string);
        aggregated.set(meta.name, entry);
      });
      const average = (values: number[]) => values.length ? Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 10) / 10 : undefined;
      const skillRows = [...aggregated.entries()]
        .map(([name, entry]) => {
          const currentLevel = average(entry.current);
          const targetLevel = average(entry.target);
          return {
            name,
            currentLevel,
            targetLevel,
            gap: currentLevel !== undefined && targetLevel !== undefined
              ? Math.round((targetLevel - currentLevel) * 10) / 10
              : undefined,
            assessedEmployees: entry.people.size || entry.current.length,
            maxLevel: entry.maxLevel,
          };
        })
        .sort((a, b) => (b.gap ?? -99) - (a.gap ?? -99))
        .slice(0, 15);

      const lastPlanBudget = (plansRes.data || []).find(p => typeof p.budget === 'number' && (p.budget as number) > 0);

      return {
        companyName: company?.name || undefined,
        industry: company?.industry || undefined,
        city: company?.city || undefined,
        companySize: company?.company_size || undefined,
        headcount,
        headcountSource,
        departments,
        positions: positionRows,
        skills: skillRows,
        payroll: typeof ingenierie?.gross_annual_payroll === 'number' && ingenierie.gross_annual_payroll > 0
          ? { grossAnnual: ingenierie.gross_annual_payroll, exerciseYear: ingenierie.exercise_year as number }
          : undefined,
        trainingBudget: typeof ingenierie?.tfp_amount === 'number' && ingenierie.tfp_amount > 0
          ? { amount: ingenierie.tfp_amount, currency: 'MAD', source: 'ingenierie_de_formation' }
          : lastPlanBudget
            ? { amount: lastPlanBudget.budget as number, currency: 'MAD', source: 'training_plan' }
            : undefined,
        csf: {
          plannedRate: REFERENCE_RULES.plannedRate,
          unplannedRate: REFERENCE_RULES.unplannedRate,
          tfpRate: REFERENCE_RULES.tfpRate,
          hourlyCapPerPerson: REFERENCE_RULES.hourlyCapPerPerson,
          tfpAmount: typeof ingenierie?.tfp_amount === 'number' ? ingenierie.tfp_amount : undefined,
          estimatedReimbursement: typeof ingenierie?.estimated_reimbursement === 'number' ? ingenierie.estimated_reimbursement : undefined,
          verified: REFERENCE_RULES.verified,
          source: REFERENCE_RULES.source,
        },
      };
    },
  });

  return { factbase: query.data ?? null, loading: query.isLoading };
}
