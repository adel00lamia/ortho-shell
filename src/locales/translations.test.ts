import { describe, it, expect } from 'vitest';
import { en } from './en';
import { fr } from './fr';
import { ar } from './ar';

/** Recursively collect all leaf keys from a nested object */
function collectKeys(obj: any, prefix = ''): string[] {
  const keys: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      keys.push(...collectKeys(v, path));
    } else {
      keys.push(path);
    }
  }
  return keys;
}

describe('Translation completeness', () => {
  const enKeys = collectKeys(en);

  it('English locale has keys', () => {
    expect(enKeys.length).toBeGreaterThan(50);
  });

  it('French locale covers all English keys', () => {
    const frKeys = new Set(collectKeys(fr));
    const missing = enKeys.filter(k => !frKeys.has(k));
    expect(missing).toEqual([]);
  });

  it('Arabic locale has required sections', () => {
    expect(ar.common).toBeDefined();
    expect(ar.nav).toBeDefined();
    expect(ar.dashboard).toBeDefined();
    expect(ar.marketplace).toBeDefined();
  });

  it('No empty string values in English', () => {
    const emptyKeys = enKeys.filter(k => {
      const parts = k.split('.');
      let val: any = en;
      for (const p of parts) val = val?.[p];
      return val === '';
    });
    expect(emptyKeys).toEqual([]);
  });
});
