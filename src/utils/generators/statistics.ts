import type { MeanProblem } from '../../types';
import { formatMathNumber, roundToPrecision } from '../mathUtils';
import { randomInt, resolveLevelLimits, type LevelConfig } from './shared';

export function generateMeanProblem(levelConfig: LevelConfig): MeanProblem {
  const limits = resolveLevelLimits(levelConfig);
  const count = limits.meanDataPoints;
  const values = Array.from({ length: count }, () => randomInt(1, 10));
  const sum = values.reduce((total, value) => total + value, 0);
  const answer = roundToPrecision(sum / count, 1);

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
