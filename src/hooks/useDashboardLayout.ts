import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

export interface DashboardWidget {
  id: string;
  visible: boolean;
}

const DEFAULT_WIDGETS: DashboardWidget[] = [
  { id: 'stats', visible: true },
  { id: 'profile', visible: true },
  { id: 'workflow', visible: true },
  { id: 'actions', visible: true },
  { id: 'activity', visible: true },
];

function loadWidgets(key: string): DashboardWidget[] {
  try {
    const saved = localStorage.getItem(key);
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return DEFAULT_WIDGETS;
}

export function useDashboardLayout() {
  const { user } = useAuth();
  const storageKey = user?.id ? `dashboard_layout_${user.id}` : null;

  const [widgets, setWidgets] = useState<DashboardWidget[]>(DEFAULT_WIDGETS);

  // Re-load from correct key once user is available
  useEffect(() => {
    if (storageKey) {
      setWidgets(loadWidgets(storageKey));
    }
  }, [storageKey]);

  const persist = useCallback((next: DashboardWidget[]) => {
    setWidgets(next);
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(next));
    }
  }, [storageKey]);

  const toggleWidget = useCallback((id: string) => {
    persist(widgets.map(w => w.id === id ? { ...w, visible: !w.visible } : w));
  }, [widgets, persist]);

  const moveWidget = useCallback((fromIndex: number, toIndex: number) => {
    const next = [...widgets];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    persist(next);
  }, [widgets, persist]);

  const resetLayout = useCallback(() => {
    persist(DEFAULT_WIDGETS);
  }, [persist]);

  const isVisible = useCallback((id: string) => {
    return widgets.find(w => w.id === id)?.visible ?? true;
  }, [widgets]);

  return { widgets, toggleWidget, moveWidget, resetLayout, isVisible };
}
