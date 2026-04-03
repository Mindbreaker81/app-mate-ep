import type {
  EstimationProblem,
  FactorizationProblem,
  Fraction,
  GradeId,
  MixedProblem,
  Operation,
  PercentageProblem,
  PowerProblem,
  PracticeMode,
  Problem,
} from '../types';
import { LEVELS, getGradeConfig } from './gameConfig';
import { recordMixedAnomaly } from '../services/instrumentationService';
import { evaluateMathTokens } from './expressionUtils';
import { simplifyFraction } from './fractionUtils';
import { formatMathNumber, roundToPrecision } from './mathUtils';

type LevelConfig = (typeof LEVELS)[number];

const randomInt = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const PERCENT_OPTIONS = [10, 20, 25, 50, 75] as const;

function pickRandom<T>(values: readonly T[]): T {
  return values[randomInt(0, values.length - 1)];
}

function shuffle<T>(values: T[]): T[] {
  const clone = [...values];
  for (let index = clone.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(0, index);
    [clone[index], clone[swapIndex]] = [clone[swapIndex], clone[index]];
  }
  return clone;
}

function randomDecimal(maxWhole: number, maxPlaces: number): number {
  const places = randomInt(1, Math.max(1, maxPlaces));
  const scale = 10 ** places;
  return roundToPrecision(randomInt(1, Math.max(1, maxWhole * scale)) / scale, maxPlaces);
}

function getAvailableOperations(levelConfig: LevelConfig, practiceMode: PracticeMode, grade: GradeId): Operation[] {
  const gradeOperations = levelConfig.operations.filter((operation) =>
    getGradeConfig(grade).availableOperations.includes(operation),
  );

  const operationMap: Record<PracticeMode, Operation[]> = {
    all: gradeOperations,
    addition: ['addition'],
    subtraction: ['subtraction'],
    multiplication: ['multiplication'],
    division: ['division'],
    fractions:
      grade === '5e'
        ? ['fraction-addition', 'fraction-subtraction', 'fraction-multiplication', 'fraction-division']
        : ['fraction-addition', 'fraction-subtraction'],
    mixed: ['mixed'],
    decimals: ['decimal-addition', 'decimal-subtraction', 'decimal-multiplication', 'decimal-division'],
    powers: ['power'],
    percentages: ['percentage'],
    estimation: ['estimation'],
    factorization: ['factorization'],
  };

  const selected = practiceMode === 'all' ? gradeOperations : operationMap[practiceMode].filter((operation) => gradeOperations.includes(operation));
  return selected.length > 0 ? selected : gradeOperations;
}

export function generateProblem(level: number, practiceMode: PracticeMode = 'all', grade: GradeId = '4t'): Problem {
  const levelConfig = LEVELS.find(l => l.id === level) || LEVELS[0];
  const availableOperations = getAvailableOperations(levelConfig, practiceMode, grade);
  const operation = availableOperations[randomInt(0, availableOperations.length - 1)];

  let num1: number;
  let num2: number;
  let answer: number;
  let explanation: string;
  let frac1: Fraction;
  let frac2: Fraction;
  let fracAnswer: Fraction;

  switch (operation) {
    case 'addition':
      num1 = randomInt(1, levelConfig.maxNumber);
      num2 = randomInt(1, levelConfig.maxNumber);
      answer = num1 + num2;
      explanation = generateAdditionExplanation(num1, num2);
      return { num1, num2, operation: 'addition', answer, explanation };
    case 'subtraction':
      num1 = randomInt(1, levelConfig.maxNumber);
      num2 = randomInt(1, Math.max(1, num1 - 1));
      answer = num1 - num2;
      explanation = generateSubtractionExplanation(num1, num2);
      return { num1, num2, operation: 'subtraction', answer, explanation };
    case 'multiplication':
      num1 = randomInt(1, levelConfig.maxNumberMult);
      num2 = randomInt(1, levelConfig.maxNumberMult);
      answer = num1 * num2;
      explanation = generateMultiplicationExplanation(num1, num2);
      return { num1, num2, operation: 'multiplication', answer, explanation };
    case 'division':
      num2 = randomInt(1, levelConfig.maxNumberDiv);
      answer = randomInt(1, levelConfig.maxNumberDiv);
      num1 = num2 * answer;
      explanation = generateDivisionExplanation(num1, num2);
      return { num1, num2, operation: 'division', answer, explanation };
    case 'decimal-addition':
      return generateDecimalProblem(levelConfig, 'decimal-addition');
    case 'decimal-subtraction':
      return generateDecimalProblem(levelConfig, 'decimal-subtraction');
    case 'decimal-multiplication':
      return generateDecimalProblem(levelConfig, 'decimal-multiplication');
    case 'decimal-division':
      return generateDecimalProblem(levelConfig, 'decimal-division');
    case 'fraction-addition':
      frac1 = randomProperFraction(levelConfig.maxDenominator);
      frac2 = randomProperFraction(levelConfig.maxDenominator);
      fracAnswer = addFractions(frac1, frac2);
      explanation = generateFractionAdditionExplanation(frac1, frac2, fracAnswer);
      return {
        num1: frac1,
        num2: frac2,
        operation: 'fraction-addition',
        answer: fracAnswer,
        explanation
      };
    case 'fraction-subtraction':
      frac1 = randomProperFraction(levelConfig.maxDenominator);
      frac2 = randomProperFraction(levelConfig.maxDenominator);
      if (frac1.numerator * frac2.denominator < frac2.numerator * frac1.denominator) {
        [frac1, frac2] = [frac2, frac1];
      }
      fracAnswer = subtractFractions(frac1, frac2);
      explanation = generateFractionSubtractionExplanation(frac1, frac2, fracAnswer);
      return {
        num1: frac1,
        num2: frac2,
        operation: 'fraction-subtraction',
        answer: fracAnswer,
        explanation
      };
    case 'fraction-multiplication':
      frac1 = randomProperFraction(levelConfig.maxDenominator);
      frac2 = randomProperFraction(levelConfig.maxDenominator);
      fracAnswer = multiplyFractions(frac1, frac2);
      explanation = generateFractionMultiplicationExplanation(frac1, frac2, fracAnswer);
      return {
        num1: frac1,
        num2: frac2,
        operation: 'fraction-multiplication',
        answer: fracAnswer,
        explanation,
      };
    case 'fraction-division':
      frac1 = randomProperFraction(levelConfig.maxDenominator);
      frac2 = randomProperFraction(levelConfig.maxDenominator);
      fracAnswer = divideFractions(frac1, frac2);
      explanation = generateFractionDivisionExplanation(frac1, frac2, fracAnswer);
      return {
        num1: frac1,
        num2: frac2,
        operation: 'fraction-division',
        answer: fracAnswer,
        explanation,
      };
    case 'mixed':
      return generateMixedProblem(level, levelConfig);
    case 'power':
      return generatePowerProblem(levelConfig);
    case 'percentage':
      return generatePercentageProblem(levelConfig);
    case 'estimation':
      return generateEstimationProblem(levelConfig);
    case 'factorization':
      return generateFactorizationProblem(levelConfig);
    default:
      throw new Error('Operación no soportada en generateProblem');
  }
}

function generateAdditionExplanation(num1: number, num2: number): string {
  if (num1 < 10 && num2 < 10) {
    return `Suma simple: ${num1} + ${num2} = ${num1 + num2}`;
  }
  
  // Descomponer números de dos dígitos
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
  
  // Descomponer números de dos dígitos
  if (num1 >= 10 && num2 >= 10) {
    const num1Tens = Math.floor(num1 / 10);
    const num1Units = num1 % 10;
    const num2Tens = Math.floor(num2 / 10);
    const num2Units = num2 % 10;
    
    if (num1Units >= num2Units) {
      return `Paso 1: Resta las unidades: ${num1Units} - ${num2Units} = ${num1Units - num2Units}\n` +
             `Paso 2: Resta las decenas: ${num1Tens}0 - ${num2Tens}0 = ${(num1Tens - num2Tens) * 10}\n` +
             `Paso 3: Suma todo: ${num1Units - num2Units} + ${(num1Tens - num2Tens) * 10} = ${num1 - num2}`;
    } else {
      return `Paso 1: Pide prestado 1 decena: ${num1Units} + 10 - ${num2Units} = ${num1Units + 10 - num2Units}\n` +
             `Paso 2: Resta las decenas: ${num1Tens - 1}0 - ${num2Tens}0 = ${(num1Tens - 1 - num2Tens) * 10}\n` +
             `Paso 3: Suma todo: ${num1Units + 10 - num2Units} + ${(num1Tens - 1 - num2Tens) * 10} = ${num1 - num2}`;
    }
  }
  
  return `Resta: ${num1} - ${num2} = ${num1 - num2}`;
}

function generateMultiplicationExplanation(num1: number, num2: number): string {
  if (num1 <= 5 && num2 <= 5) {
    return `Multiplicación simple: ${num1} × ${num2} = ${num1 * num2}`;
  }
  
  // Para multiplicaciones más complejas, usar descomposición
  if (num1 > 5 || num2 > 5) {
    const smaller = Math.min(num1, num2);
    const larger = Math.max(num1, num2);
    
    if (smaller <= 5) {
      return `Multiplicación: ${larger} × ${smaller} = ${larger * smaller}`;
    } else {
      return `Multiplicación compleja:\n` +
             `Paso 1: Descompone ${larger} = ${Math.floor(larger/10)}0 + ${larger % 10}\n` +
             `Paso 2: Multiplica por ${smaller}: (${Math.floor(larger/10)}0 × ${smaller}) + (${larger % 10} × ${smaller})\n` +
             `Paso 3: Suma: ${Math.floor(larger/10) * 10 * smaller} + ${(larger % 10) * smaller} = ${larger * smaller}`;
    }
  }
  
  return `Multiplicación: ${num1} × ${num2} = ${num1 * num2}`;
}

function generateDivisionExplanation(num1: number, num2: number): string {
  const quotient = num1 / num2;
  
  if (num2 <= 5) {
    return `División simple: ${num1} ÷ ${num2} = ${quotient}`;
  }
  
  // Para divisiones más complejas
  if (num2 > 5) {
    return `División compleja:\n` +
           `Paso 1: Busca un número que multiplicado por ${num2} dé ${num1}\n` +
           `Paso 2: ${num2} × ${quotient} = ${num1}\n` +
           `Paso 3: Por tanto, ${num1} ÷ ${num2} = ${quotient}`;
  }
  
  return `División: ${num1} ÷ ${num2} = ${quotient}`;
}

function generateDecimalProblem(
  levelConfig: LevelConfig,
  operation: Extract<
    Operation,
    'decimal-addition' | 'decimal-subtraction' | 'decimal-multiplication' | 'decimal-division'
  >,
): Problem {
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

  return {
    num1,
    num2,
    operation,
    answer,
    explanation,
  };
}

function randomProperFraction(maxDenominator: number = 12): Fraction {
  const denominator = Math.floor(Math.random() * (maxDenominator - 2)) + 3; // 3 a maxDenominator
  const numerator = Math.floor(Math.random() * (denominator - 1)) + 1; // 1 a denominator-1
  return { numerator, denominator };
}

function addFractions(a: Fraction, b: Fraction): Fraction {
  const numerator = a.numerator * b.denominator + b.numerator * a.denominator;
  const denominator = a.denominator * b.denominator;
  return simplifyFraction({ numerator, denominator });
}

function subtractFractions(a: Fraction, b: Fraction): Fraction {
  const numerator = a.numerator * b.denominator - b.numerator * a.denominator;
  const denominator = a.denominator * b.denominator;
  return simplifyFraction({ numerator, denominator });
}

function multiplyFractions(a: Fraction, b: Fraction): Fraction {
  return simplifyFraction({
    numerator: a.numerator * b.numerator,
    denominator: a.denominator * b.denominator,
  });
}

function divideFractions(a: Fraction, b: Fraction): Fraction {
  return simplifyFraction({
    numerator: a.numerator * b.denominator,
    denominator: a.denominator * b.numerator,
  });
}

function generateMixedProblem(level: number, levelConfig: LevelConfig): MixedProblem {
  const additionRange = Math.max(6, Math.min(levelConfig.maxNumber, 60));
  const factorRange = Math.max(4, Math.min(levelConfig.maxNumberMult, 12));
  const divisorRange = Math.max(2, Math.min(levelConfig.maxNumberDiv, 12));

  const buildAddition = () => randomInt(2, additionRange);
  const buildFactor = () => randomInt(2, factorRange);
  const buildDivisor = () => randomInt(2, divisorRange);

  const templates: Array<() => MixedProblem> = [
    () => {
      const a = buildAddition();
      const b = buildFactor();
      const c = buildFactor();
      const product = b * c;
      const answer = a + product;
      return {
        expression: `${a} + ${b} × ${c}`,
        tokens: [a, '+', b, '×', c],
        operation: 'mixed',
        answer,
        explanation: `Paso 1: Calcula primero la multiplicación: ${b} × ${c} = ${product}.
Paso 2: Suma el resultado: ${a} + ${product} = ${answer}.`,
      };
    },
    () => {
      const b = buildFactor();
      const c = buildFactor();
      const product = b * c;
      const a = product + buildAddition();
      const answer = a - product;
      return {
        expression: `${a} - ${b} × ${c}`,
        tokens: [a, '-', b, '×', c],
        operation: 'mixed',
        answer,
        explanation: `Paso 1: Multiplica primero: ${b} × ${c} = ${product}.
Paso 2: Resta el resultado: ${a} - ${product} = ${answer}.`,
      };
    },
    () => {
      const a = buildAddition();
      const b = buildAddition();
      const c = buildFactor();
      const sum = a + b;
      const answer = sum * c;
      return {
        expression: `(${a} + ${b}) × ${c}`,
        tokens: ['(', a, '+', b, ')', '×', c],
        operation: 'mixed',
        answer,
        explanation: `Paso 1: Resuelve el paréntesis: ${a} + ${b} = ${sum}.
Paso 2: Multiplica el resultado: ${sum} × ${c} = ${answer}.`,
      };
    },
    () => {
      const a = randomInt(8, additionRange + 5);
      const b = randomInt(2, Math.max(2, Math.min(a - 1, additionRange)));
      const c = buildFactor();
      const difference = a - b;
      const answer = difference * c;
      return {
        expression: `(${a} - ${b}) × ${c}`,
        tokens: ['(', a, '-', b, ')', '×', c],
        operation: 'mixed',
        answer,
        explanation: `Paso 1: Resuelve el paréntesis: ${a} - ${b} = ${difference}.
Paso 2: Multiplica el resultado: ${difference} × ${c} = ${answer}.`,
      };
    },
    () => {
      const a = buildFactor();
      const b = buildFactor();
      const c = buildAddition();
      const product = a * b;
      const answer = product + c;
      return {
        expression: `${a} × ${b} + ${c}`,
        tokens: [a, '×', b, '+', c],
        operation: 'mixed',
        answer,
        explanation: `Paso 1: Multiplica primero: ${a} × ${b} = ${product}.
Paso 2: Suma el resultado: ${product} + ${c} = ${answer}.`,
      };
    },
    () => {
      const divisor = buildDivisor();
      const quotient = randomInt(2, Math.max(3, Math.min(level + 3, 12)));
      const dividend = divisor * quotient;
      const c = buildAddition();
      const answer = quotient + c;
      return {
        expression: `${dividend} ÷ ${divisor} + ${c}`,
        tokens: [dividend, '÷', divisor, '+', c],
        operation: 'mixed',
        answer,
        explanation: `Paso 1: Resuelve la división: ${dividend} ÷ ${divisor} = ${quotient}.
Paso 2: Suma el resultado: ${quotient} + ${c} = ${answer}.`,
      };
    },
  ];

  const templateIndex = randomInt(0, templates.length - 1);
  const builder = templates[templateIndex];

  try {
    const problem = builder();

    if (!Number.isInteger(problem.answer)) {
      recordMixedAnomaly('non-integer-answer', {
        level,
        expression: problem.expression,
        answer: problem.answer,
        templateIndex,
      });
      problem.answer = Math.round(problem.answer);
    }

    if (!problem.tokens || problem.tokens.length < 3) {
      recordMixedAnomaly('token-issue', {
        expression: problem.expression,
        tokens: problem.tokens,
        level,
        templateIndex,
      });
    }

    try {
      const computed = evaluateMathTokens(problem.tokens);
      if (computed !== problem.answer) {
        recordMixedAnomaly('expression-mismatch', {
          expression: problem.expression,
          computed,
          expected: problem.answer,
          level,
          templateIndex,
        });
        problem.answer = typeof computed === 'number' ? Math.round(computed) : problem.answer;
      }
    } catch (expressionError) {
      recordMixedAnomaly('expression-mismatch', {
        expression: problem.expression,
        error: expressionError instanceof Error ? expressionError.message : expressionError,
        level,
        templateIndex,
      });
    }

    return problem;
  } catch (error) {
    recordMixedAnomaly('builder-error', {
      level,
      templateIndex,
      error: error instanceof Error ? error.message : error,
    });
    throw error;
  }
}

function generatePowerProblem(levelConfig: LevelConfig): PowerProblem {
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

function generatePercentageProblem(levelConfig: LevelConfig): PercentageProblem {
  const template = randomInt(0, 2);
  const percent = pickRandom(PERCENT_OPTIONS);

  if (template === 0) {
    const divisor = percent === 25 || percent === 75 ? 4 : percent === 20 ? 5 : 10;
    const base = divisor * randomInt(2, Math.max(2, Math.floor(levelConfig.maxPercentageBase / divisor)));
    const answer = roundToPrecision((base * percent) / 100, 3);
    return {
      prompt: `¿Cuánto es el ${percent}% de ${base}?`,
      operation: 'percentage',
      answer,
      explanation: `Paso 1: Convierte ${percent}% en fracción: ${percent}/100.\nPaso 2: Multiplica ${base} × ${percent}/100 = ${formatMathNumber(answer)}.\nPaso 3: El ${percent}% de ${base} es ${formatMathNumber(answer)}.`,
    };
  }

  if (template === 1) {
    const divisor = percent === 25 || percent === 75 ? 4 : percent === 20 ? 5 : 10;
    const total = divisor * randomInt(2, Math.max(2, Math.floor(levelConfig.maxPercentageBase / divisor)));
    const part = roundToPrecision((total * percent) / 100, 3);
    return {
      prompt: `¿Qué porcentaje de ${total} es ${formatMathNumber(part)}?`,
      operation: 'percentage',
      answer: percent,
      explanation: `Paso 1: Divide la parte entre el total: ${formatMathNumber(part)} ÷ ${total} = ${formatMathNumber(part / total)}.\nPaso 2: Multiplica por 100.\nPaso 3: ${formatMathNumber(part)} es el ${percent}% de ${total}.`,
    };
  }

  const quantity1 = randomInt(2, 6);
  const pricePerItem = randomInt(1, Math.max(2, Math.min(levelConfig.maxNumberMult, 12)));
  const quantity2 = quantity1 + randomInt(1, 5);
  const total1 = quantity1 * pricePerItem;
  const answer = quantity2 * pricePerItem;

  return {
    prompt: `Si ${quantity1} cuadernos cuestan ${total1} €, ¿cuánto cuestan ${quantity2}?`,
    operation: 'percentage',
    answer,
    explanation: `Paso 1: Calcula el precio de un cuaderno: ${total1} ÷ ${quantity1} = ${pricePerItem}.\nPaso 2: Multiplica por ${quantity2}: ${pricePerItem} × ${quantity2} = ${answer}.\nPaso 3: ${quantity2} cuadernos cuestan ${answer} €.`,
  };
}

function roundToNearestTen(value: number): number {
  return Math.round(value / 10) * 10;
}

function generateEstimationProblem(levelConfig: LevelConfig): EstimationProblem {
  const num1 = randomInt(15, Math.max(20, Math.min(levelConfig.maxNumber, 99)));
  const num2 = randomInt(12, Math.max(18, Math.min(levelConfig.maxNumberMult * 2, 99)));
  const rounded1 = roundToNearestTen(num1);
  const rounded2 = roundToNearestTen(num2);
  const answer = rounded1 * rounded2;
  const step = Math.max(50, Math.round(Math.max(answer, 100) * 0.25 / 10) * 10);
  const options = shuffle(
    Array.from(new Set([answer, Math.max(10, answer - step), answer + step, answer + step * 2])),
  );

  while (options.length < 4) {
    options.push(answer + step * (options.length + 1));
  }

  return {
    prompt: `¿Cuál es la mejor estimación de ${num1} × ${num2}?`,
    options: options.slice(0, 4),
    operation: 'estimation',
    answer,
    explanation: `Paso 1: Redondea ${num1} a ${rounded1} y ${num2} a ${rounded2}.\nPaso 2: Multiplica ${rounded1} × ${rounded2} ≈ ${answer}.\nPaso 3: La mejor estimación es ${answer}.`,
  };
}

function primeFactorize(value: number): number[] {
  const factors: number[] = [];
  let remaining = value;
  let divisor = 2;

  while (remaining > 1) {
    while (remaining % divisor === 0) {
      factors.push(divisor);
      remaining /= divisor;
    }
    divisor += 1;
  }

  return factors;
}

function isPrime(value: number): boolean {
  if (value < 2) return false;
  for (let divisor = 2; divisor <= Math.sqrt(value); divisor += 1) {
    if (value % divisor === 0) {
      return false;
    }
  }
  return true;
}

function randomCompositeNumber(maxValue: number): number {
  let candidate = randomInt(12, Math.max(12, maxValue));
  while (isPrime(candidate)) {
    candidate = randomInt(12, Math.max(12, maxValue));
  }
  return candidate;
}

function generateFactorizationProblem(levelConfig: LevelConfig): FactorizationProblem {
  const target = randomCompositeNumber(levelConfig.maxFactorizationNumber);
  const factors = primeFactorize(target);
  const explanation = factors.reduce<{ remaining: number; steps: string[] }>(
    (state, factor, index) => ({
      remaining: state.remaining / factor,
      steps: [...state.steps, `Paso ${index + 1}: ${state.remaining} ÷ ${factor} = ${state.remaining / factor}`],
    }),
    { remaining: target, steps: [] },
  );

  return {
    target,
    operation: 'factorization',
    answer: factors.join(' × '),
    explanation: `${explanation.steps.join('\n')}\nResultado: ${target} = ${factors.join(' × ')}`,
  };
}

function generateFractionAdditionExplanation(a: Fraction, b: Fraction, answer: Fraction): string {
  return (
    `Paso 1: Busca un denominador común: ${a.denominator} × ${b.denominator} = ${a.denominator * b.denominator}\n` +
    `Paso 2: Ajusta los numeradores: (${a.numerator} × ${b.denominator}) + (${b.numerator} × ${a.denominator}) = ` +
    `${a.numerator * b.denominator} + ${b.numerator * a.denominator} = ${a.numerator * b.denominator + b.numerator * a.denominator}\n` +
    `Paso 3: Escribe la fracción: (${a.numerator * b.denominator + b.numerator * a.denominator}) / (${a.denominator * b.denominator})\n` +
    `Paso 4: Simplifica la fracción: ${answer.numerator} / ${answer.denominator}`
  );
}

function generateFractionSubtractionExplanation(a: Fraction, b: Fraction, answer: Fraction): string {
  return (
    `Paso 1: Busca un denominador común: ${a.denominator} × ${b.denominator} = ${a.denominator * b.denominator}\n` +
    `Paso 2: Ajusta los numeradores: (${a.numerator} × ${b.denominator}) - (${b.numerator} × ${a.denominator}) = ` +
    `${a.numerator * b.denominator} - ${b.numerator * a.denominator} = ${a.numerator * b.denominator - b.numerator * a.denominator}\n` +
    `Paso 3: Escribe la fracción: (${a.numerator * b.denominator - b.numerator * a.denominator}) / (${a.denominator * b.denominator})\n` +
    `Paso 4: Simplifica la fracción: ${answer.numerator} / ${answer.denominator}`
  );
}

function generateFractionMultiplicationExplanation(a: Fraction, b: Fraction, answer: Fraction): string {
  return (
    `Paso 1: Multiplica los numeradores: ${a.numerator} × ${b.numerator} = ${a.numerator * b.numerator}\n` +
    `Paso 2: Multiplica los denominadores: ${a.denominator} × ${b.denominator} = ${a.denominator * b.denominator}\n` +
    `Paso 3: Simplifica la fracción resultante hasta obtener ${answer.numerator}/${answer.denominator}`
  );
}

function generateFractionDivisionExplanation(a: Fraction, b: Fraction, answer: Fraction): string {
  return (
    `Paso 1: Invierte la segunda fracción: ${b.numerator}/${b.denominator} pasa a ser ${b.denominator}/${b.numerator}\n` +
    `Paso 2: Multiplica ${a.numerator}/${a.denominator} × ${b.denominator}/${b.numerator}\n` +
    `Paso 3: Simplifica hasta obtener ${answer.numerator}/${answer.denominator}`
  );
}

// Función para calcular el tiempo de respuesta
export function calculateResponseTime(startTime: number): number {
  return Math.round((Date.now() - startTime) / 1000); // Tiempo en segundos
}

// Función para determinar la dificultad basada en el nivel y operación
export function getDifficulty(level: number, operation: string): 'easy' | 'medium' | 'hard' {
  // Dificultad específica por operación primero
  if (operation === 'multiplication' && level >= 3) return 'hard';
  if (operation === 'division' && level >= 2) return 'hard';
  if (operation === 'mixed') return level >= 4 ? 'hard' : level >= 2 ? 'medium' : 'easy';
  if (operation.startsWith('decimal-')) return level >= 4 ? 'hard' : 'medium';
  if (operation === 'fraction-multiplication' || operation === 'fraction-division') {
    return level >= 4 ? 'hard' : 'medium';
  }
  if (operation === 'power') return level >= 5 ? 'medium' : 'easy';
  if (operation === 'percentage' || operation === 'estimation' || operation === 'factorization') {
    return level >= 4 ? 'hard' : 'medium';
  }
  
  // Dificultad general por nivel
  if (level === 1) return 'easy';
  if (level === 2) return 'medium';
  if (level === 3) return 'medium';
  if (level === 4) return 'hard';
  
  return 'medium';
}