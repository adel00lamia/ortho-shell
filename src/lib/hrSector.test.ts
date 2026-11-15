import { describe, expect, it } from 'vitest';
import { guessSector } from './hrSector';

describe('HR sector inference', () => {
  it('classifies Retail as distribution rather than AI', () => {
    expect(guessSector('Retail')).toBe('Distribution & retail');
  });
  it('does not invent a hospitality benchmark', () => {
    expect(guessSector('Hospitality')).toBe('Autres / à préciser');
  });
  it('classifies hospitals as health rather than IT', () => {
    expect(guessSector('Hospitals & Healthcare')).toBe('Santé & social');
  });
  it.each(['Information Technology', 'IT', 'AI & Machine Learning', 'Software Development', 'Fintech', 'EdTech'])('preserves technology match for %s', industry => {
    expect(guessSector(industry)).toBe('Tech & digital');
  });
});