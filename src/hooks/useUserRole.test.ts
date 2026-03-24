import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// ----------------------------------------------------------------
// Supabase mock — control role query response
// ----------------------------------------------------------------
const mockMaybeSingle = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: mockMaybeSingle,
    })),
  },
}));

// Control the authenticated user
const mockUser = { id: 'user-xyz', email: 'role-test@example.com' };
let currentUser: typeof mockUser | null = mockUser;

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: currentUser }),
}));

// Control import.meta.env for discovery mode tests
const originalEnv = { ...import.meta.env };

import { useUserRole } from './useUserRole';

describe('useUserRole', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentUser = mockUser;
  });

  it('starts in loading state while fetching', () => {
    mockMaybeSingle.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useUserRole());
    expect(result.current.loading).toBe(true);
    expect(result.current.role).toBeNull();
  });

  it('returns null role and loading=false when user is null', async () => {
    currentUser = null;
    const { result } = renderHook(() => useUserRole());
    await act(async () => {});
    expect(result.current.loading).toBe(false);
    expect(result.current.role).toBeNull();
  });

  it('resolves role from user_roles table', async () => {
    mockMaybeSingle.mockResolvedValue({ data: { role: 'hr_manager' }, error: null });
    const { result } = renderHook(() => useUserRole());
    await act(async () => {});
    expect(result.current.loading).toBe(false);
    expect(result.current.role).toBe('hr_manager');
  });

  it('resolves admin role correctly', async () => {
    mockMaybeSingle.mockResolvedValue({ data: { role: 'admin' }, error: null });
    const { result } = renderHook(() => useUserRole());
    await act(async () => {});
    expect(result.current.role).toBe('admin');
  });

  it('defaults to employee when no role record found (null data)', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    const { result } = renderHook(() => useUserRole());
    await act(async () => {});
    expect(result.current.role).toBe('employee');
  });

  it('defaults to employee on query error', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: null,
      error: new Error('DB error'),
    });
    const { result } = renderHook(() => useUserRole());
    await act(async () => {});
    expect(result.current.loading).toBe(false);
    expect(result.current.role).toBe('employee');
  });

  it('defaults to employee on thrown exception', async () => {
    mockMaybeSingle.mockRejectedValue(new Error('Network failure'));
    const { result } = renderHook(() => useUserRole());
    await act(async () => {});
    expect(result.current.loading).toBe(false);
    expect(result.current.role).toBe('employee');
  });

  it('re-fetches role when user changes', async () => {
    mockMaybeSingle
      .mockResolvedValueOnce({ data: { role: 'employee' }, error: null })
      .mockResolvedValueOnce({ data: { role: 'admin' }, error: null });

    const { result, rerender } = renderHook(() => useUserRole());
    await act(async () => {});
    expect(result.current.role).toBe('employee');

    // Simulate user change
    currentUser = { id: 'user-admin', email: 'admin@example.com' };
    rerender();
    await act(async () => {});
    expect(result.current.role).toBe('admin');
  });

  it('all valid role strings are accepted', async () => {
    const validRoles = ['admin', 'hr_manager', 'trainer', 'employee'] as const;

    for (const expectedRole of validRoles) {
      mockMaybeSingle.mockResolvedValue({ data: { role: expectedRole }, error: null });
      const { result } = renderHook(() => useUserRole());
      await act(async () => {});
      expect(result.current.role).toBe(expectedRole);
    }
  });
});
