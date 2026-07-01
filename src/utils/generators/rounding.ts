import type { RoundDecimalProblem } from '../../types';
import { formatMathNumber, roundToPrecision } from '../mathUtils';
import { randomInt, type LevelConfig } from './shared';

export function generateRoundDecimal(levelConfig: LevelConfig): RoundDecimalProblem {
  const precision = randomInt(0, 1) === 0 ? 'tenth' : 'hundredth';
  const places = precision === 'tenth' ? 1 : 2;
  const raw = randomInt(1000, Math.max(1000, levelConfig.maxDecimalWhole * 100)) / 1000;
  const value = roundToPrecision(raw, 3);
  const answer = roundToPrecision(value, places);
  const label = precision === 'tenth' ? 'décima' : 'centésima';

  return {
    prompt: `Redondea ${formatMathNumber(value)} a la ${label}`,
    value,
    precision,
    operation: 'round-decimal',
    answer,
    explanation: `Paso 1: Mira la cifra siguiente.\nPaso 2: ${formatMathNumber(value)} redondeado a la ${label} es ${formatMathNumber(answer)}.`,
  };
}
