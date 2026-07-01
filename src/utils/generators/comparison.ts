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

  for (let index = 0; index < 2; index += 1) {
    const fraction = randomProperFraction(levelConfig.maxDenominator);
    items.push({ label: formatFraction(fraction), value: fractionToDecimal(fraction) });
  }
  for (let index = 0; index < 2; index += 1) {
    const denominator = EXACT_DECIMAL_DENOMINATORS[randomInt(0, EXACT_DECIMAL_DENOMINATORS.length - 1)];
    const numerator = randomInt(1, denominator - 1);
    const value = numerator / denominator;
    items.push({ label: formatMathNumber(value), value });
  }

  const sorted = [...items].sort((a, b) => a.value - b.value).slice(0, count);
  const shuffled = shuffle([...sorted]);
  const answer = sorted.map((item) => item.label).join(', ');

  const permutations = [
    shuffled.map((item) => item.label),
    shuffle([...sorted.map((item) => item.label)]),
    shuffle([...sorted.map((item) => item.label)]),
    shuffle([...sorted.map((item) => item.label)]),
  ]
    .map((labels) => labels.join(', '))
    .filter((option, index, all) => option !== answer && all.indexOf(option) === index);

  const options = shuffle([answer, ...permutations]).slice(0, 4);
  while (options.length < 4) {
    options.push(shuffle(sorted.map((item) => item.label)).join(', '));
  }

  return {
    prompt: 'Ordena de menor a mayor:',
    values: shuffled.map((item) => item.label),
    options: options.slice(0, 4),
    operation: 'order-values',
    answer,
    explanation: `Orden correcto: ${answer}.`,
  };
}

function roundDecimal(value: number, places: number): number {
  const scale = 10 ** places;
  return Math.round(value * scale) / scale;
}
