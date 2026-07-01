import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateProblem } from '../problemGenerator';
import {
  isEstimationProblem,
  isFactorizationProblem,
  isFractionProblem,
  isPowerProblem,
  isPromptProblem,
  isSquareRootProblem,
} from '../problemUtils';

type BinaryNumericProblem = Extract<
  ReturnType<typeof generateProblem>,
  { num1: number; num2: number; answer: number }
>;

const isBinaryNumericProblem = (problem: ReturnType<typeof generateProblem>): problem is BinaryNumericProblem =>
  'num1' in problem &&
  'num2' in problem &&
  typeof problem.num1 === 'number' &&
  typeof problem.num2 === 'number' &&
  typeof problem.answer === 'number';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('5th grade curriculum expansion', () => {
  it('generates decimal problems for 5th grade', () => {
    const problem = generateProblem(5, 'decimals', '5e');

    expect(isBinaryNumericProblem(problem)).toBe(true);
    if (!isBinaryNumericProblem(problem)) return;

    expect(problem.operation.startsWith('decimal-')).toBe(true);
    expect(Number.isFinite(problem.answer)).toBe(true);
  });

  it('generates power or square-root problems in powers mode', () => {
    const problem = generateProblem(5, 'powers', '5e');

    expect(isPowerProblem(problem) || isSquareRootProblem(problem)).toBe(true);
    if (isPowerProblem(problem)) {
      expect(problem.answer).toBe(problem.base ** problem.exponent);
    }
    if (isSquareRootProblem(problem)) {
      expect(problem.answer * problem.answer).toBe(problem.radicand);
    }
  });

  it('generates percentage or proportionality prompts', () => {
    const problem = generateProblem(5, 'percentages', '5e');

    expect(isPromptProblem(problem)).toBe(true);
    if (!isPromptProblem(problem) || isFactorizationProblem(problem)) return;

    expect(problem.operation).toBe('percentage');
    expect(problem.prompt.length).toBeGreaterThan(0);
    expect(typeof problem.answer).toBe('number');
  });

  it('generates estimation problems with the correct option included', () => {
    const problem = generateProblem(5, 'estimation', '5e');

    expect(isEstimationProblem(problem)).toBe(true);
    if (!isEstimationProblem(problem)) return;

    expect(problem.options).toContain(problem.answer);
    expect(problem.options).toHaveLength(4);
  });

  it('generates factorization problems with normalized answers', () => {
    const problem = generateProblem(5, 'factorization', '5e');

    expect(isFactorizationProblem(problem)).toBe(true);
    if (!isFactorizationProblem(problem)) return;

    const factors = problem.answer.split(' × ').map((value) => Number.parseInt(value, 10));
    expect(factors.reduce((total, factor) => total * factor, 1)).toBe(problem.target);
  });

  it('can generate fraction multiplication in 5th grade fractions mode', () => {
    vi.spyOn(Math, 'random').mockReturnValueOnce(0.6).mockReturnValue(0.2);
    const problem = generateProblem(5, 'fractions', '5e');

    expect(isFractionProblem(problem)).toBe(true);
    if (!isFractionProblem(problem)) return;

    expect(problem.operation).toBe('fraction-multiplication');
    expect(problem.answer.numerator / problem.answer.denominator).toBeCloseTo(
      (problem.num1.numerator / problem.num1.denominator) *
        (problem.num2.numerator / problem.num2.denominator),
    );
  });

  it('can generate fraction division in 5th grade fractions mode', () => {
    vi.spyOn(Math, 'random').mockReturnValueOnce(0.9).mockReturnValue(0.2);
    const problem = generateProblem(5, 'fractions', '5e');

    expect(isFractionProblem(problem)).toBe(true);
    if (!isFractionProblem(problem)) return;

    expect(problem.operation).toBe('fraction-division');
    expect(problem.answer.numerator / problem.answer.denominator).toBeCloseTo(
      (problem.num1.numerator / problem.num1.denominator) /
        (problem.num2.numerator / problem.num2.denominator),
    );
  });
});
