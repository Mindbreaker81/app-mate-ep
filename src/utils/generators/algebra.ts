import type { AlgebraSubstitutionProblem } from '../../types';
import { formatInteger, pickRandom, randomInt, type LevelConfig } from './shared';

// — Puente T3: sustitución en expresiones algebraicas (Ampliació ESO) —

/** Coeficientes de ax + b con enteros pequeños; ±1 incluidos (se escriben «x»/«−x»). */
const BASIC_COEFFICIENTS = [2, 3, 4, 5, 6, 7, 8, 9];
const ADVANCED_COEFFICIENTS = [-6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6];

/** Término «ax»: los coeficientes 1 y −1 se escriben como «x» y «-x». */
function coefficientTerm(coefficient: number): string {
  if (coefficient === 1) return 'x';
  if (coefficient === -1) return '-x';
  return `${coefficient}x`;
}

/**
 * Evalúa ax + b para un valor dado de x. Niveles bajos (id < 5) solo con
 * enteros no negativos; a partir del 5 aparecen coeficientes, valores y
 * constantes negativos, así que la respuesta también puede serlo.
 */
export function generateAlgebraSubstitutionProblem(
  levelConfig: LevelConfig,
): AlgebraSubstitutionProblem {
  const advanced = levelConfig.id >= 5;
  const coefficient = pickRandom(advanced ? ADVANCED_COEFFICIENTS : BASIC_COEFFICIENTS);
  const variableValue = advanced ? randomInt(-6, 9) : randomInt(0, 9);
  let constant = randomInt(-9, 9);
  while (constant === 0 || (!advanced && constant < 0)) {
    constant = randomInt(-9, 9);
  }

  const answer = coefficient * variableValue + constant;
  const sign = constant < 0 ? '-' : '+';
  const expression = `${coefficientTerm(coefficient)} ${sign} ${Math.abs(constant)}`;

  return {
    coefficient,
    constant,
    variableValue,
    prompt: `Si x = ${formatInteger(variableValue)}, ¿cuánto vale ${expression}?`,
    operation: 'algebra-substitution',
    answer,
    explanation:
      `Paso 1: Sustituye x por ${formatInteger(variableValue)}: ${formatInteger(coefficient)} × ${formatInteger(variableValue)} ${sign} ${Math.abs(constant)}.\n` +
      `Paso 2: ${formatInteger(coefficient * variableValue)} ${sign} ${Math.abs(constant)} = ${formatInteger(answer)}.`,
  };
}
