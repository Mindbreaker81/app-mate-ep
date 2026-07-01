import type { LevelConfig } from './shared';
import type {
  NumericProblem,
  RemainderProblem,
} from '../../types';
import { formatMathNumber, roundToPrecision } from '../mathUtils';
import { randomDecimal, randomInt } from './shared';

function generateAdditionExplanation(num1: number, num2: number): string {
  if (num1 < 10 && num2 < 10) {
    return `Suma simple: ${num1} + ${num2} = ${num1 + num2}`;
  }
  if (num1 >= 10 && num2 >= 10) {
    const num1Tens = Math.floor(num1 / 10);
    const num1Units = num1 % 10;
    const num2Tens = Math.floor(num2 / 10);
    const num2Units = num2 % 10;
    return `Paso 1: Suma las unidades: ${num1Units} + ${num2Units} = ${num1Units + num2Units}\n` +
      `Paso 2: Suma las decenas: ${num1Tens}0 + ${num2Tens}0 = ${(num1Tens + num2Tens) * 10}\n` +
      `Paso 3: Suma todo: ${num1Units + num2Units} + ${(num1Tens + num2Tens) * 10} = ${num1 + num2}`;
  }
  return `Suma: ${num1} + ${num2} = ${num1 + num2}`;
}

function generateSubtractionExplanation(num1: number, num2: number): string {
  if (num1 < 10 && num2 < 10) {
    return `Resta simple: ${num1} - ${num2} = ${num1 - num2}`;
  }
  return `Resta: ${num1} - ${num2} = ${num1 - num2}`;
}

function generateMultiplicationExplanation(num1: number, num2: number): string {
  return `Multiplicación: ${num1} × ${num2} = ${num1 * num2}`;
}

function generateDivisionExplanation(num1: number, num2: number): string {
  const quotient = num1 / num2;
  return `División: ${num2} × ${quotient} = ${num1}, por tanto ${num1} ÷ ${num2} = ${quotient}`;
}

export function generateAddition(levelConfig: LevelConfig): NumericProblem {
  const num1 = randomInt(1, levelConfig.maxNumber);
  const num2 = randomInt(1, levelConfig.maxNumber);
  return {
    num1,
    num2,
    operation: 'addition',
    answer: num1 + num2,
    explanation: generateAdditionExplanation(num1, num2),
  };
}

export function generateSubtraction(levelConfig: LevelConfig): NumericProblem {
  const num1 = randomInt(1, levelConfig.maxNumber);
  const num2 = randomInt(1, Math.max(1, num1 - 1));
  return {
    num1,
    num2,
    operation: 'subtraction',
    answer: num1 - num2,
    explanation: generateSubtractionExplanation(num1, num2),
  };
}

export function generateMultiplication(levelConfig: LevelConfig): NumericProblem {
  const num1 = randomInt(1, levelConfig.maxNumberMult);
  const num2 = randomInt(1, levelConfig.maxNumberMult);
  return {
    num1,
    num2,
    operation: 'multiplication',
    answer: num1 * num2,
    explanation: generateMultiplicationExplanation(num1, num2),
  };
}

export function generateDivision(levelConfig: LevelConfig): NumericProblem {
  const num2 = randomInt(1, levelConfig.maxNumberDiv);
  const answer = randomInt(1, levelConfig.maxNumberDiv);
  const num1 = num2 * answer;
  return {
    num1,
    num2,
    operation: 'division',
    answer,
    explanation: generateDivisionExplanation(num1, num2),
  };
}

export function generateDivisionRemainder(levelConfig: LevelConfig): RemainderProblem {
  const num2 = randomInt(3, Math.max(3, levelConfig.maxNumberDiv));
  const quotient = randomInt(2, Math.max(2, Math.min(levelConfig.maxNumberDiv, 12)));
  const remainder = randomInt(1, num2 - 1);
  const num1 = num2 * quotient + remainder;
  return {
    num1,
    num2,
    operation: 'division-remainder',
    answer: { quotient, remainder },
    explanation:
      `Paso 1: Divide ${num1} entre ${num2}.\n` +
      `Paso 2: ${num2} × ${quotient} = ${num2 * quotient}.\n` +
      `Paso 3: Resto: ${num1} - ${num2 * quotient} = ${remainder}.\n` +
      `Resultado: ${quotient} resto ${remainder}.`,
  };
}

export function generateDecimalProblem(
  levelConfig: LevelConfig,
  operation: 'decimal-addition' | 'decimal-subtraction' | 'decimal-multiplication' | 'decimal-division',
): NumericProblem {
  const maxWhole = Math.max(5, levelConfig.maxDecimalWhole);
  const maxPlaces = Math.max(1, levelConfig.maxDecimalPlaces);
  let num1 = randomDecimal(maxWhole, maxPlaces);
  let num2 = randomDecimal(Math.max(3, Math.floor(maxWhole / 2)), Math.min(maxPlaces, 2));
  let answer = 0;
  let explanation = '';

  switch (operation) {
    case 'decimal-addition':
      answer = roundToPrecision(num1 + num2, maxPlaces);
      explanation = `Paso 1: Alinea las comas decimales.\nPaso 2: Suma ${formatMathNumber(num1)} + ${formatMathNumber(num2)} = ${formatMathNumber(answer)}.`;
      break;
    case 'decimal-subtraction':
      if (num2 > num1) {
        [num1, num2] = [num2, num1];
      }
      answer = roundToPrecision(num1 - num2, maxPlaces);
      explanation = `Paso 1: Coloca los decimales en columna.\nPaso 2: Resta ${formatMathNumber(num1)} - ${formatMathNumber(num2)} = ${formatMathNumber(answer)}.`;
      break;
    case 'decimal-multiplication':
      answer = roundToPrecision(num1 * num2, maxPlaces + 1);
      explanation = `Paso 1: Multiplica como si fueran números enteros.\nPaso 2: Cuenta las cifras decimales.\nPaso 3: ${formatMathNumber(num1)} × ${formatMathNumber(num2)} = ${formatMathNumber(answer)}.`;
      break;
    case 'decimal-division': {
      num2 = randomDecimal(Math.max(2, Math.min(levelConfig.maxNumberDiv, 12)), Math.min(maxPlaces, 2));
      answer = randomDecimal(Math.max(2, Math.floor(maxWhole / 3)), Math.min(maxPlaces, 2));
      num1 = roundToPrecision(num2 * answer, maxPlaces + 2);
      explanation = `Paso 1: Piensa qué número multiplicado por ${formatMathNumber(num2)} da ${formatMathNumber(num1)}.\nPaso 2: ${formatMathNumber(num2)} × ${formatMathNumber(answer)} = ${formatMathNumber(num1)}.\nPaso 3: Entonces ${formatMathNumber(num1)} ÷ ${formatMathNumber(num2)} = ${formatMathNumber(answer)}.`;
      break;
    }
  }

  return { num1, num2, operation, answer, explanation };
}
