import { describe, it, expect, vi, afterEach } from 'vitest';
import { generateProblem, calculateResponseTime, getDifficulty } from '../problemGenerator';
import { LEVELS } from '../gameConfig';
import type { Fraction, Problem } from '../../types';

type NumericProblem = Extract<Problem, { answer: number }>;
type FractionProblem = Extract<Problem, { answer: Fraction }>;

const isNumericProblem = (problem: Problem): problem is NumericProblem => typeof problem.answer === 'number';
const isFractionProblem = (problem: Problem): problem is FractionProblem =>
  typeof problem.answer === 'object' && problem.answer !== null;

afterEach(() => {
  vi.restoreAllMocks();
});

describe('problemGenerator', () => {
  describe('generateProblem', () => {
    it('should generate a problem with valid structure', () => {
      const problem = generateProblem(1);

      expect(problem).toHaveProperty('operation');
      expect(problem).toHaveProperty('explanation');

      if (isNumericProblem(problem)) {
        expect(typeof problem.num1).toBe('number');
        expect(typeof problem.num2).toBe('number');
        expect(typeof problem.answer).toBe('number');
      } else if (isFractionProblem(problem)) {
        expect(typeof problem.num1.numerator).toBe('number');
        expect(typeof problem.num1.denominator).toBe('number');
        expect(typeof problem.num2.numerator).toBe('number');
        expect(typeof problem.num2.denominator).toBe('number');
        expect(typeof problem.answer.numerator).toBe('number');
        expect(typeof problem.answer.denominator).toBe('number');
      } else {
        expect.fail('Generated problem has unexpected shape');
      }
      expect(typeof problem.explanation).toBe('string');
    });

    it('should generate addition problems correctly', () => {
      const problem = generateProblem(1, 'addition');
      if (!isNumericProblem(problem)) {
        expect.fail('Addition problem should be numeric');
      }
      expect(problem.operation).toBe('addition');
      expect(problem.answer).toBe(problem.num1 + problem.num2);
      expect(problem.explanation).toContain('Suma');
    });

    it('should generate subtraction problems with positive results', () => {
      const problem = generateProblem(1, 'subtraction');
      if (!isNumericProblem(problem)) {
        expect.fail('Subtraction problem should be numeric');
      }
      expect(problem.operation).toBe('subtraction');
      expect(problem.answer).toBe(problem.num1 - problem.num2);
      expect(problem.answer).toBeGreaterThan(0);
      expect(problem.explanation).toContain('Resta');
    });

    it('should generate multiplication problems correctly', () => {
      const problem = generateProblem(1, 'multiplication');
      if (!isNumericProblem(problem)) {
        expect.fail('Multiplication problem should be numeric');
      }
      expect(problem.operation).toBe('multiplication');
      expect(problem.answer).toBe(problem.num1 * problem.num2);
      expect(problem.explanation).toContain('Multiplicación');
    });

    it('should generate division problems with exact results', () => {
      const problem = generateProblem(1, 'division');
      if (!isNumericProblem(problem)) {
        expect.fail('Division problem should be numeric');
      }
      expect(problem.operation).toBe('division');
      expect(problem.num1).toBe(problem.num2 * problem.answer);
      expect(problem.explanation).toContain('División');
    });

    it('should respect level constraints for addition', () => {
      const level1Problem = generateProblem(1, 'addition');
      const level4Problem = generateProblem(4, 'addition');

      const l1Max = LEVELS.find(l => l.id === 1)!.maxNumber;
      const l4Max = LEVELS.find(l => l.id === 4)!.maxNumber;

      if (!isNumericProblem(level1Problem) || !isNumericProblem(level4Problem)) {
        expect.fail('Addition problems should be numeric');
      }

      expect(level1Problem.num1).toBeGreaterThanOrEqual(1);
      expect(level1Problem.num2).toBeGreaterThanOrEqual(1);
      expect(level1Problem.num1).toBeLessThanOrEqual(l1Max);
      expect(level1Problem.num2).toBeLessThanOrEqual(l1Max);

      expect(level4Problem.num1).toBeGreaterThanOrEqual(1);
      expect(level4Problem.num2).toBeGreaterThanOrEqual(1);
      expect(level4Problem.num1).toBeLessThanOrEqual(l4Max);
      expect(level4Problem.num2).toBeLessThanOrEqual(l4Max);
    });
  });

  describe('calculateResponseTime', () => {
    it('should calculate response time correctly', () => {
      const startTime = 1_000;
      vi.spyOn(Date, 'now').mockReturnValue(startTime + 2_500);

      const responseTime = calculateResponseTime(startTime);
      expect(responseTime).toBe(3);
      expect(typeof responseTime).toBe('number');
    });
  });

  describe('getDifficulty', () => {
    it('should return correct difficulty for different levels', () => {
      expect(getDifficulty(1, 'addition')).toBe('easy');
      expect(getDifficulty(2, 'addition')).toBe('medium');
      expect(getDifficulty(3, 'addition')).toBe('medium');
      expect(getDifficulty(4, 'addition')).toBe('hard');
    });

    it('should return hard for multiplication at high levels', () => {
      expect(getDifficulty(3, 'multiplication')).toBe('hard');
      expect(getDifficulty(4, 'multiplication')).toBe('hard');
    });

    it('should return hard for division at medium and high levels', () => {
      expect(getDifficulty(2, 'division')).toBe('hard');
      expect(getDifficulty(3, 'division')).toBe('hard');
      expect(getDifficulty(4, 'division')).toBe('hard');
    });
  });
}); 