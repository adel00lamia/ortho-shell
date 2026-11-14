import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { emptyModel, emptyProcess } from '@/lib/hrWorkspace/model';
import { HRTrainingPlan } from './HRTrainingPlan';

vi.mock('@/integrations/supabase/client', () => ({ supabase: { auth: { getSession: vi.fn(async () => ({ data: { session: { access_token: 'test-session' } } })) } } }));
vi.mock('@/config/env', () => ({ env: { VITE_SUPABASE_URL: 'https://example.test', VITE_SUPABASE_PUBLISHABLE_KEY: 'test-public' } }));

describe('HR training generation integration', () => {
  afterEach(() => { vi.unstubAllGlobals(); localStorage.clear(); });
  it('submits the edited model and stores only the complete returned plan', async () => {
    const m = emptyModel({ name: 'Test RH', sector: 'Services' });
    m.roles = [{ id: 'role', title: 'Responsable RH', fte: 1, domains: ['paie'], responsibilities: 'Contrôle', availableHoursPerFte: 1500, loadedHourlyCost: 90, competencies: 'Paie' }];
    m.processes = [{ ...emptyProcess('paie', 'role'), name: 'Contrôle paie', evidence: 'Mesure documentée' }];
    m.scenario.trainingCost = 200000;
    const plan = { title: 'Plan RH test', modules: [{ title: 'Contrôle paie', duration: '7 h', learning_objectives: ['Contrôler les variables'], content_outline: ['Écarts'], assessment_methods: ['Cas pratique'], workplace_transfer: ['Revue'] }], kpis: [], recommendations: [] };
    const fetchMock = vi.fn(async (_url: string, _options: RequestInit) => new Response(`: start\n\ndata: ${JSON.stringify({ plan })}\n\n`, { headers: { 'content-type': 'text/event-stream' } }));
    vi.stubGlobal('fetch', fetchMock);
    render(<HRTrainingPlan m={m} storageKey="test.company.user" />);
    fireEvent.click(screen.getByRole('button', { name: 'Générer le plan RH' }));
    await waitFor(() => expect(localStorage.getItem('test.company.user.training-plan')).not.toBeNull());
    const request = JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string);
    expect(request.requirements.budget).toBe(200000);
    expect(request.requirements.context).toContain('Mesure documentée');
    expect(JSON.parse(localStorage.getItem('test.company.user.training-plan') || '{}').plan).toEqual(plan);
  });
});