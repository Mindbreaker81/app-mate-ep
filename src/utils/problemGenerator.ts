import type { Problem, PracticeMode, Fraction, MixedProblem } from '../types';
import { LEVELS } from './gameConfig';

type LevelConfig = (typeof LEVELS)[number];

const randomInt = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;

export function generateProblem(level: number, practiceMode: PracticeMode = 'all'): Problem {
  const levelConfig = LEVELS.find(l => l.id === level) || LEVELS[0];
  const maxNumber = levelConfig.maxNumber;
  const maxNumberMult = levelConfig.maxNumberMult;
  const maxNumberDiv = levelConfig.maxNumberDiv;
  const maxDenominator = levelConfig.maxDenominator;
  
  // Determinar qué operaciones usar basado en el modo de práctica
  let availableOperations = [...levelConfig.operations];
  if (practiceMode !== 'all') {
    const operationMap: Record<PracticeMode, typeof availableOperations> = {
      all: [...levelConfig.operations],
      addition: ['addition'],
      subtraction: ['subtraction'],
      multiplication: ['multiplication'],
      division: ['division'],
      fractions: ['fraction-addition', 'fraction-subtraction'],
      mixed: ['mixed'],
    };
    availableOperations = operationMap[practiceMode] ?? availableOperations;
  } else {
    availableOperations = Array.from(
      new Set([...availableOperations, 'fraction-addition', 'fraction-subtraction', 'mixed'] as const)
    );
  }

  const operation = availableOperations[Math.floor(Math.random() * availableOperations.length)];
  
  let num1: number, num2: number, answer: number, explanation: string;
  let frac1: Fraction, frac2: Fraction, fracAnswer: Fraction;
  
  switch (operation) {
    case 'addition':
      num1 = Math.floor(Math.random() * maxNumber) + 1;
      num2 = Math.floor(Math.random() * maxNumber) + 1;
      answer = num1 + num2;
      explanation = generateAdditionExplanation(num1, num2);
      return { num1, num2, operation: 'addition', answer, explanation } as Problem;
    case 'subtraction':
      num1 = Math.floor(Math.random() * maxNumber) + 1;
      num2 = Math.floor(Math.random() * (num1 - 1)) + 1;
      answer = num1 - num2;
      explanation = generateSubtractionExplanation(num1, num2);
      return { num1, num2, operation: 'subtraction', answer, explanation } as Problem;
    case 'multiplication':
      num1 = Math.floor(Math.random() * maxNumberMult) + 1;
      num2 = Math.floor(Math.random() * maxNumberMult) + 1;
      answer = num1 * num2;
      explanation = generateMultiplicationExplanation(num1, num2);
      return { num1, num2, operation: 'multiplication', answer, explanation } as Problem;
    case 'division':
      num2 = Math.floor(Math.random() * maxNumberDiv) + 1;
      answer = Math.floor(Math.random() * maxNumberDiv) + 1;
      num1 = num2 * answer;
      explanation = generateDivisionExplanation(num1, num2);
      return { num1, num2, operation: 'division', answer, explanation } as Problem;
    case 'fraction-addition':
      frac1 = randomProperFraction(maxDenominator);
      frac2 = randomProperFraction(maxDenominator);
      fracAnswer = addFractions(frac1, frac2);
      explanation = generateFractionAdditionExplanation(frac1, frac2, fracAnswer);
      return {
        num1: frac1,
        num2: frac2,
        operation: 'fraction-addition',
        answer: fracAnswer,
        explanation
      } as Problem;
    case 'fraction-subtraction':
      frac1 = randomProperFraction(maxDenominator);
      frac2 = randomProperFraction(maxDenominator);
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
      } as Problem;
    case 'mixed':
      return generateMixedProblem(level, levelConfig);
      
    default:
      throw new Error('Operación no soportada en generateProblem');
  }
  
  return {
    num1,
    num2,
    operation: operation as 'addition' | 'subtraction' | 'multiplication' | 'division' | 'fraction-addition' | 'fraction-subtraction',
    answer,
    explanation
  } as Problem;
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

function randomProperFraction(maxDenominator: number = 12): Fraction {
  const denominator = Math.floor(Math.random() * (maxDenominator - 2)) + 3; // 3 a maxDenominator
  const numerator = Math.floor(Math.random() * (denominator - 1)) + 1; // 1 a denominator-1
  return { numerator, denominator };
}

function simplifyFraction(frac: Fraction): Fraction {
  function gcd(a: number, b: number): number {
    return b === 0 ? a : gcd(b, a % b);
  }
  const divisor = gcd(frac.numerator, frac.denominator);
  return {
    numerator: frac.numerator / divisor,
    denominator: frac.denominator / divisor,
  };
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

  const builder = templates[randomInt(0, templates.length - 1)];
  return builder();
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
  
  // Dificultad general por nivel
  if (level === 1) return 'easy';
  if (level === 2) return 'medium';
  if (level === 3) return 'medium';
  if (level === 4) return 'hard';
  
  return 'medium';
}