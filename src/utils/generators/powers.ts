import type { PowerGeneralProblem, PowerProblem, SquareRootProblem } from '../../types';
import { pickRandom, randomInt, type LevelConfig } from './shared';

const SUPERSCRIPT_DIGITS = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'];

/** Exponente como superíndice Unicode (para enunciados y explicaciones). */
export function superscriptExponent(exponent: number): string {
  return String(exponent)
    .split('')
    .map((digit) => SUPERSCRIPT_DIGITS[Number(digit)] ?? '')
    .join('');
}

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

// — Puente T3: potencia con cualquier exponente natural (Ampliació ESO) —

/** Exponentes con los casos especiales 0 y 1 menos frecuentes que el resto. */
const POWER_GENERAL_EXPONENTS = [0, 1, 2, 2, 3, 3, 4, 4, 5, 5];

/**
 * Cota de la base según el exponente (el resultado debe quedar manejable y
 * entero seguro: con estas cotas siempre es ≤ 100 000).
 */
function powerGeneralMaxBase(exponent: number, cap: number): number {
  switch (exponent) {
    case 0:
    case 1:
      return cap * 2;
    case 2:
      return Math.min(cap + 8, 40);
    case 3:
      return Math.min(cap + 4, 20);
    case 4:
      return Math.min(cap + 2, 14);
    default:
      return Math.min(cap + 1, 10);
  }
}

export function generatePowerGeneralProblem(levelConfig: LevelConfig): PowerGeneralProblem {
  const exponent = pickRandom(POWER_GENERAL_EXPONENTS);
  const cap = Math.max(2, Math.min(levelConfig.maxPowerBase, 30));
  const maxBase = Math.max(2, powerGeneralMaxBase(exponent, cap));
  // Bases especiales 0/1 con poca frecuencia y nunca con exponente 0 (evita 0⁰).
  const base = exponent > 0 && randomInt(1, 12) === 1 ? randomInt(0, 1) : randomInt(2, maxBase);
  const answer = base ** exponent;
  const powerText = `${base}${superscriptExponent(exponent)}`;

  let explanation: string;
  if (exponent === 0) {
    explanation = `Paso 1: Todo número distinto de 0 elevado a 0 vale 1.\nPaso 2: ${powerText} = 1.`;
  } else if (exponent === 1) {
    explanation = `Paso 1: Elevar a 1 deja el número igual.\nPaso 2: ${powerText} = ${base}.`;
  } else if (base === 0) {
    explanation = `Paso 1: 0 multiplicado por sí mismo siempre da 0.\nPaso 2: ${powerText} = 0.`;
  } else if (base === 1) {
    explanation = `Paso 1: 1 multiplicado por sí mismo siempre da 1.\nPaso 2: ${powerText} = 1.`;
  } else {
    const factors = Array.from({ length: exponent }, () => base).join(' × ');
    explanation = `Paso 1: Repite la base ${exponent} veces.\nPaso 2: ${powerText} = ${factors}.\nPaso 3: El resultado es ${answer}.`;
  }

  return {
    base,
    exponent,
    operation: 'power-general',
    answer,
    explanation,
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
