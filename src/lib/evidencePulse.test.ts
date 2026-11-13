import { describe, expect, it } from 'vitest';
import { aggregatePulse, makePulseCode, toPulseQuestion } from '@/lib/evidencePulse';

const questions = [
  { id: 'q1', text: 'Le standard est-il clair ?' },
  { id: 'q2', text: 'Avez-vous les outils nécessaires ?' },
];

describe('aggregatePulse', () => {
  it('averages scorable answers and ignores "I do not know"', () => {
    const summary = aggregatePulse(questions, [
      { answers: { q1: 'yes', q2: 'no' }, free_text: 'Le CRM est lent.' },
      { answers: { q1: 'rather_no', q2: 'unknown' } },
      { answers: { q1: 'no' } },
    ]);

    expect(summary.responses).toBe(3);
    expect(summary.questions[0].agreement).toBe(42); // (100 + 25 + 0) / 3
    expect(summary.questions[0].answers).toBe(3);
    expect(summary.questions[1].agreement).toBe(0);
    expect(summary.questions[1].unknown).toBe(1);
    expect(summary.comments).toEqual(['Le CRM est lent.']);
  });

  it('returns null agreement when nobody answered a question', () => {
    const summary = aggregatePulse(questions, [{ answers: { q1: 'unknown' } }]);
    expect(summary.questions[0].agreement).toBeNull();
    expect(summary.questions[1].agreement).toBeNull();
    expect(summary.questions[1].answers).toBe(0);
  });

  it('survives empty and malformed input', () => {
    expect(aggregatePulse([], []).responses).toBe(0);
    const summary = aggregatePulse(questions, [
      { answers: {} },
      { answers: { q1: 'not-an-option' } } as never,
    ]);
    expect(summary.responses).toBe(2);
    expect(summary.questions[0].agreement).toBeNull();
    expect(summary.questions[0].unknown).toBe(1);
  });
});

describe('codes and questions', () => {
  it('creates unambiguous codes of the requested length', () => {
    const code = makePulseCode(6);
    expect(code).toHaveLength(6);
    expect(code).toMatch(/^[A-HJ-NP-Z2-9]+$/);
    expect(makePulseCode(6)).not.toBe(makePulseCode(6));
  });

  it('numbers questions and trims overlong text', () => {
    expect(toPulseQuestion('  Le process est-il suivi ?  ', 0)).toEqual({
      id: 'q1',
      text: 'Le process est-il suivi ?',
      type: 'agreement',
    });
    expect(toPulseQuestion('x'.repeat(500), 4).text).toHaveLength(300);
  });
});
