import type { FactorizationProblem, GcdLcmProblem } from '../../types';
import { gcd, lcm, primeFactorize, randomCompositeNumber } from '../numberTheoryUtils';
import { randomInt, type LevelConfig } from './shared';

export function generateFactorizationProblem(levelConfig: LevelConfig): FactorizationProblem {
  const target = randomCompositeNumber(levelConfig.maxFactorizationNumber);
  const factors = primeFactorize(target);
  const explanation = factors.reduce<{ remaining: number; steps: string[] }>(
    (state, factor, index) => ({
      remaining: state.remaining / factor,
      steps: [...state.steps, `Paso ${index + 1}: ${state.remaining} ÷ ${factor} = ${state.remaining / factor}`],
    }),
    { remaining: target, steps: [] },
  );

  return {
    target,
    operation: 'factorization',
    answer: factors.join(' × '),
    explanation: `${explanation.steps.join('\n')}\nResultado: ${target} = ${factors.join(' × ')}`,
  };
}

export function generateGcdProblem(levelConfig: LevelConfig): GcdLcmProblem {
  const max = Math.max(6, levelConfig.maxFactorizationNumber);
  // Se construyen a partir de un factor común para que el MCD no sea trivial (1) casi nunca.
  const common = randomInt(2, Math.min(12, Math.max(2, Math.floor(max / 4))));
  const range = Math.max(2, Math.floor(max / common) - 1);
  const num1 = common * randomInt(1, range);
  let num2 = common * randomInt(1, range);
  while (num1 === num2) {
    num2 = common * randomInt(1, range);
  }
  const answer = gcd(num1, num2);
  return {
    prompt: `Calcula el MCD de ${num1} y ${num2}`,
    num1,
    num2,
    operation: 'gcd',
    answer,
    explanation: `Paso 1: Descompón en primos.\nPaso 2: Toma los factores comunes.\nPaso 3: MCD(${num1}, ${num2}) = ${answer}.`,
  };
}

export function generateLcmProblem(levelConfig: LevelConfig): GcdLcmProblem {
  const num1 = randomInt(4, Math.max(4, Math.min(levelConfig.maxFactorizationNumber, 24)));
  const num2 = randomInt(4, Math.max(4, Math.min(levelConfig.maxFactorizationNumber, 24)));
  const answer = lcm(num1, num2);
  return {
    prompt: `Calcula el MCM de ${num1} y ${num2}`,
    num1,
    num2,
    operation: 'lcm',
    answer,
    explanation: `Paso 1: Descompón en primos.\nPaso 2: Toma todos los factores con mayor exponente.\nPaso 3: MCM(${num1}, ${num2}) = ${answer}.`,
  };
}
