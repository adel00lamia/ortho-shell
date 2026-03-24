import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';

// ----------------------------------------------------------------
// Mock Supabase before importing the hook
// ----------------------------------------------------------------
const mockGetSession = vi.fn();
const mockOnAuthStateChange = vi.fn();
const mockSignInWithPassword = vi.fn();
const mockSignUp = vi.fn();
const mockSignOut = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange,
      signInWithPassword: mockSignInWithPassword,
      signUp: mockSignUp,
      signOut: mockSignOut,
    },
  },
}));

import { AuthProvider, useAuth } from './useAuth';

// ----------------------------------------------------------------
// Helper: render useAuth inside AuthProvider
// ----------------------------------------------------------------
const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(AuthProvider, null, children);

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default: no active session
    mockGetSession.mockResolvedValue({ data: { session: null } });

    // Default: subscription object returned by onAuthStateChange
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
  });

  it('throws when used outside AuthProvider', () => {
    // Suppress React error boundary noise
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useAuth())).toThrow(
      'useAuth must be used within an AuthProvider'
    );
    consoleError.mockRestore();
  });

  it('starts in loading state', () => {
    // getSession never resolves — keeps loading indefinitely
    mockGetSession.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBeNull();
    expect(result.current.session).toBeNull();
  });

  it('resolves with null user when no session exists', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    // Wait for initializeAuth to complete
    await act(async () => {});
    expect(result.current.loading).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.session).toBeNull();
  });

  it('resolves with user when session exists', async () => {
    const mockUser = { id: 'user-1', email: 'test@example.com' };
    const mockSession = { user: mockUser, access_token: 'token-abc' };
    mockGetSession.mockResolvedValue({ data: { session: mockSession } });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {});

    expect(result.current.loading).toBe(false);
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.session).toEqual(mockSession);
  });

  it('signIn delegates to supabase.auth.signInWithPassword', async () => {
    mockSignInWithPassword.mockResolvedValue({ error: null });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {});

    const { error } = await act(async () =>
      result.current.signIn('user@example.com', 'secret')
    );

    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'secret',
    });
    expect(error).toBeNull();
  });

  it('signIn returns error on failure', async () => {
    const authError = new Error('Invalid credentials');
    mockSignInWithPassword.mockResolvedValue({ error: authError });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {});

    const { error } = await act(async () =>
      result.current.signIn('bad@example.com', 'wrong')
    );
    expect(error).toBe(authError);
  });

  it('signUp delegates to supabase.auth.signUp with metadata', async () => {
    mockSignUp.mockResolvedValue({ error: null });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {});

    await act(async () =>
      result.current.signUp('new@example.com', 'pass', 'Alice', 'Smith', 'hr_manager')
    );

    expect(mockSignUp).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'new@example.com',
        password: 'pass',
        options: expect.objectContaining({
          data: { first_name: 'Alice', last_name: 'Smith', requested_role: 'hr_manager' },
        }),
      })
    );
  });

  it('signUp defaults requested_role to employee when omitted', async () => {
    mockSignUp.mockResolvedValue({ error: null });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {});

    await act(async () =>
      result.current.signUp('new@example.com', 'pass', 'Bob', 'Jones')
    );

    expect(mockSignUp).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          data: expect.objectContaining({ requested_role: 'employee' }),
        }),
      })
    );
  });

  it('signOut delegates to supabase.auth.signOut', async () => {
    mockSignOut.mockResolvedValue({});
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {});

    await act(async () => result.current.signOut());
    expect(mockSignOut).toHaveBeenCalledOnce();
  });

  it('updates user when onAuthStateChange fires a SIGNED_IN event', async () => {
    const newUser = { id: 'user-2', email: 'signed-in@example.com' };
    const newSession = { user: newUser, access_token: 'token-xyz' };

    let capturedCallback: ((event: string, session: any) => void) | null = null;

    mockOnAuthStateChange.mockImplementation((cb) => {
      capturedCallback = cb;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {});

    // Simulate Supabase firing a SIGNED_IN event
    await act(async () => {
      capturedCallback?.('SIGNED_IN', newSession);
    });

    expect(result.current.user).toEqual(newUser);
    expect(result.current.session).toEqual(newSession);
  });

  it('clears user when onAuthStateChange fires a SIGNED_OUT event', async () => {
    const mockUser = { id: 'user-1', email: 'test@example.com' };
    mockGetSession.mockResolvedValue({ data: { session: { user: mockUser } } });

    let capturedCallback: ((event: string, session: any) => void) | null = null;
    mockOnAuthStateChange.mockImplementation((cb) => {
      capturedCallback = cb;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {});

    // Simulate sign-out event
    await act(async () => {
      capturedCallback?.('SIGNED_OUT', null);
    });

    expect(result.current.user).toBeNull();
    expect(result.current.session).toBeNull();
  });
});
