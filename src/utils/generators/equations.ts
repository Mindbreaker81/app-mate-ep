import type { SimpleEquationProblem } from '../../types';
import { randomInt, resolveLevelLimits, type LevelConfig } from './shared';

export function generateSimpleEquation(levelConfig: LevelConfig): SimpleEquationProblem {
  const limits = resolveLevelLimits(levelConfig);
  const template = randomInt(0, 2);
  const x = randomInt(1, Math.max(2, Math.min(limits.maxEquationValue, 30)));

  if (template === 0) {
    const addend = randomInt(1, Math.max(2, Math.min(limits.maxEquationValue, 20)));
    const result = x + addend;
    return {
      prompt: `x + ${addend} = ${result}. ¿Cuánto vale x?`,
      operation: 'simple-equation',
      answer: x,
      explanation: `Paso 1: x = ${result} - ${addend}.\nPaso 2: x = ${x}.`,
    };
  }

  if (template === 1) {
    const subtrahend = randomInt(1, Math.max(2, Math.min(x - 1, 15)));
    const result = x - subtrahend;
    return {
      prompt: `x - ${subtrahend} = ${result}. ¿Cuánto vale x?`,
      operation: 'simple-equation',
      answer: x,
      explanation: `Paso 1: x = ${result} + ${subtrahend}.\nPaso 2: x = ${x}.`,
    };
  }

  const factor = randomInt(2, Math.min(levelConfig.maxNumberMult, 9));
  const result = x * factor;
  return {
    prompt: `${factor}x = ${result}. ¿Cuánto vale x?`,
    operation: 'simple-equation',
    answer: x,
    explanation: `Paso 1: x = ${result} ÷ ${factor}.\nPaso 2: x = ${x}.`,
  };
}
