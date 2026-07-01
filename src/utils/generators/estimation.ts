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
  const num1 = randomInt(15, Math.max(20, Math.min(levelConfig.maxNumber, 99)));
  const num2 = randomInt(12, Math.max(18, Math.min(levelConfig.maxNumberMult * 2, 99)));
  const rounded1 = roundToNearestTen(num1);
  const rounded2 = roundToNearestTen(num2);
  const answer = rounded1 * rounded2;
  return buildOptions(`¿Cuál es la mejor estimación de ${num1} × ${num2}?`, answer,
    `Paso 1: Redondea ${num1} a ${rounded1} y ${num2} a ${rounded2}.\nPaso 2: ${rounded1} × ${rounded2} ≈ ${answer}.`);
}

function buildAdditionEstimate(levelConfig: LevelConfig): EstimationProblem {
  const num1 = randomInt(120, Math.max(150, Math.min(levelConfig.maxNumber * 2, 499)));
  const num2 = randomInt(110, Math.max(140, Math.min(levelConfig.maxNumber * 2, 499)));
  const rounded1 = roundToNearestHundred(num1);
  const rounded2 = roundToNearestHundred(num2);
  const answer = rounded1 + rounded2;
  return buildOptions(`¿Cuál es la mejor estimación de ${num1} + ${num2}?`, answer,
    `Paso 1: Redondea a centenas: ${rounded1} + ${rounded2}.\nPaso 2: ≈ ${answer}.`);
}

function buildSubtractionEstimate(levelConfig: LevelConfig): EstimationProblem {
  const num1 = randomInt(300, Math.max(350, Math.min(levelConfig.maxNumber * 3, 899)));
  const num2 = randomInt(80, Math.max(100, Math.min(levelConfig.maxNumber, 299)));
  const rounded1 = roundToNearestHundred(num1);
  const rounded2 = roundToNearestHundred(num2);
  const answer = rounded1 - rounded2;
  return buildOptions(`¿Cuál es la mejor estimación de ${num1} - ${num2}?`, answer,
    `Paso 1: Redondea a centenas: ${rounded1} - ${rounded2}.\nPaso 2: ≈ ${answer}.`);
}

function buildDivisionEstimate(levelConfig: LevelConfig): EstimationProblem {
  const divisor = randomInt(8, Math.max(10, Math.min(levelConfig.maxNumberDiv, 20)));
  const quotient = randomInt(8, 20);
  const dividend = divisor * quotient + randomInt(-3, 3);
  const roundedDivisor = roundToNearestTen(divisor);
  const roundedDividend = roundToNearestTen(dividend);
  const answer = Math.max(1, Math.round(roundedDividend / Math.max(1, roundedDivisor)));
  return buildOptions(`¿Cuál es la mejor estimación de ${dividend} ÷ ${divisor}?`, answer,
    `Paso 1: Redondea ${dividend} ≈ ${roundedDividend} y ${divisor} ≈ ${roundedDivisor}.\nPaso 2: ≈ ${answer}.`);
}

function buildOptions(prompt: string, answer: number, explanation: string): EstimationProblem {
  const step = Math.max(10, Math.round(Math.max(answer, 50) * 0.2 / 10) * 10);
  const options = shuffle(
    Array.from(new Set([answer, Math.max(1, answer - step), answer + step, answer + step * 2])),
  );
  while (options.length < 4) {
    options.push(answer + step * (options.length + 1));
  }
  return {
    prompt,
    options: options.slice(0, 4),
    operation: 'estimation',
    answer,
    explanation: `${explanation}\nPaso 3: La mejor estimación es ${formatMathNumber(answer)}.`,
  };
}
