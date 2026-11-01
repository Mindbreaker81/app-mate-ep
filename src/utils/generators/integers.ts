import type { IntegerArithmeticProblem, IntegerCompareProblem, IntegerOrderProblem } from '../../types';
import { formatInteger, randomInt, resolveLevelLimits, shuffle, type LevelConfig } from './shared';

function randomInteger(maxAbs: number, allowNegative: boolean): number {
  if (maxAbs < 2) {
    return randomInt(0, maxAbs);
  }
  if (!allowNegative) {
    // Incluye el cero: los enteros empiezan en 0 también.
    return randomInt(0, maxAbs);
  }
  return randomInt(-maxAbs, maxAbs);
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
  const bothNegative = levelConfig.id >= 4;
  const num1 = randomInteger(Math.min(limits.maxIntegerAbsolute, 12), levelConfig.id >= 3);
  // A partir del nivel 4 puede salir − × − (dos negativos).
  const num2 = randomInteger(Math.min(limits.maxIntegerAbsolute, 12), bothNegative && randomInt(0, 1) === 0);
  const answer = num1 * num2;
  return {
    display: `${formatInteger(num1)} × ${formatInteger(num2)}`,
    num1,
    num2,
    operation: 'integer-multiplication',
    answer,
    explanation: `Paso 1: Multiplica valores: ${Math.abs(num1)} × ${Math.abs(num2)} = ${Math.abs(answer)}.\nPaso 2: ${formatInteger(num1)} × ${formatInteger(num2)} = ${answer} (${signRuleText(num1, num2)}).`,
  };
}

function signRuleText(num1: number, num2: number): string {
  if (num1 >= 0 && num2 >= 0) return 'más por más es más';
  if (num1 <= 0 && num2 <= 0) return 'menos por menos es más';
  return 'menos por más (o más por menos) es menos';
}

export function generateIntegerDivision(levelConfig: LevelConfig): IntegerArithmeticProblem {
  // A partir del nivel 4 el divisor puede ser negativo.
  const allowNegativeDivisor = levelConfig.id >= 4 && randomInt(0, 1) === 0;
  const divisorAbs = randomInt(2, Math.min(levelConfig.maxNumberDiv, 12));
  const num2 = allowNegativeDivisor ? -divisorAbs : divisorAbs;
  const quotient = randomInt(-10, 10);
  const num1 = num2 * quotient;
  return {
    display: `${formatInteger(num1)} ÷ ${formatInteger(num2)}`,
    num1,
    num2,
    operation: 'integer-division',
    answer: quotient,
    explanation: `Paso 1: ${formatInteger(num2)} × ${formatInteger(quotient)} = ${formatInteger(num1)}.\nPaso 2: ${formatInteger(num1)} ÷ ${formatInteger(num2)} = ${formatInteger(quotient)}.`,
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
  // Relleno sin repetir valores (ordenar duplicados no tiene solución clara).
  let fillAttempts = 0;
  while (unique.length < 4 && fillAttempts < 100) {
    fillAttempts += 1;
    const candidate = randomInteger(limits.maxIntegerAbsolute, true);
    if (!unique.includes(candidate)) {
      unique.push(candidate);
    }
  }
  const sorted = [...unique.slice(0, 4)].sort((a, b) => a - b);
  const labels = sorted.map(formatInteger);
  const answer = labels.join(', ');

  // Opciones: la correcta más permutaciones distintas (nunca se pierde la correcta).
  const options: string[] = [answer];
  let attempts = 0;
  while (options.length < 4 && attempts < 50) {
    attempts += 1;
    const candidate = shuffle([...labels]).join(', ');
    if (!options.includes(candidate)) {
      options.push(candidate);
    }
  }
  const shuffled = shuffle(labels);
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
