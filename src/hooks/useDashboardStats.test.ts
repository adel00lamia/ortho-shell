import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ----------------------------------------------------------------
// Supabase mock — intercept all table queries
// ----------------------------------------------------------------
type MockQueryResult = { data: any[] | null; count: number | null; error: any };

const makeMockQuery = (result: MockQueryResult) => ({
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockResolvedValue(result),
  then: (resolve: (v: MockQueryResult) => void) => resolve(result),
});

// We'll control per-table responses
let tableResponses: Record<string, MockQueryResult> = {};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn((table: string) => {
      const result = tableResponses[table] ?? { data: [], count: 0, error: null };
      return makeMockQuery(result);
    }),
  },
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}));

vi.mock('@/hooks/useCompanyProfile', () => ({
  useCompanyProfile: () => ({
    context: {
      stats: {
        totalEmployees: 42,
        totalDepartments: 5,
        totalEvaluations: 20,
        totalJDs: 8,
        avgRating: 4.2,
        criticalPositions: 3,
        skillGaps: ['Python', 'Leadership'],
        topTrainingNeeds: ['Communication'],
      },
    },
    companyId: 'company-abc',
  }),
}));

import { useDashboardStats } from './useDashboardStats';

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

describe('useDashboardStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tableResponses = {
      training_plans: {
        data: [
          { id: '1', status: 'active' },
          { id: '2', status: 'active' },
          { id: '3', status: 'completed' },
          { id: '4', status: 'draft' },
        ],
        count: 4,
        error: null,
      },
      training_modules: {
        data: [
          { id: 'm1', completed: true },
          { id: 'm2', completed: false },
          { id: 'm3', completed: true },
        ],
        count: 3,
        error: null,
      },
      profiles: { data: [], count: 10, error: null },
      performance_evaluations: {
        data: [
          { employee_name: 'Alice', created_at: new Date().toISOString() },
          { employee_name: 'Bob', created_at: new Date().toISOString() },
        ],
        count: 2,
        error: null,
      },
      skills: { data: [], count: 15, error: null },
      skill_categories: { data: [], count: 4, error: null },
    };
  });

  it('returns loading=true and null stats before data resolves', () => {
    const { result } = renderHook(() => useDashboardStats('admin'), {
      wrapper: makeWrapper(),
    });
    expect(result.current.loading).toBe(true);
    expect(result.current.stats).toBeNull();
  });

  it('resolves training plan counts correctly', async () => {
    const { result } = renderHook(() => useDashboardStats('admin'), {
      wrapper: makeWrapper(),
    });
    await vi.waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.stats?.trainingPlans).toBe(4);
    expect(result.current.stats?.activePlans).toBe(2);
  });

  it('calculates completionRate as percentage of completed plans', async () => {
    const { result } = renderHook(() => useDashboardStats('admin'), {
      wrapper: makeWrapper(),
    });
    await vi.waitFor(() => expect(result.current.loading).toBe(false));

    // 1 completed out of 4 total = 25%
    expect(result.current.stats?.completionRate).toBe(25);
  });

  it('calculates avgProgress from training modules', async () => {
    const { result } = renderHook(() => useDashboardStats('admin'), {
      wrapper: makeWrapper(),
    });
    await vi.waitFor(() => expect(result.current.loading).toBe(false));

    // 2 completed out of 3 modules = 66%
    expect(result.current.stats?.avgProgress).toBe(67);
  });

  it('populates company stats from useCompanyProfile context', async () => {
    const { result } = renderHook(() => useDashboardStats('admin'), {
      wrapper: makeWrapper(),
    });
    await vi.waitFor(() => expect(result.current.loading).toBe(false));

    const stats = result.current.stats!;
    expect(stats.totalEmployees).toBe(42);
    expect(stats.totalDepartments).toBe(5);
    expect(stats.totalEvaluations).toBe(20);
    expect(stats.totalJDs).toBe(8);
    expect(stats.avgRating).toBe(4.2);
    expect(stats.criticalPositions).toBe(3);
    expect(stats.topSkillGaps).toEqual(['Python', 'Leadership']);
  });

  it('returns skills and skill category counts', async () => {
    const { result } = renderHook(() => useDashboardStats('admin'), {
      wrapper: makeWrapper(),
    });
    await vi.waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.stats?.totalSkills).toBe(15);
    expect(result.current.stats?.totalSkillCategories).toBe(4);
  });

  it('builds recentActivity from performance evaluations', async () => {
    const { result } = renderHook(() => useDashboardStats('admin'), {
      wrapper: makeWrapper(),
    });
    await vi.waitFor(() => expect(result.current.loading).toBe(false));

    const activity = result.current.stats?.recentActivity ?? [];
    expect(activity.length).toBe(2);
    expect(activity[0].title).toContain('Alice');
    expect(activity[0].type).toBe('success');
  });

  it('returns 0 completionRate when no training plans exist', async () => {
    tableResponses.training_plans = { data: [], count: 0, error: null };

    const { result } = renderHook(() => useDashboardStats('admin'), {
      wrapper: makeWrapper(),
    });
    await vi.waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.stats?.completionRate).toBe(0);
  });

  it('does not run query when role is null', () => {
    const { result } = renderHook(() => useDashboardStats(null), {
      wrapper: makeWrapper(),
    });
    // Query disabled — stays loading=true until enabled
    expect(result.current.stats).toBeNull();
  });

  it('sets activeCompanies to 1 when companyId is present', async () => {
    const { result } = renderHook(() => useDashboardStats('admin'), {
      wrapper: makeWrapper(),
    });
    await vi.waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.stats?.activeCompanies).toBe(1);
  });
});
