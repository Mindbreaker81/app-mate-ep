import { describe, expect, it } from 'vitest';
import { generateProblem } from '../problemGenerator';
import {
  isCompareProblem,
  isGeometryNumericProblem,
  isRemainderProblem,
  isWordProblem,
} from '../problemUtils';

describe('v2 curriculum generators', () => {
  it('generates division with remainder for 5th grade', () => {
    const problem = generateProblem(5, 'division', '5e');
    if (problem.operation === 'division-remainder') {
      expect(isRemainderProblem(problem)).toBe(true);
      expect(problem.answer.remainder).toBeLessThan(problem.num2);
    }
  });

  it('generates word problems', () => {
    const problem = generateProblem(5, 'word-problems', '5e');
    expect(isWordProblem(problem)).toBe(true);
    expect(problem.prompt.length).toBeGreaterThan(10);
  });

  it('generates comparison problems', () => {
    const problem = generateProblem(5, 'comparison', '5e');
    expect(
      isCompareProblem(problem) || problem.operation === 'order-values',
    ).toBe(true);
  });

  it('generates geometry problems', () => {
    const problem = generateProblem(5, 'geometry', '5e');
    expect(
      isGeometryNumericProblem(problem) || problem.operation === 'angle-type',
    ).toBe(true);
  });

  it('does not expose 5th grade word problems to 4th grade', () => {
    for (let index = 0; index < 20; index += 1) {
      const problem = generateProblem(5, 'all', '4t');
      expect(problem.operation).not.toBe('word-problem');
    }
  });
});
