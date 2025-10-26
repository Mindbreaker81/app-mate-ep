import { describe, it, expect } from 'vitest';
import { generateProblem } from '../problemGenerator';
import type { MixedProblem } from '../../types';

const isMixedProblem = (problem: unknown): problem is MixedProblem =>
  typeof problem === 'object' &&
  problem !== null &&
  'operation' in problem &&
  (problem as { operation: string }).operation === 'mixed';

const evaluateExpression = (expression: string): number => {
  const jsExpression = expression.replace(/×/g, '*').replace(/÷/g, '/');
  return Function(`return ${jsExpression}`)();
};

describe('Mixed operation generation', () => {
  it('generates expressions with mixed precedence and integer results', () => {
    const problem = generateProblem(4, 'mixed');
    expect(isMixedProblem(problem)).toBe(true);
    if (!isMixedProblem(problem)) return;

    expect(problem.expression).toMatch(/[×÷]/);
    const computed = evaluateExpression(problem.expression);
    expect(computed).toBe(problem.answer);
    expect(Number.isInteger(problem.answer)).toBe(true);
  });

  it('provides step-by-step explanation for the generated expression', () => {
    const problem = generateProblem(6, 'mixed');
    if (!isMixedProblem(problem)) {
      expect.fail('Expected mixed problem');
    }

    expect(problem.explanation).toMatch(/Paso 1:/);
    expect(problem.explanation).toMatch(/Paso 2:/);
  });
});
