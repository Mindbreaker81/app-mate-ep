import { describe, it, expect } from 'vitest';
import { generateProblem } from '../problemGenerator';

function fractionEquals(a: { numerator: number; denominator: number }, b: { numerator: number; denominator: number }) {
  return a.numerator * b.denominator === b.numerator * a.denominator;
}

describe('Fractions generation', () => {
  it('should generate fraction addition or subtraction with correct result', () => {
    const p = generateProblem(1, 'fractions');

    expect(['fraction-addition', 'fraction-subtraction']).toContain(p.operation);

    if (p.operation === 'fraction-addition' || p.operation === 'fraction-subtraction') {
      const a = p.num1;
      const b = p.num2;
      const ans = p.answer;

      if (p.operation === 'fraction-addition') {
        const expected = {
          numerator: a.numerator * b.denominator + b.numerator * a.denominator,
          denominator: a.denominator * b.denominator,
        };
        expect(fractionEquals(expected, ans)).toBe(true);
      } else {
        const expected = {
          numerator: a.numerator * b.denominator - b.numerator * a.denominator,
          denominator: a.denominator * b.denominator,
        };
        expect(fractionEquals(expected, ans)).toBe(true);
      }

      expect(typeof p.explanation).toBe('string');
      expect(p.explanation.length).toBeGreaterThan(0);
    }
  });
});
