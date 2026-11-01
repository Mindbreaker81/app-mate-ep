import type {
  ConversionProblem,
  Fraction,
  FractionPercentProblem,
  FractionProblem,
  MixedNumber,
  MixedNumberConvertProblem,
  MixedNumberProblem,
} from '../../types';
import { formatFraction, simplifyFraction } from '../fractionUtils';
import { formatMathNumber, roundToPrecision } from '../mathUtils';
import { EXACT_DECIMAL_DENOMINATORS, randomInt, resolveLevelLimits, type LevelConfig } from './shared';

function randomProperFraction(maxDenominator: number = 12): Fraction {
  const denominator = randomInt(3, Math.max(3, maxDenominator));
  const numerator = randomInt(1, denominator - 1);
  return { numerator, denominator };
}

function addFractions(a: Fraction, b: Fraction): Fraction {
  const numerator = a.numerator * b.denominator + b.numerator * a.denominator;
  const denominator = a.denominator * b.denominator;
  return simplifyFraction({ numerator, denominator });
}

function subtractFractions(a: Fraction, b: Fraction): Fraction {
  const numerator = a.numerator * b.denominator - b.numerator * a.denominator;
  const denominator = a.denominator * b.denominator;
  return simplifyFraction({ numerator, denominator });
}

function multiplyFractions(a: Fraction, b: Fraction): Fraction {
  return simplifyFraction({
    numerator: a.numerator * b.numerator,
    denominator: a.denominator * b.denominator,
  });
}

function divideFractions(a: Fraction, b: Fraction): Fraction {
  return simplifyFraction({
    numerator: a.numerator * b.denominator,
    denominator: a.denominator * b.numerator,
  });
}

function mixedToImproper(value: MixedNumber): Fraction {
  return simplifyFraction({
    numerator: value.whole * value.denominator + value.numerator,
    denominator: value.denominator,
  });
}

function improperToMixed(value: Fraction): MixedNumber {
  const simplified = simplifyFraction(value);
  const whole = Math.floor(simplified.numerator / simplified.denominator);
  const numerator = simplified.numerator % simplified.denominator;
  return { whole, numerator, denominator: simplified.denominator };
}

function randomMixedNumber(maxWhole: number, maxDenominator: number): MixedNumber {
  const whole = randomInt(1, Math.max(1, maxWhole));
  const denominator = randomInt(3, Math.max(3, maxDenominator));
  const numerator = randomInt(1, denominator - 1);
  return { whole, numerator, denominator };
}

function formatMixedNumber(value: MixedNumber): string {
  if (value.numerator === 0) {
    return String(value.whole);
  }
  return `${value.whole} ${value.numerator}/${value.denominator}`;
}

export function generateFractionAddition(levelConfig: LevelConfig): FractionProblem {
  const frac1 = randomProperFraction(levelConfig.maxDenominator);
  const frac2 = randomProperFraction(levelConfig.maxDenominator);
  const answer = addFractions(frac1, frac2);
  return {
    num1: frac1,
    num2: frac2,
    operation: 'fraction-addition',
    answer,
    explanation: `Paso 1: Denominador común.\nPaso 2: Suma numeradores.\nPaso 3: Simplifica: ${formatFraction(answer)}.`,
  };
}

export function generateFractionSubtraction(levelConfig: LevelConfig): FractionProblem {
  let frac1 = randomProperFraction(levelConfig.maxDenominator);
  let frac2 = randomProperFraction(levelConfig.maxDenominator);
  if (frac1.numerator * frac2.denominator < frac2.numerator * frac1.denominator) {
    [frac1, frac2] = [frac2, frac1];
  }
  const answer = subtractFractions(frac1, frac2);
  return {
    num1: frac1,
    num2: frac2,
    operation: 'fraction-subtraction',
    answer,
    explanation: `Paso 1: Denominador común.\nPaso 2: Resta numeradores.\nPaso 3: Simplifica: ${formatFraction(answer)}.`,
  };
}

export function generateFractionMultiplication(levelConfig: LevelConfig): FractionProblem {
  const frac1 = randomProperFraction(levelConfig.maxDenominator);
  const frac2 = randomProperFraction(levelConfig.maxDenominator);
  const answer = multiplyFractions(frac1, frac2);
  return {
    num1: frac1,
    num2: frac2,
    operation: 'fraction-multiplication',
    answer,
    explanation: `Paso 1: Multiplica numeradores y denominadores.\nPaso 2: Simplifica: ${formatFraction(answer)}.`,
  };
}

export function generateFractionDivision(levelConfig: LevelConfig): FractionProblem {
  const frac1 = randomProperFraction(levelConfig.maxDenominator);
  const frac2 = randomProperFraction(levelConfig.maxDenominator);
  const answer = divideFractions(frac1, frac2);
  return {
    num1: frac1,
    num2: frac2,
    operation: 'fraction-division',
    answer,
    explanation: `Paso 1: Invierte la segunda fracción.\nPaso 2: Multiplica.\nPaso 3: Simplifica: ${formatFraction(answer)}.`,
  };
}

export function generateMixedNumberAddition(levelConfig: LevelConfig): MixedNumberProblem {
  const limits = resolveLevelLimits(levelConfig);
  const num1 = randomMixedNumber(limits.maxMixedFractionWhole, levelConfig.maxDenominator);
  const num2 = randomMixedNumber(limits.maxMixedFractionWhole, levelConfig.maxDenominator);
  const answerImproper = addFractions(mixedToImproper(num1), mixedToImproper(num2));
  const answer = improperToMixed(answerImproper);
  return {
    num1,
    num2,
    operation: 'mixed-number-addition',
    answer,
    explanation:
      `Paso 1: Convierte a impropias.\n` +
      `Paso 2: Suma ${formatMixedNumber(num1)} + ${formatMixedNumber(num2)}.\n` +
      `Paso 3: Resultado: ${formatMixedNumber(answer)}.`,
  };
}

export function generateMixedNumberSubtraction(levelConfig: LevelConfig): MixedNumberProblem {
  const limits = resolveLevelLimits(levelConfig);
  let num1 = randomMixedNumber(limits.maxMixedFractionWhole, levelConfig.maxDenominator);
  let num2 = randomMixedNumber(limits.maxMixedFractionWhole, levelConfig.maxDenominator);
  if (mixedToImproper(num1).numerator * mixedToImproper(num2).denominator <
      mixedToImproper(num2).numerator * mixedToImproper(num1).denominator) {
    [num1, num2] = [num2, num1];
  }
  const answer = improperToMixed(subtractFractions(mixedToImproper(num1), mixedToImproper(num2)));
  return {
    num1,
    num2,
    operation: 'mixed-number-subtraction',
    answer,
    explanation:
      `Paso 1: Convierte a impropias.\n` +
      `Paso 2: Resta ${formatMixedNumber(num1)} - ${formatMixedNumber(num2)}.\n` +
      `Paso 3: Resultado: ${formatMixedNumber(answer)}.`,
  };
}

export function generateMixedNumberConvert(levelConfig: LevelConfig): MixedNumberConvertProblem {
  const limits = resolveLevelLimits(levelConfig);
  const toMixed = randomInt(0, 1) === 0;
  if (toMixed) {
    const improper = randomProperFraction(levelConfig.maxDenominator);
    const expanded: Fraction = {
      numerator: improper.numerator + improper.denominator * randomInt(1, limits.maxMixedFractionWhole),
      denominator: improper.denominator,
    };
    const answer = improperToMixed(expanded);
    return {
      prompt: `Convierte ${formatFraction(expanded)} a número mixto`,
      operation: 'mixed-number-convert',
      answer,
      explanation: `Paso 1: Divide ${expanded.numerator} ÷ ${expanded.denominator}.\nPaso 2: Resultado: ${formatMixedNumber(answer)}.`,
    };
  }
  const mixed = randomMixedNumber(limits.maxMixedFractionWhole, levelConfig.maxDenominator);
  const answer = mixedToImproper(mixed);
  return {
    prompt: `Convierte ${formatMixedNumber(mixed)} a fracción impropia`,
    operation: 'mixed-number-convert',
    answer,
    explanation: `Paso 1: (${mixed.whole} × ${mixed.denominator}) + ${mixed.numerator} = ${answer.numerator}.\nPaso 2: ${formatFraction(answer)}.`,
  };
}

export function generateFractionToDecimal(levelConfig: LevelConfig): ConversionProblem {
  const maxIndex = Math.min(
    EXACT_DECIMAL_DENOMINATORS.length - 1,
    Math.max(2, Math.floor(levelConfig.maxDenominator / 4)),
  );
  const denominator = EXACT_DECIMAL_DENOMINATORS[randomInt(0, maxIndex)];
  const numerator = randomInt(1, denominator - 1);
  const fraction = simplifyFraction({ numerator, denominator });
  const answer = roundToPrecision(fraction.numerator / fraction.denominator, 3);
  return {
    prompt: `¿Qué decimal es ${formatFraction(fraction)}?`,
    operation: 'fraction-to-decimal',
    answer,
    explanation: `Paso 1: Divide ${fraction.numerator} ÷ ${fraction.denominator}.\nPaso 2: ${formatMathNumber(answer)}.`,
  };
}

export function generateDecimalToFraction(levelConfig: LevelConfig): ConversionProblem {
  const denominator = pickExactDenominator(Math.min(levelConfig.maxDenominator, 100));
  const numerator = randomInt(1, denominator - 1);
  const decimal = roundToPrecision(numerator / denominator, 2);
  const answer = simplifyFraction({ numerator, denominator });
  return {
    prompt: `¿Qué fracción es ${formatMathNumber(decimal)}? (simplificada)`,
    operation: 'decimal-to-fraction',
    answer,
    explanation: `Paso 1: ${formatMathNumber(decimal)} = ${numerator}/${denominator}.\nPaso 2: Simplifica: ${formatFraction(answer)}.`,
  };
}

function pickExactDenominator(maxDenominator = 100): number {
  const options = EXACT_DECIMAL_DENOMINATORS.filter((value) => value <= maxDenominator);
  return options[randomInt(0, Math.max(0, options.length - 1))];
}

/** Denominadores que dan porcentaje entero (dividen 100). */
const PERCENT_FRIENDLY_DENOMINATORS = [2, 4, 5, 10, 20, 25, 50, 100] as const;

/** Pares porcentaje → fracción simplificada, todos con valores exactos. */
const PERCENT_FRACTION_PAIRS: Array<{ percent: number; fraction: Fraction }> = [
  { percent: 4, fraction: { numerator: 1, denominator: 25 } },
  { percent: 5, fraction: { numerator: 1, denominator: 20 } },
  { percent: 8, fraction: { numerator: 2, denominator: 25 } },
  { percent: 10, fraction: { numerator: 1, denominator: 10 } },
  { percent: 20, fraction: { numerator: 1, denominator: 5 } },
  { percent: 25, fraction: { numerator: 1, denominator: 4 } },
  { percent: 35, fraction: { numerator: 7, denominator: 20 } },
  { percent: 40, fraction: { numerator: 2, denominator: 5 } },
  { percent: 50, fraction: { numerator: 1, denominator: 2 } },
  { percent: 60, fraction: { numerator: 3, denominator: 5 } },
  { percent: 70, fraction: { numerator: 7, denominator: 10 } },
  { percent: 75, fraction: { numerator: 3, denominator: 4 } },
  { percent: 80, fraction: { numerator: 4, denominator: 5 } },
  { percent: 90, fraction: { numerator: 9, denominator: 10 } },
];

export function generateFractionPercent(levelConfig: LevelConfig): FractionPercentProblem {
  const kinds = ['fraction-to-percent', 'percent-to-fraction', 'decimal-to-fraction'] as const;
  const kind = kinds[randomInt(0, kinds.length - 1)];

  if (kind === 'fraction-to-percent') {
    const friendly = PERCENT_FRIENDLY_DENOMINATORS.filter((value) => value <= Math.max(4, levelConfig.maxDenominator));
    const denominator = friendly[randomInt(0, friendly.length - 1)];
    const numerator = randomInt(1, denominator - 1);
    const fraction = simplifyFraction({ numerator, denominator });
    const percent = (fraction.numerator / fraction.denominator) * 100;
    return {
      prompt: `¿Qué porcentaje es ${formatFraction(fraction)}? (escribe solo el número)`,
      kind,
      operation: 'fraction-percent',
      answer: percent,
      explanation: `Paso 1: ${fraction.numerator} ÷ ${fraction.denominator} = ${formatMathNumber(percent / 100)}.\nPaso 2: Multiplica por 100: ${formatMathNumber(percent)} %.`,
    };
  }

  const pair = PERCENT_FRACTION_PAIRS[randomInt(0, PERCENT_FRACTION_PAIRS.length - 1)];
  if (kind === 'percent-to-fraction') {
    return {
      prompt: `¿Qué fracción es ${pair.percent} %? (simplificada)`,
      kind,
      operation: 'fraction-percent',
      answer: pair.fraction,
      explanation: `Paso 1: ${pair.percent} % = ${pair.percent}/100.\nPaso 2: Simplifica: ${formatFraction(pair.fraction)}.`,
    };
  }

  return {
    prompt: `¿Qué fracción es ${formatMathNumber(pair.percent / 100)}? (simplificada)`,
    kind,
    operation: 'fraction-percent',
    answer: pair.fraction,
    explanation: `Paso 1: ${formatMathNumber(pair.percent / 100)} = ${pair.percent}/100.\nPaso 2: Simplifica: ${formatFraction(pair.fraction)}.`,
  };
}
