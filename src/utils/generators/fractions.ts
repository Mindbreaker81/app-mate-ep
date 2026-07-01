import type {
  ConversionProblem,
  Fraction,
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

export function generateFractionToDecimal(_levelConfig: LevelConfig): ConversionProblem {
  const denominator = EXACT_DECIMAL_DENOMINATORS[randomInt(0, EXACT_DECIMAL_DENOMINATORS.length - 1)];
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

export function generateDecimalToFraction(_levelConfig: LevelConfig): ConversionProblem {
  const denominator = pickExactDenominator();
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

function pickExactDenominator(): number {
  return EXACT_DECIMAL_DENOMINATORS[randomInt(0, EXACT_DECIMAL_DENOMINATORS.length - 1)];
}
