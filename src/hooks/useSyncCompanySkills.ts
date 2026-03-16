import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const db = supabase as any;

interface SyncStats {
  employeesSynced: number;
  skillsMapped: number;
  fromEvaluations: number;
  fromPositions: number;
}

export function useSyncCompanySkills() {
  const { companyId } = useCompanyId();
  const queryClient = useQueryClient();
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<SyncStats | null>(null);

  const sync = async (language: string = 'en') => {
    if (!companyId) return;
    setSyncing(true);
    const fr = language === 'fr';

    try {
      // 1. Load all company data in parallel
      const [
        { data: employees },
        { data: evaluations },
        { data: positions },
        { data: skills },
        { data: existingEmployeeSkills },
      ] = await Promise.all([
        supabase.from('company_employees').select('*').eq('company_id', companyId).eq('status', 'active'),
        supabase.from('performance_evaluations').select('*').eq('company_id', companyId),
        supabase.from('positions').select('*').eq('company_id', companyId),
        db.from('skills').select('*, skill_categories(name_en, name_fr)').eq('company_id', companyId),
        db.from('employee_skills').select('employee_name, skill_id').eq('company_id', companyId),
      ]);

      if (!employees?.length) {
        toast.warning(fr ? 'Aucun employé trouvé dans le profil entreprise' : 'No employees found in company profile');
        setSyncing(false);
        return;
      }

      if (!skills?.length) {
        toast.warning(fr ? 'Ajoutez des compétences à la taxonomie d\'abord' : 'Add skills to the taxonomy first');
        setSyncing(false);
        return;
      }

      // Build lookup of existing assessments to avoid duplicates
      const existingSet = new Set(
        (existingEmployeeSkills || []).map((es: any) => `${es.employee_name}::${es.skill_id}`)
      );

      // Build skill name → skill record lookup (case-insensitive)
      const skillByName = new Map<string, any>();
      (skills || []).forEach((s: any) => {
        skillByName.set(s.name_en.toLowerCase(), s);
        skillByName.set(s.name_fr.toLowerCase(), s);
        // Also index by category prefix
        if (s.skill_categories) {
          const catEn = s.skill_categories.name_en?.toLowerCase() || '';
          const catFr = s.skill_categories.name_fr?.toLowerCase() || '';
          skillByName.set(`${catEn}:${s.name_en.toLowerCase()}`, s);
          skillByName.set(`${catFr}:${s.name_fr.toLowerCase()}`, s);
        }
      });

      const toInsert: any[] = [];
      let fromEvals = 0;
      let fromPos = 0;

      for (const emp of employees) {
        // Find matching evaluation by name or email
        const eval_ = (evaluations || []).find(
          (ev: any) =>
            ev.employee_name === emp.full_name ||
            (emp.email && ev.employee_email === emp.email)
        );

        // Find matching position by name or email
        const pos = (positions || []).find(
          (p: any) =>
            p.current_holder_name === emp.full_name ||
            (emp.email && p.current_holder_email === emp.email)
        );

        // Map competency scores from evaluation → employee_skills
        if (eval_?.competency_scores && Array.isArray(eval_.competency_scores)) {
          for (const score of eval_.competency_scores) {
            const scoreName = (score.name || score.skill || '').toLowerCase();
            const matchedSkill = skillByName.get(scoreName);
            if (matchedSkill && !existingSet.has(`${emp.full_name}::${matchedSkill.id}`)) {
              toInsert.push({
                company_id: companyId,
                employee_name: emp.full_name,
                employee_email: emp.email || null,
                skill_id: matchedSkill.id,
                current_level: Math.min(5, Math.max(1, Math.round(score.score || score.level || 1))),
                target_level: Math.min(5, Math.max(1, Math.round(score.target || score.score + 1 || 3))),
                assessed_at: new Date().toISOString(),
                notes: fr ? 'Synchronisé depuis évaluation de performance' : 'Synced from performance evaluation',
              });
              existingSet.add(`${emp.full_name}::${matchedSkill.id}`);
              fromEvals++;
            }
          }
        }

        // Map skills from position skills_required / skills_current
        if (pos) {
          const reqSkills = Array.isArray(pos.skills_required) ? pos.skills_required : [];
          const curSkills = Array.isArray(pos.skills_current) ? pos.skills_current : [];

          // Build current skill map from position
          const currentMap = new Map<string, number>();
          curSkills.forEach((s: any) => {
            const name = (typeof s === 'string' ? s : s.name || s.skill || '').toLowerCase();
            const level = typeof s === 'string' ? 2 : (s.level || s.score || 2);
            currentMap.set(name, level);
          });

          for (const req of reqSkills) {
            const reqName = (typeof req === 'string' ? req : req.name || req.skill || '').toLowerCase();
            const reqLevel = typeof req === 'string' ? 3 : (req.level || req.score || 3);
            const matchedSkill = skillByName.get(reqName);

            if (matchedSkill && !existingSet.has(`${emp.full_name}::${matchedSkill.id}`)) {
              const currentLevel = currentMap.get(reqName) || 1;
              toInsert.push({
                company_id: companyId,
                employee_name: emp.full_name,
                employee_email: emp.email || null,
                skill_id: matchedSkill.id,
                current_level: Math.min(5, Math.max(1, Math.round(currentLevel))),
                target_level: Math.min(5, Math.max(1, Math.round(reqLevel))),
                assessed_at: new Date().toISOString(),
                notes: fr ? 'Synchronisé depuis organigramme' : 'Synced from org chart position',
              });
              existingSet.add(`${emp.full_name}::${matchedSkill.id}`);
              fromPos++;
            }
          }
        }
      }

      // Batch insert
      if (toInsert.length > 0) {
        const batchSize = 100;
        for (let i = 0; i < toInsert.length; i += batchSize) {
          const batch = toInsert.slice(i, i + batchSize);
          const { error } = await db.from('employee_skills').insert(batch);
          if (error) {
            console.error('Sync insert error:', error);
            throw error;
          }
        }
      }

      const stats: SyncStats = {
        employeesSynced: employees.length,
        skillsMapped: toInsert.length,
        fromEvaluations: fromEvals,
        fromPositions: fromPos,
      };
      setLastSync(stats);

      // Invalidate skill queries so UI refreshes
      queryClient.invalidateQueries({ queryKey: ['employee-skills'] });

      if (toInsert.length > 0) {
        toast.success(
          fr
            ? `${toInsert.length} compétences synchronisées pour ${employees.length} employés`
            : `${toInsert.length} skills synced for ${employees.length} employees`
        );
      } else {
        toast.info(
          fr
            ? 'Tous les employés sont déjà synchronisés'
            : 'All employees are already synced'
        );
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast.error(fr ? 'Erreur de synchronisation' : 'Sync error');
    } finally {
      setSyncing(false);
    }
  };

  return { sync, syncing, lastSync, companyId };
}
