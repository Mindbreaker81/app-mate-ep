import type { IntegerArithmeticProblem, IntegerCompareProblem, IntegerOrderProblem } from '../../types';
import { formatInteger, randomInt, resolveLevelLimits, shuffle, type LevelConfig } from './shared';

function randomInteger(maxAbs: number, allowNegative: boolean): number {
  if (!allowNegative || maxAbs < 2) {
    return randomInt(1, maxAbs);
  }
  return randomInt(-maxAbs, maxAbs) || 1;
}

export function generateIntegerAddition(levelConfig: LevelConfig): IntegerArithmeticProblem {
  const limits = resolveLevelLimits(levelConfig);
  const num1 = randomInteger(limits.maxIntegerAbsolute, levelConfig.id >= 2);
  const num2 = randomInteger(limits.maxIntegerAbsolute, levelConfig.id >= 2);
  const answer = num1 + num2;
  return {
    display: `${formatInteger(num1)} + ${formatInteger(num2)}`,
    num1,
    num2,
    operation: 'integer-addition',
    answer,
    explanation: `Paso 1: Suma ${formatInteger(num1)} + ${formatInteger(num2)} = ${answer}.`,
  };
}

export function generateIntegerSubtraction(levelConfig: LevelConfig): IntegerArithmeticProblem {
  const limits = resolveLevelLimits(levelConfig);
  let num1 = randomInteger(limits.maxIntegerAbsolute, levelConfig.id >= 2);
  let num2 = randomInteger(limits.maxIntegerAbsolute, levelConfig.id >= 2);
  if (levelConfig.id <= 3 && num2 > num1) {
    [num1, num2] = [num2, num1];
  }
  const answer = num1 - num2;
  return {
    display: `${formatInteger(num1)} - ${formatInteger(num2)}`,
    num1,
    num2,
    operation: 'integer-subtraction',
    answer,
    explanation: `Paso 1: Resta ${formatInteger(num1)} - ${formatInteger(num2)} = ${answer}.`,
  };
}

export function generateIntegerMultiplication(levelConfig: LevelConfig): IntegerArithmeticProblem {
  const limits = resolveLevelLimits(levelConfig);
  const num1 = randomInteger(Math.min(limits.maxIntegerAbsolute, 12), levelConfig.id >= 3);
  const num2 = randomInteger(Math.min(limits.maxIntegerAbsolute, 12), false);
  const answer = num1 * num2;
  return {
    display: `${formatInteger(num1)} × ${formatInteger(num2)}`,
    num1,
    num2,
    operation: 'integer-multiplication',
    answer,
    explanation: `Paso 1: Multiplica ${formatInteger(num1)} × ${formatInteger(num2)} = ${answer}.`,
  };
}

export function generateIntegerDivision(levelConfig: LevelConfig): IntegerArithmeticProblem {
  const num2 = randomInt(2, Math.min(levelConfig.maxNumberDiv, 12));
  const quotient = randomInt(-10, 10) || 2;
  const num1 = num2 * quotient;
  return {
    display: `${formatInteger(num1)} ÷ ${num2}`,
    num1,
    num2,
    operation: 'integer-division',
    answer: quotient,
    explanation: `Paso 1: ${formatInteger(num2)} × ${quotient} = ${formatInteger(num1)}.\nPaso 2: ${formatInteger(num1)} ÷ ${num2} = ${quotient}.`,
  };
}

export function generateIntegerCompare(levelConfig: LevelConfig): IntegerCompareProblem {
  const limits = resolveLevelLimits(levelConfig);
  const left = randomInteger(limits.maxIntegerAbsolute, true);
  let right = randomInteger(limits.maxIntegerAbsolute, true);
  while (right === left) {
    right = randomInteger(limits.maxIntegerAbsolute, true);
  }
  const answer = left < right ? '<' : '>';
  return {
    prompt: `¿Cuál es mayor: ${formatInteger(left)} o ${formatInteger(right)}?`,
    operation: 'integer-compare',
    answer,
    explanation: `${formatInteger(left)} ${answer === '<' ? 'es menor que' : 'es mayor que'} ${formatInteger(right)}.`,
  };
}

export function generateIntegerOrder(levelConfig: LevelConfig): IntegerOrderProblem {
  const limits = resolveLevelLimits(levelConfig);
  const values = Array.from({ length: 4 }, () => randomInteger(limits.maxIntegerAbsolute, true));
  const unique = Array.from(new Set(values));
  while (unique.length < 4) {
    unique.push(randomInteger(limits.maxIntegerAbsolute, true));
  }
  const sorted = [...unique.slice(0, 4)].sort((a, b) => a - b);
  const labels = sorted.map(formatInteger);
  const answer = labels.join(', ');
  const shuffled = shuffle(sorted.map(formatInteger));
  const options = shuffle([answer, shuffle([...labels]).join(', '), shuffle([...labels]).join(', '), shuffle([...labels]).join(', ')]).slice(0, 4);
  return {
    prompt: 'Ordena de menor a mayor:',
    values: shuffled,
    options,
    operation: 'integer-order',
    answer,
    explanation: `Orden correcto: ${answer}.`,
  };
}

export function generateIntegerProblem(
  levelConfig: LevelConfig,
  operation: IntegerArithmeticProblem['operation'],
): IntegerArithmeticProblem {
  switch (operation) {
    case 'integer-addition':
      return generateIntegerAddition(levelConfig);
    case 'integer-subtraction':
      return generateIntegerSubtraction(levelConfig);
    case 'integer-multiplication':
      return generateIntegerMultiplication(levelConfig);
    case 'integer-division':
      return generateIntegerDivision(levelConfig);
    default: {
      const exhaustive: never = operation;
      throw new Error(`Operación entera no soportada: ${exhaustive}`);
    }
  }
}
