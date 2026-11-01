import type { ProbabilityProblem } from '../../types';
import { formatMathNumber } from '../mathUtils';
import { EXACT_DECIMAL_DENOMINATORS, pickRandom, randomInt, shuffle, type LevelConfig } from './shared';

export function generateProbabilityProblem(levelConfig: LevelConfig): ProbabilityProblem {
  const template = randomInt(0, levelConfig.id >= 5 ? 4 : 2);

  if (template === 0) {
    const answer = 0.5;
    const options = shuffle([0.25, 0.5, 0.75, 1]);
    if (!options.includes(answer)) {
      options[0] = answer;
    }
    return {
      prompt: 'Lanzas un dado de 6 caras. ¿Probabilidad de sacar par (2, 4 o 6)?',
      options,
      operation: 'probability-simple',
      answer,
      favorable: 3,
      total: 6,
      explanation: 'Paso 1: Hay 3 resultados favorables de 6.\nPaso 2: 3/6 = 1/2 = 0.5.',
    };
  }

  if (template === 1) {
    // Total con decimal exacto (2, 4, 5, 8, 10, 20...): favorable/total no se redondea nunca.
    const total = pickRandom(EXACT_DECIMAL_DENOMINATORS.filter((value) => value >= 2 && value <= 10));
    const favorable = randomInt(1, total - 1);
    const answer = favorable / total;
    const options = buildProbabilityOptions(answer);
    return {
      prompt: `En una bolsa hay ${favorable} bolas rojas y ${total - favorable} azules. ¿Probabilidad de sacar roja? (Escríbelo como decimal o fracción)`,
      options,
      operation: 'probability-simple',
      answer,
      favorable,
      total,
      explanation: `Paso 1: Favorables ${favorable}, total ${total}.\nPaso 2: ${favorable}/${total} = ${formatMathNumber(answer)}. También vale escribir ${favorable}/${total}.`,
    };
  }

  if (template === 2) {
    const answer = 0.25;
    const options = shuffle([0.1, 0.25, 0.4, 0.5]);
    return {
      prompt: 'Lanzas una moneda dos veces. ¿Probabilidad de dos caras?',
      options,
      operation: 'probability-simple',
      answer,
      favorable: 1,
      total: 4,
      explanation: 'Paso 1: Solo CC de 4 resultados posibles.\nPaso 2: 1/4 = 0.25.',
    };
  }

  if (template === 3) {
    // Dado: probabilidad de sacar mayor que un umbral (decimal exacto).
    const threshold = randomInt(2, 4);
    const favorable = 6 - threshold; // valores estrictamente mayores
    const answer = favorable / 6;
    const options = buildProbabilityOptions(answer);
    return {
      prompt: `Lanzas un dado de 6 caras. ¿Probabilidad de sacar un número mayor que ${threshold}? (Decimal o fracción)`,
      options,
      operation: 'probability-simple',
      answer,
      favorable,
      total: 6,
      explanation: `Paso 1: Favorables: ${Array.from({ length: favorable }, (_, i) => threshold + 1 + i).join(', ')} — son ${favorable} de 6.\nPaso 2: ${favorable}/6 = ${formatMathNumber(answer)}.`,
    };
  }

  // Ruleta del mercado con sectores iguales: respuesta fraccionaria exacta.
  const sectors = pickRandom([4, 5, 8, 10]);
  const favorable = randomInt(1, sectors - 1);
  const answer = favorable / sectors;
  const options = buildProbabilityOptions(answer);
  return {
    prompt: `Una ruleta del mercado tiene ${sectors} sectores iguales y ${favorable} son de premios. ¿Probabilidad de premiar al girarla? (Decimal o fracción)`,
    options,
    operation: 'probability-simple',
    answer,
    favorable,
    total: sectors,
    explanation: `Paso 1: Favorables ${favorable} de ${sectors} sectores iguales.\nPaso 2: ${favorable}/${sectors} = ${formatMathNumber(answer)}.`,
  };
}

/** 4 opciones únicas con la correcta siempre incluida y a distancia clara. */
function buildProbabilityOptions(answer: number): number[] {
  const step = 0.1;
  const options = new Set<number>([answer]);
  for (const delta of [step, -step, step * 2, -step * 2, step * 3, -step * 3]) {
    if (options.size >= 4) {
      break;
    }
    const value = Math.round(Math.min(0.99, Math.max(0.05, answer + delta)) * 100) / 100;
    options.add(value);
  }
  // Último recurso para completar 4 opciones únicas.
  let extra = 0.05;
  while (options.size < 4) {
    options.add(Math.round((extra += 0.05) * 100) / 100);
  }
  return shuffle(Array.from(options).slice(0, 4));
}
