import type { MeanProblem, MedianProblem, ModeProblem, RangeProblem } from '../../types';
import { formatMathNumber, roundToPrecision } from '../mathUtils';
import { randomInt, resolveLevelLimits, type LevelConfig } from './shared';

function generateValues(levelConfig: LevelConfig): number[] {
  const limits = resolveLevelLimits(levelConfig);
  return Array.from({ length: limits.meanDataPoints }, () => randomInt(1, 12));
}

/** Datos con media entera exacta: se ajusta el último valor para que la suma sea divisible. */
function generateValuesWithExactMean(levelConfig: LevelConfig): number[] {
  const limits = resolveLevelLimits(levelConfig);
  const count = limits.meanDataPoints;
  const values = Array.from({ length: count - 1 }, () => randomInt(1, 12));
  const partialSum = values.reduce((total, value) => total + value, 0);
  const last = count - (partialSum % count);
  values.push(last + (last < count && randomInt(0, 1) === 0 ? count : 0));
  return values;
}

export function generateMeanProblem(levelConfig: LevelConfig): MeanProblem {
  const values = generateValuesWithExactMean(levelConfig);
  const count = values.length;
  const sum = values.reduce((total, value) => total + value, 0);
  const answer = sum / count;
  return {
    prompt: `Notas: ${values.join(', ')}. ¿Cuál es la media?`,
    values,
    operation: 'mean',
    answer,
    explanation:
      `Paso 1: Suma ${values.join(' + ')} = ${sum}.\n` +
      `Paso 2: Divide entre ${count}: ${sum} ÷ ${count} = ${formatMathNumber(answer)}.`,
  };
}

export function generateMedianProblem(levelConfig: LevelConfig): MedianProblem {
  const values = generateValues(levelConfig);
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  const answer =
    sorted.length % 2 === 0
      ? roundToPrecision((sorted[middle - 1] + sorted[middle]) / 2, 1)
      : sorted[middle];
  return {
    prompt: `Datos: ${values.join(', ')}. ¿Cuál es la mediana?`,
    values,
    operation: 'median',
    answer,
    explanation: `Paso 1: Ordena: ${sorted.join(', ')}.\nPaso 2: La mediana es ${formatMathNumber(answer)}.`,
  };
}

export function generateModeProblem(levelConfig: LevelConfig): ModeProblem {
  const base = randomInt(2, Math.min(8, 2 + levelConfig.id));
  const values = [base, base, base, randomInt(1, 10), randomInt(1, 10)];
  return {
    prompt: `Datos: ${values.join(', ')}. ¿Cuál es la moda?`,
    values,
    operation: 'mode',
    answer: base,
    explanation: `Paso 1: El valor que más se repite es ${base}.`,
  };
}

export function generateRangeProblem(levelConfig: LevelConfig): RangeProblem {
  const values = generateValues(levelConfig);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const answer = max - min;
  return {
    prompt: `Datos: ${values.join(', ')}. ¿Cuál es el rango?`,
    values,
    operation: 'range',
    answer,
    explanation: `Paso 1: Máximo ${max}, mínimo ${min}.\nPaso 2: Rango = ${max} - ${min} = ${answer}.`,
  };
}

export function generateStatisticsProblem(
  levelConfig: LevelConfig,
  operation: MeanProblem['operation'] | MedianProblem['operation'] | ModeProblem['operation'] | RangeProblem['operation'],
) {
  switch (operation) {
    case 'mean':
      return generateMeanProblem(levelConfig);
    case 'median':
      return generateMedianProblem(levelConfig);
    case 'mode':
      return generateModeProblem(levelConfig);
    case 'range':
      return generateRangeProblem(levelConfig);
    default: {
      const exhaustive: never = operation;
      throw new Error(`Estadística no soportada: ${exhaustive}`);
    }
  }
}
