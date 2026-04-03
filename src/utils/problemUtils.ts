import type {
  EstimationProblem,
  FactorizationProblem,
  Fraction,
  FractionProblem,
  Operation,
  PercentageProblem,
  PowerProblem,
  Problem,
} from '../types';
import { formatFraction } from './fractionUtils';
import { formatMathNumber } from './mathUtils';

export function isFractionProblem(problem: Problem | null): problem is FractionProblem {
  return !!problem && problem.operation.startsWith('fraction-');
}

export function isMixedProblem(problem: Problem | null): problem is Extract<Problem, { operation: 'mixed' }> {
  return !!problem && problem.operation === 'mixed';
}

export function isPowerProblem(problem: Problem | null): problem is PowerProblem {
  return !!problem && problem.operation === 'power';
}

export function isPercentageProblem(problem: Problem | null): problem is PercentageProblem {
  return !!problem && problem.operation === 'percentage';
}

export function isEstimationProblem(problem: Problem | null): problem is EstimationProblem {
  return !!problem && problem.operation === 'estimation';
}

export function isFactorizationProblem(problem: Problem | null): problem is FactorizationProblem {
  return !!problem && problem.operation === 'factorization';
}

export function isPromptProblem(
  problem: Problem | null,
): problem is PercentageProblem | EstimationProblem | FactorizationProblem {
  return isPercentageProblem(problem) || isEstimationProblem(problem) || isFactorizationProblem(problem);
}

export function isDecimalOperation(operation: Operation): boolean {
  return operation.startsWith('decimal-');
}

export function allowsDecimalAnswer(problem: Problem): boolean {
  return isDecimalOperation(problem.operation) || problem.operation === 'percentage';
}

export function parseFactorizationAnswer(value: string): number[] | null {
  const sanitized = value
    .trim()
    .replace(/[xX*]/g, '×')
    .replace(/\s+/g, '');

  if (!sanitized) {
    return null;
  }

  const factors = sanitized
    .split('×')
    .filter(Boolean)
    .map((token) => Number.parseInt(token, 10));

  if (factors.length === 0 || factors.some((factor) => !Number.isInteger(factor) || factor <= 1)) {
    return null;
  }

  return factors.sort((left, right) => left - right);
}

export function normalizeFactorizationAnswer(value: string): string | null {
  const factors = parseFactorizationAnswer(value);
  return factors ? factors.join(' × ') : null;
}

export function formatProblemAnswer(problem: Problem): string {
  if (isFractionProblem(problem)) {
    return formatFraction(problem.answer as Fraction);
  }

  if (isFactorizationProblem(problem)) {
    return problem.answer;
  }

  return formatMathNumber(problem.answer as number);
}
