import { describe, expect, it } from 'vitest';
import { emptyModel, emptyProcess } from './model';
import { hrTrainingRequest } from './trainingRequest';

describe('RH training plan source', () => {
  it('uses the entered training budget, process evidence and human approver', () => {
    const m = emptyModel({ name: 'Entreprise test', sector: 'Services' });
    m.roles = [{ id: 'rh', title: 'Responsable paie', fte: 1, domains: ['paie'], responsibilities: 'Paie', availableHoursPerFte: 1500, loadedHourlyCost: 90, competencies: 'Contrôle des variables' }];
    m.processes = [{ ...emptyProcess('paie', 'rh'), name: 'Contrôle paie', evidence: 'Journal erreurs octobre', sensitive: 'payroll_release', approver: 'DRH' }];
    m.scenario.trainingCost = 200000;
    const request = hrTrainingRequest(m);
    expect(request.requirements.budget).toBe(200000);
    expect(request.requirements.context).toContain('Journal erreurs octobre');
    expect(request.requirements.context).toContain('"humanApprover":"DRH"');
    m.scenario.trainingCost = 0;
    expect(hrTrainingRequest(m).requirements.budget).toBe(0);
  });
  it('rejects empty models rather than generating unrelated generic training', () => {
    expect(() => hrTrainingRequest(emptyModel())).toThrow('Renseignez');
  });
});