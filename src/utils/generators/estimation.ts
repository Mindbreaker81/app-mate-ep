import type { EstimationProblem } from '../../types';
import { formatMathNumber } from '../mathUtils';
import {
  randomInt,
  roundToNearestHundred,
  roundToNearestTen,
  shuffle,
  type LevelConfig,
} from './shared';

export function generateEstimationProblem(levelConfig: LevelConfig): EstimationProblem {
  const template = randomInt(0, 3);

  if (template === 0) {
    return buildMultiplicationEstimate(levelConfig);
  }
  if (template === 1) {
    return buildAdditionEstimate(levelConfig);
  }
  if (template === 2) {
    return buildSubtractionEstimate(levelConfig);
  }
  return buildDivisionEstimate(levelConfig);
}

function buildMultiplicationEstimate(levelConfig: LevelConfig): EstimationProblem {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const num1 = randomInt(15, Math.max(20, Math.min(levelConfig.maxNumber, 99)));
    const num2 = randomInt(12, Math.max(18, Math.min(levelConfig.maxNumberMult * 2, 99)));
    const rounded1 = roundToNearestTen(num1);
    const rounded2 = roundToNearestTen(num2);
    const answer = rounded1 * rounded2;
    const options = buildOptions(
      `¿Cuál es la mejor estimación de ${num1} × ${num2}?`,
      answer,
      num1 * num2,
      `Paso 1: Redondea ${num1} a ${rounded1} y ${num2} a ${rounded2}.\nPaso 2: ${rounded1} × ${rounded2} ≈ ${answer}.`,
    );
    if (options) {
      return options;
    }
  }
  // Alternativa garantizada tras los reintentos.
  return {
    prompt: '¿Cuál es la mejor estimación de 22 × 28?',
    options: [560, 600, 640, 680],
    operation: 'estimation',
    answer: 600,
    explanation: 'Paso 1: Redondea 22 a 20 y 28 a 30.\nPaso 2: 20 × 30 = 600.',
  };
}

function buildAdditionEstimate(levelConfig: LevelConfig): EstimationProblem {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const num1 = randomInt(120, Math.max(150, Math.min(levelConfig.maxNumber * 2, 499)));
    const num2 = randomInt(110, Math.max(140, Math.min(levelConfig.maxNumber * 2, 499)));
    const rounded1 = roundToNearestHundred(num1);
    const rounded2 = roundToNearestHundred(num2);
    const answer = rounded1 + rounded2;
    const options = buildOptions(
      `¿Cuál es la mejor estimación de ${num1} + ${num2}?`,
      answer,
      num1 + num2,
      `Paso 1: Redondea a centenas: ${rounded1} + ${rounded2}.\nPaso 2: ≈ ${answer}.`,
    );
    if (options) {
      return options;
    }
  }
  return {
    prompt: '¿Cuál es la mejor estimación de 248 + 352?',
    options: [500, 600, 700, 800],
    operation: 'estimation',
    answer: 600,
    explanation: 'Paso 1: Redondea a centenas: 200 + 400.\nPaso 2: ≈ 600.',
  };
}

function buildSubtractionEstimate(levelConfig: LevelConfig): EstimationProblem {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const num1 = randomInt(300, Math.max(350, Math.min(levelConfig.maxNumber * 3, 899)));
    const num2 = randomInt(80, Math.max(100, Math.min(levelConfig.maxNumber, 299)));
    const rounded1 = roundToNearestHundred(num1);
    const rounded2 = roundToNearestHundred(num2);
    const answer = rounded1 - rounded2;
    const options = buildOptions(
      `¿Cuál es la mejor estimación de ${num1} - ${num2}?`,
      answer,
      num1 - num2,
      `Paso 1: Redondea a centenas: ${rounded1} - ${rounded2}.\nPaso 2: ≈ ${answer}.`,
    );
    if (options) {
      return options;
    }
  }
  return {
    prompt: '¿Cuál es la mejor estimación de 720 - 280?',
    options: [300, 400, 500, 600],
    operation: 'estimation',
    answer: 400,
    explanation: 'Paso 1: Redondea a centenas: 700 - 300.\nPaso 2: ≈ 400.',
  };
}

function buildDivisionEstimate(levelConfig: LevelConfig): EstimationProblem {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const divisor = randomInt(8, Math.max(10, Math.min(levelConfig.maxNumberDiv, 20)));
    const quotient = randomInt(8, 20);
    const dividend = divisor * quotient + randomInt(-3, 3);
    const roundedDivisor = roundToNearestTen(divisor);
    const roundedDividend = roundToNearestTen(dividend);
    const answer = Math.max(1, Math.round(roundedDividend / Math.max(1, roundedDivisor)));
    const options = buildOptions(
      `¿Cuál es la mejor estimación de ${dividend} ÷ ${divisor}?`,
      answer,
      dividend / divisor,
      `Paso 1: Redondea ${dividend} ≈ ${roundedDividend} y ${divisor} ≈ ${roundedDivisor}.\nPaso 2: ≈ ${answer}.`,
    );
    if (options) {
      return options;
    }
  }
  return {
    prompt: '¿Cuál es la mejor estimación de 197 ÷ 10?',
    options: [12, 20, 30, 40],
    operation: 'estimation',
    answer: 20,
    explanation: 'Paso 1: Redondea 197 ≈ 200 y 10 ≈ 10.\nPaso 2: ≈ 20.',
  };
}

/**
 * Construye las 4 opciones garantizando que la correcta sea inequívocamente la más
 * cercana al valor exacto de la operación. Devuelve null si no se lo consigue.
 */
function buildOptions(
  prompt: string,
  answer: number,
  exactValue: number,
  explanation: string,
): EstimationProblem | null {
  const step = Math.max(10, Math.round(Math.max(answer, 50) * 0.2 / 10) * 10);
  const candidates = [answer, Math.max(1, answer - step), answer + step, answer + step * 2];
  const unique = Array.from(new Set(candidates));
  if (unique.length < 4) {
    return null;
  }
  // La correcta debe quedar estrictamente más cerca del valor exacto que ninguna otra opción.
  const answerDistance = Math.abs(exactValue - answer);
  const unambiguous = unique.every((option) => option === answer || Math.abs(exactValue - option) > answerDistance);
  if (!unambiguous) {
    return null;
  }
  if (answerDistance >= step) {
    return null; // la estimación enseñada se aleja demasiado del valor exacto
  }
  return {
    prompt,
    options: shuffle(unique).slice(0, 4),
    operation: 'estimation',
    answer,
    explanation: `${explanation}\nPaso 3: La mejor estimación es ${formatMathNumber(answer)}.`,
  };
}
