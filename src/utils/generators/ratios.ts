import type { RatioProblem } from '../../types';
import { randomInt, type LevelConfig } from './shared';

export function generateRatioProblem(levelConfig: LevelConfig): RatioProblem {
  const a = randomInt(2, 6);
  const b = randomInt(2, 6);
  const multiplier = randomInt(2, Math.min(levelConfig.maxNumberMult, 8));
  const c = a * multiplier;
  const answer = b * multiplier;
  return {
    prompt: `Si ${a}:${b} = ${c}:x, ¿cuánto vale x?`,
    operation: 'ratio',
    answer,
    explanation: `Paso 1: ${a} × ${multiplier} = ${c}.\nPaso 2: ${b} × ${multiplier} = ${answer}.`,
  };
}

export function generateProportionProblem(levelConfig: LevelConfig): RatioProblem {
  const items = randomInt(2, 5);
  const pricePer = randomInt(2, Math.min(levelConfig.maxNumberMult, 10));
  const quantity = items + randomInt(1, 4);
  const total = items * pricePer;
  const answer = quantity * pricePer;
  return {
    prompt: `${items} kg cuestan ${total} €. ¿Cuánto cuestan ${quantity} kg?`,
    operation: 'proportion',
    answer,
    explanation: `Paso 1: Precio por kg = ${total} ÷ ${items} = ${pricePer} €.\nPaso 2: ${quantity} × ${pricePer} = ${answer} €.`,
  };
}
