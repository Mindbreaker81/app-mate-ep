import type { ProbabilityProblem } from '../../types';
import { formatMathNumber, roundToPrecision } from '../mathUtils';
import { randomInt, shuffle, type LevelConfig } from './shared';

export function generateProbabilityProblem(levelConfig: LevelConfig): ProbabilityProblem {
  const template = randomInt(0, levelConfig.id >= 5 ? 2 : 1);

  if (template === 0) {
    const answer = roundToPrecision(1 / 2, 2);
    const options = shuffle([0.25, 0.5, 0.75, 1]);
    if (!options.includes(answer)) {
      options[0] = answer;
    }
    return {
      prompt: 'Lanzas un dado de 6 caras. ¿Probabilidad de sacar par (2, 4 o 6)?',
      options,
      operation: 'probability-simple',
      answer,
      explanation: 'Paso 1: Hay 3 resultados favorables de 6.\nPaso 2: 3/6 = 1/2 = 0.5.',
    };
  }

  if (template === 1) {
    const favorable = randomInt(1, 3);
    const total = randomInt(favorable + 2, favorable + 5);
    const answer = roundToPrecision(favorable / total, 2);
    const step = 0.1;
    const options = shuffle([
      answer,
      roundToPrecision(Math.max(0.1, answer - step), 2),
      roundToPrecision(Math.min(0.99, answer + step), 2),
      roundToPrecision(Math.min(0.99, answer + step * 2), 2),
    ]);
    return {
      prompt: `En una bolsa hay ${favorable} bolas rojas y ${total - favorable} azules. ¿Probabilidad de sacar roja?`,
      options,
      operation: 'probability-simple',
      answer,
      explanation: `Paso 1: Favorables ${favorable}, total ${total}.\nPaso 2: ${favorable}/${total} = ${formatMathNumber(answer)}.`,
    };
  }

  const answer = roundToPrecision(1 / 4, 2);
  const options = shuffle([0.1, 0.25, 0.4, 0.5]);
  return {
    prompt: 'Lanzas una moneda dos veces. ¿Probabilidad de dos caras?',
    options,
    operation: 'probability-simple',
    answer,
    explanation: 'Paso 1: Solo CC de 4 resultados posibles.\nPaso 2: 1/4 = 0.25.',
  };
}
