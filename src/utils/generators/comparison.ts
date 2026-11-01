import type { CompareProblem, OrderValuesProblem } from '../../types';
import { formatFraction, simplifyFraction } from '../fractionUtils';
import { formatMathNumber } from '../mathUtils';
import { EXACT_DECIMAL_DENOMINATORS, randomInt, shuffle, type LevelConfig } from './shared';

function compareValues(left: number, right: number): '<' | '>' | '=' {
  if (left < right) return '<';
  if (left > right) return '>';
  return '=';
}

function fractionToDecimal(fraction: { numerator: number; denominator: number }): number {
  return fraction.numerator / fraction.denominator;
}

function randomProperFraction(maxDenominator: number) {
  const denominator = randomInt(3, Math.max(3, maxDenominator));
  const numerator = randomInt(1, denominator - 1);
  return simplifyFraction({ numerator, denominator });
}

export function generateCompareFractions(levelConfig: LevelConfig): CompareProblem {
  const left = randomProperFraction(levelConfig.maxDenominator);
  const right = randomProperFraction(levelConfig.maxDenominator);
  const leftVal = fractionToDecimal(left);
  const rightVal = fractionToDecimal(right);
  return {
    prompt: `¿Cuál es mayor: ${formatFraction(left)} o ${formatFraction(right)}?`,
    operation: 'compare-fractions',
    answer: compareValues(leftVal, rightVal),
    explanation:
      `Paso 1: Compara ${formatFraction(left)} (${formatMathNumber(leftVal)}) y ${formatFraction(right)} (${formatMathNumber(rightVal)}).\n` +
      `Paso 2: ${leftVal === rightVal ? 'Son iguales' : leftVal > rightVal ? 'La primera es mayor' : 'La segunda es mayor'}.`,
  };
}

export function generateCompareDecimals(levelConfig: LevelConfig): CompareProblem {
  const places = Math.min(2, levelConfig.maxDecimalPlaces);
  const left = roundDecimal(randomInt(1, levelConfig.maxDecimalWhole * 10) / 10 ** places, places);
  const right = roundDecimal(randomInt(1, levelConfig.maxDecimalWhole * 10) / 10 ** places, places);
  return {
    prompt: `¿Cuál es mayor: ${formatMathNumber(left)} o ${formatMathNumber(right)}?`,
    operation: 'compare-decimals',
    answer: compareValues(left, right),
    explanation: `Compara ${formatMathNumber(left)} y ${formatMathNumber(right)}.`,
  };
}

export function generateCompareFractionDecimal(levelConfig: LevelConfig): CompareProblem {
  const fraction = randomProperFraction(levelConfig.maxDenominator);
  const decimal = roundDecimal(fractionToDecimal(fraction) + randomInt(-2, 2) / 10, 2);
  const fractionVal = fractionToDecimal(fraction);
  return {
    prompt: `¿Cuál es mayor: ${formatFraction(fraction)} o ${formatMathNumber(decimal)}?`,
    operation: 'compare-fraction-decimal',
    answer: compareValues(fractionVal, decimal),
    explanation: `${formatFraction(fraction)} = ${formatMathNumber(fractionVal)}. Compara con ${formatMathNumber(decimal)}.`,
  };
}

export function generateOrderValues(levelConfig: LevelConfig): OrderValuesProblem {
  const count = 4;
  const items: { label: string; value: number }[] = [];

  // Sin valores repetidos ni equivalentes (1/2 y 2/4 son el mismo valor).
  const hasValue = (value: number) =>
    items.some((item) => Math.abs(item.value - value) < 1e-9);

  let attempts = 0;
  while (items.length < count && attempts < 200) {
    attempts += 1;
    if (items.filter((item) => item.label.includes('/')).length < 2) {
      const fraction = randomProperFraction(levelConfig.maxDenominator);
      if (!hasValue(fractionToDecimal(fraction))) {
        items.push({ label: formatFraction(fraction), value: fractionToDecimal(fraction) });
      }
      continue;
    }
    const denominator = EXACT_DECIMAL_DENOMINATORS[randomInt(0, EXACT_DECIMAL_DENOMINATORS.length - 1)];
    const numerator = randomInt(1, denominator - 1);
    const value = numerator / denominator;
    if (!hasValue(value)) {
      items.push({ label: formatMathNumber(value), value });
    }
  }

  const sorted = [...items].sort((a, b) => a.value - b.value);
  const shuffled = shuffle([...sorted]);
  const answer = sorted.map((item) => item.label).join(', ');

  // Opciones: la correcta más 3 permutaciones distintas (nunca se pierde la correcta).
  const options = [answer];
  let permutationAttempts = 0;
  while (options.length < count && permutationAttempts < 50) {
    permutationAttempts += 1;
    const candidate = shuffle([...sorted.map((item) => item.label)]).join(', ');
    if (!options.includes(candidate)) {
      options.push(candidate);
    }
  }

  return {
    prompt: 'Ordena de menor a mayor:',
    values: shuffled.map((item) => item.label),
    options: shuffle(options),
    operation: 'order-values',
    answer,
    explanation: `Orden correcto: ${answer}.`,
  };
}

function roundDecimal(value: number, places: number): number {
  const scale = 10 ** places;
  return Math.round(value * scale) / scale;
}
