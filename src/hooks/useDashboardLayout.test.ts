import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDashboardLayout } from './useDashboardLayout';

// Mock useAuth
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'test-user-123' } }),
}));

describe('useDashboardLayout', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns default widgets when no saved layout', () => {
    const { result } = renderHook(() => useDashboardLayout());
    expect(result.current.widgets).toHaveLength(5);
    expect(result.current.widgets.every(w => w.visible)).toBe(true);
  });

  it('toggles widget visibility', () => {
    const { result } = renderHook(() => useDashboardLayout());
    act(() => result.current.toggleWidget('stats'));
    expect(result.current.isVisible('stats')).toBe(false);
    act(() => result.current.toggleWidget('stats'));
    expect(result.current.isVisible('stats')).toBe(true);
  });

  it('moves widgets', () => {
    const { result } = renderHook(() => useDashboardLayout());
    const firstId = result.current.widgets[0].id;
    const secondId = result.current.widgets[1].id;
    act(() => result.current.moveWidget(0, 1));
    expect(result.current.widgets[0].id).toBe(secondId);
    expect(result.current.widgets[1].id).toBe(firstId);
  });

  it('resets layout to defaults', () => {
    const { result } = renderHook(() => useDashboardLayout());
    act(() => result.current.toggleWidget('stats'));
    act(() => result.current.resetLayout());
    expect(result.current.widgets.every(w => w.visible)).toBe(true);
  });

  it('persists to localStorage when user is available', () => {
    const { result } = renderHook(() => useDashboardLayout());
    act(() => result.current.toggleWidget('activity'));
    const saved = localStorage.getItem('dashboard_layout_test-user-123');
    expect(saved).toBeTruthy();
    const parsed = JSON.parse(saved!);
    expect(parsed.find((w: any) => w.id === 'activity').visible).toBe(false);
  });
});
