import { describe, it, expect } from 'vitest';
import { personNodes, interventionNodes, impactNodes, impactProgress, type DevItem } from './workGraphLinks';

const item: DevItem = { id: 'd1', employee_name: 'Sara Alami', skill_name: 'Excel', lever: 'build', status: 'planned', action_id: 'a1', current_level: 2, target_level: 4, achieved_level: null };

describe('workGraphLinks', () => {
  it('links a position holder to its role', () => {
    const [p] = personNodes([{ title: 'Chargée paie', current_holder_name: 'Sara Alami' }], [item]);
    expect(p.parentIds).toEqual(['role:Chargée paie']);
  });
  it('links intervention to skill only on exact name match', () => {
    expect(interventionNodes([item], ['excel'])[0].parentIds).toContain('skill:excel');
    expect(interventionNodes([item], ['Excel avancé'])[0].parentIds).toEqual(['person:sara alami']);
  });
  it('links impact to interventions sharing the action id', () => {
    const r = { id: 'k', kpi_name: 'Erreurs', unit: null, baseline_value: 10, target_value: 2, actual_value: 6, action_id: 'a1', direction: 'down' };
    expect(impactNodes([r], [item])[0].parentIds).toEqual(['intervention:d1']);
    expect(impactProgress(r)).toBe(50);
  });
});
