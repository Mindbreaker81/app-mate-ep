import { describe, expect, it } from 'vitest';
import { LEVELS } from '../gameConfig';
import { generateOperationForTest } from '../generators';
import {
  answersMatch,
  formatProblemAnswer,
  isFractionPercentProblem,
  isPromptProblem,
} from '../problemUtils';
import type { FractionPercentProblem } from '../../types';

const LEVEL_2 = LEVELS[1];

describe('fraction-percent', () => {
  it('genera una de las tres variantes con respuesta exacta', () => {
    for (let i = 0; i < 60; i += 1) {
      const problem = generateOperationForTest('fraction-percent', 2, LEVEL_2);
      expect(problem.operation).toBe('fraction-percent');
      expect(isFractionPercentProblem(problem)).toBe(true);
      expect(isPromptProblem(problem)).toBe(true);
      const percent = problem as FractionPercentProblem;
      if (typeof percent.answer === 'number') {
        // Porcentaje exacto, entero y entre 0 y 100 (sin negativos en Primaria).
        expect(Number.isInteger(percent.answer)).toBe(true);
        expect(percent.answer).toBeGreaterThan(0);
        expect(percent.answer).toBeLessThanOrEqual(100);
      } else {
        // Fracción simplificada, propia y positiva.
        const fraction = percent.answer;
        expect(fraction.numerator).toBeGreaterThan(0);
        expect(fraction.numerator).toBeLessThan(fraction.denominator);
        const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
        expect(gcd(fraction.numerator, fraction.denominator)).toBe(1);
      }
    }
  });

  it('acepta el porcentaje con o sin «%» y en formato formateado', () => {
    for (let i = 0; i < 40; i += 1) {
      const problem = generateOperationForTest('fraction-percent', 2, LEVEL_2) as FractionPercentProblem;
      if (typeof problem.answer !== 'number') {
        continue;
      }
      expect(answersMatch(problem, String(problem.answer))).toBe(true);
      expect(answersMatch(problem, `${problem.answer}%`)).toBe(true);
      expect(answersMatch(problem, `${problem.answer} %`)).toBe(true);
      expect(answersMatch(problem, formatProblemAnswer(problem))).toBe(true);
      expect(answersMatch(problem, String(problem.answer + 1))).toBe(false);
    }
  });

  it('acepta fracciones equivalentes y el formato formateado', () => {
    for (let i = 0; i < 40; i += 1) {
      const problem = generateOperationForTest('fraction-percent', 2, LEVEL_2) as FractionPercentProblem;
      if (typeof problem.answer === 'number') {
        continue;
      }
      const doubled = {
        numerator: problem.answer.numerator * 2,
        denominator: problem.answer.denominator * 2,
      };
      expect(answersMatch(problem, doubled), `equivalente ${doubled.numerator}/${doubled.denominator} rechazada`).toBe(true);
      expect(answersMatch(problem, formatProblemAnswer(problem))).toBe(true);
      expect(answersMatch(problem, { numerator: problem.answer.numerator, denominator: problem.answer.denominator + 1 })).toBe(false);
    }
  });
});
