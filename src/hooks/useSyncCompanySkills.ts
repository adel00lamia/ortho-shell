import { useState, useCallback } from 'react';
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
  updated: number;
  created: number;
}

export function useSyncCompanySkills() {
  const { companyId } = useCompanyId();
  const queryClient = useQueryClient();
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<SyncStats | null>(null);

  const sync = useCallback(async (language: string = 'en', silent = false) => {
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
        db.from('employee_skills').select('*').eq('company_id', companyId),
      ]);

      if (!employees?.length) {
        if (!silent) toast.warning(fr ? 'Aucun employé trouvé dans le profil entreprise' : 'No employees found in company profile');
        setSyncing(false);
        return;
      }

      if (!skills?.length) {
        if (!silent) toast.warning(fr ? 'Ajoutez des compétences à la taxonomie d\'abord' : 'Add skills to the taxonomy first');
        setSyncing(false);
        return;
      }

      // Build lookup of existing assessments: key → record
      const existingMap = new Map<string, any>();
      (existingEmployeeSkills || []).forEach((es: any) => {
        existingMap.set(`${es.employee_name}::${es.skill_id}`, es);
      });

      // Build skill name → skill record lookup (case-insensitive)
      const skillByName = new Map<string, any>();
      (skills || []).forEach((s: any) => {
        skillByName.set(s.name_en.toLowerCase(), s);
        skillByName.set(s.name_fr.toLowerCase(), s);
        if (s.skill_categories) {
          const catEn = s.skill_categories.name_en?.toLowerCase() || '';
          const catFr = s.skill_categories.name_fr?.toLowerCase() || '';
          skillByName.set(`${catEn}:${s.name_en.toLowerCase()}`, s);
          skillByName.set(`${catFr}:${s.name_fr.toLowerCase()}`, s);
        }
      });

      const toInsert: any[] = [];
      const toUpdate: { id: string; current_level: number; target_level: number; notes: string }[] = [];
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
          for (const rawScore of eval_.competency_scores) {
            const score = rawScore as any;
            if (!score) continue;
            const scoreName = (score.name || score.skill || '').toLowerCase();
            const matchedSkill = skillByName.get(scoreName);
            if (!matchedSkill) continue;

            const key = `${emp.full_name}::${matchedSkill.id}`;
            const newCurrent = Math.min(5, Math.max(1, Math.round(score.score || score.level || 1)));
            const newTarget = Math.min(5, Math.max(1, Math.round(score.target || (score.score || 0) + 1 || 3)));
            const existing = existingMap.get(key);

            if (existing) {
              // Update if levels changed
              if (existing.current_level !== newCurrent || existing.target_level !== newTarget) {
                toUpdate.push({
                  id: existing.id,
                  current_level: newCurrent,
                  target_level: newTarget,
                  notes: fr ? 'Mis à jour depuis évaluation de performance' : 'Updated from performance evaluation',
                });
              }
            } else {
              toInsert.push({
                company_id: companyId,
                employee_name: emp.full_name,
                employee_email: emp.email || null,
                skill_id: matchedSkill.id,
                current_level: newCurrent,
                target_level: newTarget,
                assessed_at: new Date().toISOString(),
                notes: fr ? 'Synchronisé depuis évaluation de performance' : 'Synced from performance evaluation',
              });
              existingMap.set(key, { id: 'pending', current_level: newCurrent, target_level: newTarget });
              fromEvals++;
            }
          }
        }

        // Map skills from position skills_required / skills_current
        if (pos) {
          const reqSkills = Array.isArray(pos.skills_required) ? pos.skills_required : [];
          const curSkills = Array.isArray(pos.skills_current) ? pos.skills_current : [];

          const currentMap = new Map<string, number>();
          curSkills.forEach((s: any) => {
            const name = (typeof s === 'string' ? s : s.name || s.skill || '').toLowerCase();
            const level = typeof s === 'string' ? 2 : (s.level || s.score || 2);
            currentMap.set(name, level);
          });

          for (const rawReq of reqSkills) {
            const req = rawReq as any;
            if (!req) continue;
            const reqName = (typeof req === 'string' ? req : req.name || req.skill || '').toLowerCase();
            const reqLevel = typeof req === 'string' ? 3 : (req.level || req.score || 3);
            const matchedSkill = skillByName.get(reqName);
            if (!matchedSkill) continue;

            const key = `${emp.full_name}::${matchedSkill.id}`;
            const currentLevel = Math.min(5, Math.max(1, Math.round(currentMap.get(reqName) || 1)));
            const targetLevel = Math.min(5, Math.max(1, Math.round(reqLevel)));
            const existing = existingMap.get(key);

            if (existing) {
              if (existing.current_level !== currentLevel || existing.target_level !== targetLevel) {
                toUpdate.push({
                  id: existing.id,
                  current_level: currentLevel,
                  target_level: targetLevel,
                  notes: fr ? 'Mis à jour depuis organigramme' : 'Updated from org chart position',
                });
              }
            } else {
              toInsert.push({
                company_id: companyId,
                employee_name: emp.full_name,
                employee_email: emp.email || null,
                skill_id: matchedSkill.id,
                current_level: currentLevel,
                target_level: targetLevel,
                assessed_at: new Date().toISOString(),
                notes: fr ? 'Synchronisé depuis organigramme' : 'Synced from org chart position',
              });
              existingMap.set(key, { id: 'pending', current_level: currentLevel, target_level: targetLevel });
              fromPos++;
            }
          }
        }
      }

      // Batch insert new records
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

      // Batch update changed records
      for (const upd of toUpdate) {
        if (upd.id === 'pending') continue;
        await db.from('employee_skills').update({
          current_level: upd.current_level,
          target_level: upd.target_level,
          notes: upd.notes,
          assessed_at: new Date().toISOString(),
        }).eq('id', upd.id);
      }

      const stats: SyncStats = {
        employeesSynced: employees.length,
        skillsMapped: toInsert.length + toUpdate.length,
        fromEvaluations: fromEvals,
        fromPositions: fromPos,
        updated: toUpdate.length,
        created: toInsert.length,
      };
      setLastSync(stats);

      // Invalidate skill queries so UI refreshes
      queryClient.invalidateQueries({ queryKey: ['employee-skills'] });

      const totalChanges = toInsert.length + toUpdate.length;
      if (!silent) {
        if (totalChanges > 0) {
          toast.success(
            fr
              ? `${toInsert.length} créées, ${toUpdate.length} mises à jour pour ${employees.length} employés`
              : `${toInsert.length} created, ${toUpdate.length} updated for ${employees.length} employees`
          );
        } else {
          toast.info(
            fr ? 'Toutes les données sont déjà à jour' : 'All data is already up to date'
          );
        }
      }

      return stats;
    } catch (error) {
      console.error('Sync error:', error);
      if (!silent) toast.error(fr ? 'Erreur de synchronisation' : 'Sync error');
    } finally {
      setSyncing(false);
    }
  }, [companyId, queryClient]);

  return { sync, syncing, lastSync, companyId };
}
