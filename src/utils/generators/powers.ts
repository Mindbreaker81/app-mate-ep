import type { PowerProblem, SquareRootProblem } from '../../types';
import { randomInt, type LevelConfig } from './shared';

export function generatePowerProblem(levelConfig: LevelConfig): PowerProblem {
  const exponent: 2 | 3 = randomInt(0, 1) === 0 ? 2 : 3;
  const maxBase = exponent === 2 ? Math.min(levelConfig.maxPowerBase, 15) : Math.min(levelConfig.maxPowerBase, 10);
  const base = randomInt(2, Math.max(2, maxBase));
  const answer = base ** exponent;

  return {
    base,
    exponent,
    operation: 'power',
    answer,
    explanation: `Paso 1: Repite la base ${exponent} veces.\nPaso 2: ${base}${exponent === 2 ? '²' : '³'} = ${Array.from({ length: exponent }, () => base).join(' × ')}.\nPaso 3: El resultado es ${answer}.`,
  };
}

export function generateSquareRootProblem(levelConfig: LevelConfig): SquareRootProblem {
  const maxBase = Math.min(levelConfig.maxPowerBase, 12);
  const base = randomInt(2, Math.max(2, maxBase));
  const radicand = base * base;
  return {
    radicand,
    operation: 'square-root',
    answer: base,
    explanation: `Paso 1: Busca un número que multiplicado por sí mismo dé ${radicand}.\nPaso 2: ${base} × ${base} = ${radicand}.\nPaso 3: √${radicand} = ${base}.`,
  };
}
