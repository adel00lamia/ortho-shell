import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompanyId } from '@/hooks/useCompanyId';
import { supabase } from '@/integrations/supabase/client';

const db = supabase as any;

export interface SkillCategory {
  id: string;
  company_id: string;
  name_fr: string;
  name_en: string;
  ofppt_sector_code: string | null;
  icon: string;
  sort_order: number;
}

export interface Skill {
  id: string;
  company_id: string;
  category_id: string;
  name_fr: string;
  name_en: string;
  description: string | null;
  max_level: number;
}

export interface EmployeeSkill {
  id: string;
  company_id: string;
  employee_name: string;
  employee_email: string | null;
  skill_id: string;
  current_level: number;
  target_level: number;
  assessed_at: string;
  notes: string | null;
}

export function useSkillCategories() {
  const { companyId } = useCompanyId();

  return useQuery({
    queryKey: ['skill-categories', companyId],
    queryFn: async () => {
      const { data, error } = await db
        .from('skill_categories')
        .select('*')
        .eq('company_id', companyId!)
        .order('sort_order');
      if (error) throw error;

      if ((data || []).length === 0) {
        await db.rpc('seed_default_skills', { p_company_id: companyId! });
        const { data: seeded } = await db
          .from('skill_categories')
          .select('*')
          .eq('company_id', companyId!)
          .order('sort_order');
        return (seeded || []) as SkillCategory[];
      }

      return (data || []) as SkillCategory[];
    },
    enabled: !!companyId,
  });
}

export function useSkills(categoryId?: string) {
  const { companyId } = useCompanyId();

  return useQuery({
    queryKey: ['skills', companyId, categoryId],
    queryFn: async () => {
      let query = db
        .from('skills')
        .select('*')
        .eq('company_id', companyId!);
      if (categoryId) query = query.eq('category_id', categoryId);
      const { data, error } = await query.order('name_en');
      if (error) throw error;
      return (data || []) as Skill[];
    },
    enabled: !!companyId,
  });
}

export function useEmployeeSkills() {
  const { companyId } = useCompanyId();

  return useQuery({
    queryKey: ['employee-skills', companyId],
    queryFn: async () => {
      const { data, error } = await db
        .from('employee_skills')
        .select('*')
        .eq('company_id', companyId!);
      if (error) throw error;
      return (data || []) as EmployeeSkill[];
    },
    enabled: !!companyId,
  });
}

export function useAddCategory() {
  const queryClient = useQueryClient();
  const { companyId } = useCompanyId();

  return useMutation({
    mutationFn: async (data: { name_fr: string; name_en: string; ofppt_sector_code?: string }) => {
      const { error } = await db.from('skill_categories').insert({
        company_id: companyId!,
        ...data,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['skill-categories'] }),
  });
}

export function useAddSkill() {
  const queryClient = useQueryClient();
  const { companyId } = useCompanyId();

  return useMutation({
    mutationFn: async (data: { category_id: string; name_fr: string; name_en: string; description?: string }) => {
      const { error } = await db.from('skills').insert({
        company_id: companyId!,
        ...data,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['skills'] }),
  });
}

export function useUpdateEmployeeSkill() {
  const queryClient = useQueryClient();
  const { companyId } = useCompanyId();

  return useMutation({
    mutationFn: async (data: {
      employee_name: string;
      employee_email?: string;
      skill_id: string;
      current_level: number;
      target_level: number;
    }) => {
      const { data: existing } = await db
        .from('employee_skills')
        .select('id')
        .eq('company_id', companyId!)
        .eq('employee_name', data.employee_name)
        .eq('skill_id', data.skill_id)
        .maybeSingle();

      if (existing) {
        const { error } = await db
          .from('employee_skills')
          .update({ current_level: data.current_level, target_level: data.target_level, assessed_at: new Date().toISOString() })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await db.from('employee_skills').insert({
          company_id: companyId!,
          ...data,
          assessed_at: new Date().toISOString(),
        });
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employee-skills'] }),
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from('skill_categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skill-categories'] });
      queryClient.invalidateQueries({ queryKey: ['skills'] });
    },
  });
}

export function useDeleteSkill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from('skills').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['skills'] }),
  });
}