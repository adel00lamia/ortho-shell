import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

// ----------------------------------------------------------------
// Mocks
// ----------------------------------------------------------------
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: mockSelect.mockReturnValue({
        eq: mockEq.mockReturnValue({
          single: mockSingle,
        }),
      }),
    })),
  },
}));

// Control which user is "logged in"
const mockUser = { id: 'user-abc', email: 'test@example.com' };
let currentUser: typeof mockUser | null = mockUser;

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: currentUser }),
}));

// React Query needs a QueryClient wrapper
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCompanyId } from './useCompanyId';

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

describe('useCompanyId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentUser = mockUser;
  });

  it('returns null companyId and loading=true initially when user is present', () => {
    // Query never resolves
    mockSingle.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useCompanyId(), { wrapper: makeWrapper() });
    expect(result.current.loading).toBe(true);
    expect(result.current.companyId).toBeNull();
  });

  it('is disabled (no query) when user is null', () => {
    currentUser = null;
    const { result } = renderHook(() => useCompanyId(), { wrapper: makeWrapper() });
    // Query is disabled so loading stays false, companyId stays null
    expect(result.current.loading).toBe(false);
    expect(result.current.companyId).toBeNull();
    expect(mockSingle).not.toHaveBeenCalled();
  });

  it('returns companyId after successful query', async () => {
    mockSingle.mockResolvedValue({ data: { company_id: 'company-123' }, error: null });
    const { result } = renderHook(() => useCompanyId(), { wrapper: makeWrapper() });

    // Wait for React Query to fetch
    await vi.waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.companyId).toBe('company-123');
  });

  it('returns null companyId when profile has no company_id', async () => {
    mockSingle.mockResolvedValue({ data: { company_id: null }, error: null });
    const { result } = renderHook(() => useCompanyId(), { wrapper: makeWrapper() });

    await vi.waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.companyId).toBeNull();
  });

  it('returns null companyId when query returns no data', async () => {
    mockSingle.mockResolvedValue({ data: null, error: null });
    const { result } = renderHook(() => useCompanyId(), { wrapper: makeWrapper() });

    await vi.waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.companyId).toBeNull();
  });
});
