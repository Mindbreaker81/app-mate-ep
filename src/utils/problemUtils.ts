import type {
  AlgebraSubstitutionProblem,
  AngleProblem,
  AngleType,
  CircleProblem,
  CompareProblem,
  ComparisonOperator,
  ConversionProblem,
  FactorizationProblem,
  FinanceProblem,
  Fraction,
  FractionProblem,
  GcdLcmProblem,
  GeometryProblem,
  IntegerArithmeticProblem,
  IntegerCompareProblem,
  IntegerOrderProblem,
  InverseProportionProblem,
  FractionPercentProblem,
  NumberLineProblem,
  DataChartProblem,
  MeanProblem,
  MedianProblem,
  MixedNumber,
  MixedNumberConvertProblem,
  MixedNumberProblem,
  ModeProblem,
  Operation,
  OrderValuesProblem,
  PlaceValueProblem,
  PercentageProblem,
  PowerGeneralProblem,
  PowerOfTenProblem,
  ProbabilityCompareProblem,
  ProbabilityProblem,
  Problem,
  ProportionalityProblem,
  RangeProblem,
  RatioProblem,
  RemainderAnswer,
  RemainderProblem,
  RoundDecimalProblem,
  ScaleProblem,
  SequenceProblem,
  SimpleEquationProblem,
  SquareRootProblem,
  TriangleAngleProblem,
  TwoStepEquationProblem,
  UnitConversionProblem,
  VolumeProblem,
  WordProblem,
} from '../types';
import { formatFraction, fractionEquals, simplifyFraction } from './fractionUtils';
import { formatMathNumber, numbersEqual } from './mathUtils';

export function isFractionProblem(problem: Problem | null): problem is FractionProblem {
  // Ojo: 'fraction-percent' también empieza por «fraction-» pero su respuesta
  // es un porcentaje o una fracción equivalente; se maneja aparte.
  return !!problem &&
    problem.operation.startsWith('fraction-') &&
    problem.operation !== 'fraction-to-decimal' &&
    problem.operation !== 'fraction-percent';
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

export function isPowerGeneralProblem(problem: Problem | null): problem is PowerGeneralProblem {
  return !!problem && problem.operation === 'power-general';
}

export function isPowerOfTenProblem(problem: Problem | null): problem is PowerOfTenProblem {
  return !!problem && problem.operation === 'power-of-ten';
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

export function isIntegerArithmeticProblem(problem: Problem | null): problem is IntegerArithmeticProblem {
  return (
    !!problem &&
    (problem.operation === 'integer-addition' ||
      problem.operation === 'integer-subtraction' ||
      problem.operation === 'integer-multiplication' ||
      problem.operation === 'integer-division')
  );
}

export function isIntegerCompareProblem(problem: Problem | null): problem is IntegerCompareProblem {
  return !!problem && problem.operation === 'integer-compare';
}

export function isIntegerOrderProblem(problem: Problem | null): problem is IntegerOrderProblem {
  return !!problem && problem.operation === 'integer-order';
}

export function isSimpleEquationProblem(problem: Problem | null): problem is SimpleEquationProblem {
  return !!problem && problem.operation === 'simple-equation';
}

export function isRatioProblem(problem: Problem | null): problem is RatioProblem {
  return !!problem && (problem.operation === 'ratio' || problem.operation === 'proportion');
}

export function isMedianProblem(problem: Problem | null): problem is MedianProblem {
  return !!problem && problem.operation === 'median';
}

export function isModeProblem(problem: Problem | null): problem is ModeProblem {
  return !!problem && problem.operation === 'mode';
}

export function isRangeProblem(problem: Problem | null): problem is RangeProblem {
  return !!problem && problem.operation === 'range';
}

export function isProbabilityProblem(problem: Problem | null): problem is ProbabilityProblem {
  return !!problem && problem.operation === 'probability-simple';
}

export function isCircleProblem(problem: Problem | null): problem is CircleProblem {
  return !!problem && (problem.operation === 'circle-area' || problem.operation === 'circle-circumference');
}

export function isVolumeProblem(problem: Problem | null): problem is VolumeProblem {
  return !!problem && problem.operation === 'volume-rectangular-prism';
}

export function isTriangleAngleProblem(problem: Problem | null): problem is TriangleAngleProblem {
  return !!problem && problem.operation === 'triangle-angle-sum';
}

export function isScaleProblem(problem: Problem | null): problem is ScaleProblem {
  return !!problem && problem.operation === 'scale-conversion';
}

export function isPlaceValueProblem(problem: Problem | null): problem is PlaceValueProblem {
  return !!problem && problem.operation === 'place-value';
}

export function isSequenceProblem(problem: Problem | null): problem is SequenceProblem {
  return !!problem && problem.operation === 'sequence';
}

export function isProportionalityProblem(problem: Problem | null): problem is ProportionalityProblem {
  return !!problem && problem.operation === 'proportionality-check';
}

export function isFinanceProblem(problem: Problem | null): problem is FinanceProblem {
  return !!problem && problem.operation === 'finance';
}

export function isProbabilityCompareProblem(problem: Problem | null): problem is ProbabilityCompareProblem {
  return !!problem && problem.operation === 'probability-compare';
}

export function isTwoStepEquationProblem(problem: Problem | null): problem is TwoStepEquationProblem {
  return !!problem && problem.operation === 'two-step-equation';
}

export function isInverseProportionProblem(problem: Problem | null): problem is InverseProportionProblem {
  return !!problem && problem.operation === 'inverse-proportion';
}

export function isFractionPercentProblem(problem: Problem | null): problem is FractionPercentProblem {
  return !!problem && problem.operation === 'fraction-percent';
}

export function isNumberLineProblem(problem: Problem | null): problem is NumberLineProblem {
  return !!problem && (problem.operation === 'number-line-decimal' || problem.operation === 'number-line-integer');
}

export function isAlgebraSubstitutionProblem(problem: Problem | null): problem is AlgebraSubstitutionProblem {
  return !!problem && problem.operation === 'algebra-substitution';
}

export function isDataChartProblem(problem: Problem | null): problem is DataChartProblem {
  return !!problem && (problem.operation === 'bar-chart-reading' || problem.operation === 'pictogram-reading');
}

export function isMultipleChoiceProblem(
  problem: Problem | null,
): problem is
  | Extract<Problem, { operation: 'estimation' }>
  | CompareProblem
  | OrderValuesProblem
  | AngleProblem
  | IntegerCompareProblem
  | IntegerOrderProblem
  | ProbabilityProblem
  | ProportionalityProblem
  | ProbabilityCompareProblem
  | DataChartProblem {
  return (
    isEstimationProblem(problem) ||
    isCompareProblem(problem) ||
    isOrderValuesProblem(problem) ||
    isAngleProblem(problem) ||
    isIntegerCompareProblem(problem) ||
    isIntegerOrderProblem(problem) ||
    isProbabilityProblem(problem) ||
    isProportionalityProblem(problem) ||
    isProbabilityCompareProblem(problem) ||
    // Los gráficos de datos solo son de opción múltiple en «el más frecuente».
    (isDataChartProblem(problem) && problem.question === 'most-frequent')
  );
}

export function isPromptProblem(
  problem: Problem | null,
): problem is
  | PercentageProblem
  | FactorizationProblem
  | GcdLcmProblem
  | WordProblem
  | MeanProblem
  | MedianProblem
  | ModeProblem
  | RangeProblem
  | GeometryProblem
  | UnitConversionProblem
  | RoundDecimalProblem
  | MixedNumberConvertProblem
  | ConversionProblem
  | SimpleEquationProblem
  | RatioProblem
  | CircleProblem
  | VolumeProblem
  | TriangleAngleProblem
  | ScaleProblem
  | PlaceValueProblem
  | SequenceProblem
  | FinanceProblem
  | TwoStepEquationProblem
  | InverseProportionProblem
  | FractionPercentProblem
  | AlgebraSubstitutionProblem {
  return (
    isPercentageProblem(problem) ||
    isFactorizationProblem(problem) ||
    isGcdLcmProblem(problem) ||
    isWordProblem(problem) ||
    isMeanProblem(problem) ||
    isMedianProblem(problem) ||
    isModeProblem(problem) ||
    isRangeProblem(problem) ||
    isGeometryNumericProblem(problem) ||
    isUnitConversionProblem(problem) ||
    isRoundDecimalProblem(problem) ||
    isMixedNumberConvertProblem(problem) ||
    isConversionProblem(problem) ||
    isSimpleEquationProblem(problem) ||
    isRatioProblem(problem) ||
    isCircleProblem(problem) ||
    isVolumeProblem(problem) ||
    isTriangleAngleProblem(problem) ||
    isScaleProblem(problem) ||
    isPlaceValueProblem(problem) ||
    isSequenceProblem(problem) ||
    isFinanceProblem(problem) ||
    isTwoStepEquationProblem(problem) ||
    isInverseProportionProblem(problem) ||
    isFractionPercentProblem(problem) ||
    isAlgebraSubstitutionProblem(problem)
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
    problem.operation === 'median' ||
    problem.operation === 'round-decimal' ||
    problem.operation === 'unit-conversion' ||
    problem.operation === 'probability-simple' ||
    problem.operation === 'finance' ||
    problem.operation === 'circle-area' ||
    problem.operation === 'circle-circumference' ||
    problem.operation === 'scale-conversion' ||
    problem.operation === 'number-line-decimal'
  );
}

const NEGATIVE_ANSWER_OPERATIONS = new Set([
  'integer-addition',
  'integer-subtraction',
  'integer-multiplication',
  'integer-division',
  'simple-equation',
  'number-line-integer',
  'algebra-substitution',
]);

/** Operaciones cuya respuesta puede ser negativa (necesitan botón ± en móvil). */
export function allowsNegativeAnswer(problem: Problem): boolean {
  return NEGATIVE_ANSWER_OPERATIONS.has(problem.operation);
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

  if (isFractionPercentProblem(problem)) {
    return typeof problem.answer === 'number'
      ? `${formatMathNumber(problem.answer)} %`
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

/** Parser estricto: la cadena completa debe ser un número (entero o decimal con coma o punto). */
export function parseFullNumber(value: string): number | null {
  const normalized = value.trim().replace(',', '.');
  if (!/^-?\d+(?:\.\d+)?$/.test(normalized)) {
    return null;
  }
  const parsed = Number.parseFloat(normalized);
  return Number.isNaN(parsed) ? null : parsed;
}

/** Parser de fracciones escritas como "a/b" (acepta espacios y negativos). */
export function parseFractionString(value: string): { numerator: number; denominator: number } | null {
  const match = value.trim().match(/^(-?\d+)\s*\/\s*(-?\d+)$/);
  if (!match) {
    return null;
  }
  const numerator = Number.parseInt(match[1], 10);
  const denominator = Number.parseInt(match[2], 10);
  if (Number.isNaN(numerator) || Number.isNaN(denominator) || denominator === 0) {
    return null;
  }
  return { numerator, denominator };
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
      const numeric = typeof userValue === 'string' ? parseFullNumber(userValue) : null;
      return numeric !== null && numbersEqual(numeric, problem.answer);
    }
    return typeof userValue === 'object' && 'numerator' in userValue && !('whole' in userValue) &&
      fractionEquals(problem.answer, userValue);
  }

  if (isFractionPercentProblem(problem)) {
    if (typeof problem.answer === 'number') {
      // Porcentaje: se acepta «75», «75%» y «75 %».
      const percent = typeof userValue === 'string'
        ? parseFullNumber(userValue.replace('%', '').trim())
        : typeof userValue === 'number'
          ? userValue
          : null;
      return percent !== null && numbersEqual(percent, problem.answer);
    }
    return typeof userValue === 'string'
      ? (() => {
          const parsed = parseFractionString(userValue);
          return parsed !== null && fractionEquals(problem.answer, parsed);
        })()
      : typeof userValue === 'object' && 'numerator' in userValue && !('whole' in userValue) &&
        fractionEquals(problem.answer, userValue);
  }

  if (isDataChartProblem(problem) && typeof problem.answer === 'string') {
    // «El más frecuente»: la respuesta es la opción tocada.
    return userValue === problem.answer;
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

  if (isProportionalityProblem(problem) || isProbabilityCompareProblem(problem)) {
    return userValue === problem.answer;
  }

  if (isIntegerCompareProblem(problem)) {
    return userValue === problem.answer;
  }

  if (isIntegerOrderProblem(problem)) {
    return userValue === problem.answer;
  }

  if (isProbabilityProblem(problem)) {
    // Se acepta el decimal exacto o una fracción "a/b" equivalente al caso favorable/total.
    const numeric = typeof userValue === 'string' ? parseFullNumber(userValue) : null;
    if (numeric !== null) {
      return numbersEqual(numeric, problem.answer);
    }
    const probability = problem as ProbabilityProblem & { favorable?: number; total?: number };
    if (typeof probability.favorable === 'number' && typeof probability.total === 'number') {
      const asFraction = typeof userValue === 'string' ? parseFractionString(userValue) : null;
      return asFraction !== null && fractionEquals(asFraction, { numerator: probability.favorable, denominator: probability.total });
    }
    return false;
  }

  if (isEstimationProblem(problem)) {
    const numeric = typeof userValue === 'string' ? parseFullNumber(userValue) : null;
    return numeric !== null && numbersEqual(numeric, problem.answer);
  }

  const numericAnswer = getNumericProblemAnswer(problem);
  if (numericAnswer === null) {
    return false;
  }

  const parsed = typeof userValue === 'string'
    ? parseFullNumber(userValue)
    : typeof userValue === 'number'
      ? userValue
      : null;

  return parsed !== null && numbersEqual(parsed, numericAnswer);
}
