import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyId } from '@/hooks/useCompanyId';

const db = supabase as unknown as { from: (table: string) => any };

export type TransformationPosition = {
  id: string;
  title: string;
  is_critical: boolean | null;
  skills_required: unknown;
  department_id: string | null;
  reports_to_position_id: string | null;
};
export type TransformationDepartment = { id: string; name: string; parent_department_id: string | null; level: number };

export function useTransformationContext() {
  const { companyId } = useCompanyId();
  return useQuery({
    queryKey: ['transformation-context', companyId],
    enabled: Boolean(companyId),
    queryFn: async () => {
      if (!companyId) return { positions: [] as TransformationPosition[], skillNames: [] as string[], departments: [] as TransformationDepartment[] };
      const [positionResult, skillResult, deptResult] = await Promise.all([
        db.from('positions').select('id,title,is_critical,skills_required,department_id,reports_to_position_id').eq('company_id', companyId).order('title').limit(250),
        db.from('skills').select('name_fr,name_en').eq('company_id', companyId).order('name_fr').limit(250),
        db.from('departments').select('id,name,parent_department_id,level').eq('company_id', companyId).order('level').limit(250),
      ]);
      if (deptResult.error) throw deptResult.error;
      if (positionResult.error) throw positionResult.error;
      if (skillResult.error) throw skillResult.error;
      return {
        departments: (deptResult.data ?? []) as TransformationDepartment[],
        positions: (positionResult.data ?? []) as TransformationPosition[],
        skillNames: (skillResult.data ?? []).map((skill: { name_fr?: string; name_en?: string }) => skill.name_fr || skill.name_en).filter(Boolean) as string[],
      };
    },
  });
}