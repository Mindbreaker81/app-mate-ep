import type {
  AngleProblem,
  AngleType,
  CompareProblem,
  ComparisonOperator,
  ConversionProblem,
  FactorizationProblem,
  Fraction,
  FractionProblem,
  GcdLcmProblem,
  GeometryProblem,
  MeanProblem,
  MixedNumber,
  MixedNumberConvertProblem,
  MixedNumberProblem,
  Operation,
  OrderValuesProblem,
  PercentageProblem,
  Problem,
  RemainderAnswer,
  RemainderProblem,
  RoundDecimalProblem,
  SquareRootProblem,
  UnitConversionProblem,
  WordProblem,
} from '../types';
import { formatFraction, fractionEquals, simplifyFraction } from './fractionUtils';
import { formatMathNumber, numbersEqual } from './mathUtils';

export function isFractionProblem(problem: Problem | null): problem is FractionProblem {
  return !!problem && problem.operation.startsWith('fraction-') && problem.operation !== 'fraction-to-decimal';
}

export function isMixedNumberProblem(problem: Problem | null): problem is MixedNumberProblem {
  return !!problem && (problem.operation === 'mixed-number-addition' || problem.operation === 'mixed-number-subtraction');
}

export function isMixedNumberConvertProblem(problem: Problem | null): problem is MixedNumberConvertProblem {
  return !!problem && problem.operation === 'mixed-number-convert';
}

export function isConversionProblem(problem: Problem | null): problem is ConversionProblem {
  return !!problem && (problem.operation === 'fraction-to-decimal' || problem.operation === 'decimal-to-fraction');
}

export function isRemainderProblem(problem: Problem | null): problem is RemainderProblem {
  return !!problem && problem.operation === 'division-remainder';
}

export function isCompareProblem(problem: Problem | null): problem is CompareProblem {
  return !!problem && problem.operation.startsWith('compare-');
}

export function isOrderValuesProblem(problem: Problem | null): problem is OrderValuesProblem {
  return !!problem && problem.operation === 'order-values';
}

export function isMixedProblem(problem: Problem | null): problem is Extract<Problem, { operation: 'mixed' }> {
  return !!problem && problem.operation === 'mixed';
}

export function isPowerProblem(problem: Problem | null): problem is Extract<Problem, { operation: 'power' }> {
  return !!problem && problem.operation === 'power';
}

export function isSquareRootProblem(problem: Problem | null): problem is SquareRootProblem {
  return !!problem && problem.operation === 'square-root';
}

export function isPercentageProblem(problem: Problem | null): problem is PercentageProblem {
  return !!problem && problem.operation === 'percentage';
}

export function isEstimationProblem(problem: Problem | null): problem is Extract<Problem, { operation: 'estimation' }> {
  return !!problem && problem.operation === 'estimation';
}

export function isFactorizationProblem(problem: Problem | null): problem is FactorizationProblem {
  return !!problem && problem.operation === 'factorization';
}

export function isGcdLcmProblem(problem: Problem | null): problem is GcdLcmProblem {
  return !!problem && (problem.operation === 'gcd' || problem.operation === 'lcm');
}

export function isWordProblem(problem: Problem | null): problem is WordProblem {
  return !!problem && problem.operation === 'word-problem';
}

export function isMeanProblem(problem: Problem | null): problem is MeanProblem {
  return !!problem && problem.operation === 'mean';
}

export function isGeometryNumericProblem(problem: Problem | null): problem is GeometryProblem {
  return !!problem && (
    problem.operation === 'perimeter-rectangle' ||
    problem.operation === 'perimeter-square' ||
    problem.operation === 'area-rectangle' ||
    problem.operation === 'area-triangle'
  );
}

export function isAngleProblem(problem: Problem | null): problem is AngleProblem {
  return !!problem && problem.operation === 'angle-type';
}

export function isUnitConversionProblem(problem: Problem | null): problem is UnitConversionProblem {
  return !!problem && problem.operation === 'unit-conversion';
}

export function isRoundDecimalProblem(problem: Problem | null): problem is RoundDecimalProblem {
  return !!problem && problem.operation === 'round-decimal';
}

export function isMultipleChoiceProblem(
  problem: Problem | null,
): problem is Extract<Problem, { operation: 'estimation' }> | CompareProblem | OrderValuesProblem | AngleProblem {
  return isEstimationProblem(problem) || isCompareProblem(problem) || isOrderValuesProblem(problem) || isAngleProblem(problem);
}

export function isPromptProblem(
  problem: Problem | null,
): problem is
  | PercentageProblem
  | FactorizationProblem
  | GcdLcmProblem
  | WordProblem
  | MeanProblem
  | GeometryProblem
  | UnitConversionProblem
  | RoundDecimalProblem
  | MixedNumberConvertProblem
  | ConversionProblem {
  return (
    isPercentageProblem(problem) ||
    isFactorizationProblem(problem) ||
    isGcdLcmProblem(problem) ||
    isWordProblem(problem) ||
    isMeanProblem(problem) ||
    isGeometryNumericProblem(problem) ||
    isUnitConversionProblem(problem) ||
    isRoundDecimalProblem(problem) ||
    isMixedNumberConvertProblem(problem) ||
    isConversionProblem(problem)
  );
}

export function isDecimalOperation(operation: Operation): boolean {
  return operation.startsWith('decimal-') && operation !== 'decimal-to-fraction';
}

export function allowsDecimalAnswer(problem: Problem): boolean {
  return (
    isDecimalOperation(problem.operation) ||
    problem.operation === 'percentage' ||
    problem.operation === 'fraction-to-decimal' ||
    problem.operation === 'mean' ||
    problem.operation === 'round-decimal' ||
    problem.operation === 'unit-conversion'
  );
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

export function formatMixedNumber(value: MixedNumber): string {
  if (value.numerator === 0) {
    return String(value.whole);
  }
  return `${value.whole} ${value.numerator}/${value.denominator}`;
}

export function mixedNumberEquals(left: MixedNumber, right: MixedNumber): boolean {
  const toImproper = (value: MixedNumber): Fraction =>
    simplifyFraction({
      numerator: value.whole * value.denominator + value.numerator,
      denominator: value.denominator,
    });
  return fractionEquals(toImproper(left), toImproper(right));
}

export function remainderEquals(left: RemainderAnswer, right: RemainderAnswer): boolean {
  return left.quotient === right.quotient && left.remainder === right.remainder;
}

export function parseRemainderAnswer(value: string): RemainderAnswer | null {
  const match = value.trim().match(/^(\d+)\s*(?:resto|r)\s*(\d+)$/i);
  if (!match) {
    return null;
  }
  return {
    quotient: Number.parseInt(match[1], 10),
    remainder: Number.parseInt(match[2], 10),
  };
}

export function formatRemainderAnswer(value: RemainderAnswer): string {
  return `${value.quotient} resto ${value.remainder}`;
}

export function formatProblemAnswer(problem: Problem): string {
  if (isFractionProblem(problem)) {
    return formatFraction(problem.answer);
  }

  if (isMixedNumberProblem(problem)) {
    return formatMixedNumber(problem.answer);
  }

  if (isMixedNumberConvertProblem(problem)) {
    return 'whole' in problem.answer
      ? formatMixedNumber(problem.answer)
      : formatFraction(problem.answer);
  }

  if (isConversionProblem(problem)) {
    return typeof problem.answer === 'number'
      ? formatMathNumber(problem.answer)
      : formatFraction(problem.answer);
  }

  if (isRemainderProblem(problem)) {
    return formatRemainderAnswer(problem.answer);
  }

  if (isCompareProblem(problem)) {
    return problem.answer === '<' ? 'El primero es menor' : problem.answer === '>' ? 'El primero es mayor' : 'Son iguales';
  }

  if (isOrderValuesProblem(problem)) {
    return problem.answer;
  }

  if (isFactorizationProblem(problem)) {
    return problem.answer;
  }

  if (isAngleProblem(problem)) {
    return problem.answer;
  }

  const fallback = problem as { answer?: unknown };
  if (typeof fallback.answer === 'number') {
    return formatMathNumber(fallback.answer);
  }
  if (typeof fallback.answer === 'string') {
    return fallback.answer;
  }

  return '—';
}

export function compareOperatorLabel(operator: ComparisonOperator): string {
  switch (operator) {
    case '<':
      return 'El primero es menor';
    case '>':
      return 'El primero es mayor';
    case '=':
      return 'Son iguales';
    default: {
      const exhaustive: never = operator;
      return exhaustive;
    }
  }
}

export function angleTypeLabel(angle: AngleType): string {
  switch (angle) {
    case 'agudo':
      return 'Agudo';
    case 'recto':
      return 'Recto';
    case 'obtuso':
      return 'Obtuso';
    default: {
      const exhaustive: never = angle;
      return exhaustive;
    }
  }
}

export function getNumericProblemAnswer(problem: Problem): number | null {
  if ('answer' in problem && typeof problem.answer === 'number') {
    return problem.answer;
  }
  return null;
}

export function answersMatch(problem: Problem, userValue: string | Fraction | MixedNumber | RemainderAnswer): boolean {
  if (isFactorizationProblem(problem)) {
    return typeof userValue === 'string' && normalizeFactorizationAnswer(userValue) === problem.answer;
  }

  if (isFractionProblem(problem) && typeof userValue === 'object' && 'numerator' in userValue && !('whole' in userValue)) {
    return fractionEquals(problem.answer, userValue);
  }

  if (isMixedNumberProblem(problem) && typeof userValue === 'object' && 'whole' in userValue) {
    return mixedNumberEquals(problem.answer, userValue);
  }

  if (isMixedNumberConvertProblem(problem)) {
    if ('whole' in problem.answer) {
      return typeof userValue === 'object' && 'whole' in userValue && mixedNumberEquals(problem.answer, userValue);
    }
    return typeof userValue === 'object' && 'numerator' in userValue && !('whole' in userValue) &&
      fractionEquals(problem.answer, userValue);
  }

  if (isConversionProblem(problem)) {
    if (typeof problem.answer === 'number') {
      const numeric = typeof userValue === 'string' ? Number.parseFloat(userValue.replace(',', '.')) : null;
      return numeric !== null && numbersEqual(numeric, problem.answer);
    }
    return typeof userValue === 'object' && 'numerator' in userValue && !('whole' in userValue) &&
      fractionEquals(problem.answer, userValue);
  }

  if (isRemainderProblem(problem)) {
    if (typeof userValue === 'object' && 'quotient' in userValue) {
      return remainderEquals(problem.answer, userValue);
    }
    if (typeof userValue === 'string') {
      const parsed = parseRemainderAnswer(userValue);
      return parsed !== null && remainderEquals(problem.answer, parsed);
    }
    return false;
  }

  if (isCompareProblem(problem)) {
    return userValue === problem.answer;
  }

  if (isOrderValuesProblem(problem)) {
    return userValue === problem.answer;
  }

  if (isAngleProblem(problem)) {
    return userValue === problem.answer;
  }

  if (isEstimationProblem(problem)) {
    const numeric = typeof userValue === 'string' ? Number.parseFloat(userValue) : null;
    return numeric !== null && numbersEqual(numeric, problem.answer);
  }

  const numericAnswer = getNumericProblemAnswer(problem);
  if (numericAnswer === null) {
    return false;
  }

  const parsed = typeof userValue === 'string'
    ? Number.parseFloat(userValue.trim().replace(',', '.'))
    : typeof userValue === 'number'
      ? userValue
      : null;

  return parsed !== null && !Number.isNaN(parsed) && numbersEqual(parsed, numericAnswer);
}
