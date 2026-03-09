import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useEffect } from 'react';

export interface WhiteLabelConfig {
  id: string;
  company_id: string;
  brand_name: string;
  logo_url: string | null;
  favicon_url: string | null;
  primary_color: string;
  accent_color: string;
  custom_domain: string | null;
  custom_css: string | null;
  hide_powered_by: boolean;
}

export function useWhiteLabel() {
  const { companyId } = useCompanyId();

  const query = useQuery({
    queryKey: ['white-label', companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase
        .from('white_label_config')
        .select('*')
        .eq('company_id', companyId!)
        .maybeSingle();
      return data as WhiteLabelConfig | null;
    },
  });

  // Apply white-label CSS variables
  useEffect(() => {
    const config = query.data;
    if (!config) return;

    const root = document.documentElement;
    if (config.primary_color) {
      root.style.setProperty('--primary', hexToHsl(config.primary_color));
    }
    if (config.accent_color) {
      root.style.setProperty('--accent', hexToHsl(config.accent_color));
    }
    if (config.custom_css) {
      const style = document.createElement('style');
      style.id = 'white-label-css';
      style.textContent = config.custom_css;
      document.head.appendChild(style);
      return () => { style.remove(); };
    }
  }, [query.data]);

  return query;
}

export function useUpdateWhiteLabel() {
  const queryClient = useQueryClient();
  const { companyId } = useCompanyId();

  return useMutation({
    mutationFn: async (config: Partial<WhiteLabelConfig>) => {
      const { data, error } = await supabase
        .from('white_label_config')
        .upsert({
          company_id: companyId!,
          ...config,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'company_id' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['white-label'] });
    },
  });
}

function hexToHsl(hex: string): string {
  hex = hex.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}
