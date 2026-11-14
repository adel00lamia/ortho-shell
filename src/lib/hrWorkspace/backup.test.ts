import { describe, expect, it } from 'vitest';
import { buildDemoModel } from './demoData';
import { createBackup, readBackup } from './backup';
import { liveKey, saveModel } from './storage';

describe('HR workspace backups', () => {
  it('restores roles, processes, answers, scenarios and roadmap without changes', () => {
    const model = buildDemoModel();
    expect(readBackup(createBackup(model, true), true)).toEqual(model);
  });
  it('prevents demo data from being restored into a real workspace', () => {
    expect(() => readBackup(createBackup(buildDemoModel(), true), false)).toThrow('séparés');
  });
  it('prevents real data from being restored into the public demo', () => {
    expect(() => readBackup(createBackup(buildDemoModel(), false), true)).toThrow('séparés');
  });
  it('rejects malformed files and unsupported versions', () => {
    expect(() => readBackup('{broken', true)).toThrow('JSON');
    expect(() => readBackup('{"format":"qimatak-hr-backup","version":2}', true)).toThrow('incompatible');
  });
  it('rejects files exceeding 5 MiB', () => {
    expect(() => readBackup(' '.repeat(5 * 1024 * 1024 + 1), true)).toThrow('5 Mo');
  });
  it('keeps local saves isolated by both user and company', () => {
    expect(liveKey('u1', 'c1')).not.toBe(liveKey('u2', 'c1'));
    expect(liveKey('u1', 'c1')).not.toBe(liveKey('u1', 'c2'));
    expect(saveModel(liveKey('u1', 'c1'), buildDemoModel())).toBe(true);
  });
});