import type { Problem, PracticeMode } from '../types';
import { LEVELS } from './gameConfig';

export function generateProblem(level: number, practiceMode: PracticeMode = 'all'): Problem {
  const levelConfig = LEVELS.find(l => l.id === level) || LEVELS[0];
  const maxNumber = levelConfig.maxNumber;
  
  // Determinar qué operaciones usar basado en el modo de práctica
  let availableOperations = levelConfig.operations;
  if (practiceMode !== 'all') {
    const operationMap = {
      'addition': ['addition'],
      'subtraction': ['subtraction'],
      'multiplication': ['multiplication'],
      'division': ['division']
    };
    availableOperations = operationMap[practiceMode] || availableOperations;
  }
  
  const operation = availableOperations[Math.floor(Math.random() * availableOperations.length)];
  
  let num1: number, num2: number, answer: number, explanation: string;
  
  switch (operation) {
    case 'addition':
      num1 = Math.floor(Math.random() * maxNumber) + 1;
      num2 = Math.floor(Math.random() * maxNumber) + 1;
      answer = num1 + num2;
      explanation = generateAdditionExplanation(num1, num2);
      break;
      
    case 'subtraction':
      num1 = Math.floor(Math.random() * maxNumber) + 1;
      num2 = Math.floor(Math.random() * (num1 - 1)) + 1; // Asegurar resultado positivo (num1 > num2)
      answer = num1 - num2;
      explanation = generateSubtractionExplanation(num1, num2);
      break;
      
    case 'multiplication':
      num1 = Math.floor(Math.random() * 12) + 1; // Tablas del 1 al 12
      num2 = Math.floor(Math.random() * 12) + 1;
      answer = num1 * num2;
      explanation = generateMultiplicationExplanation(num1, num2);
      break;
      
    case 'division':
      // Generar división exacta
      num2 = Math.floor(Math.random() * 12) + 1; // Divisor del 1 al 12
      answer = Math.floor(Math.random() * 12) + 1; // Cociente del 1 al 12
      num1 = num2 * answer; // Dividendo = divisor × cociente
      explanation = generateDivisionExplanation(num1, num2);
      break;
      
    default:
      num1 = Math.floor(Math.random() * maxNumber) + 1;
      num2 = Math.floor(Math.random() * maxNumber) + 1;
      answer = num1 + num2;
      explanation = generateAdditionExplanation(num1, num2);
  }
  
  return {
    num1,
    num2,
    operation: operation as 'addition' | 'subtraction' | 'multiplication' | 'division',
    answer,
    explanation
  };
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

// Función para calcular el tiempo de respuesta
export function calculateResponseTime(startTime: number): number {
  return Math.round((Date.now() - startTime) / 1000); // Tiempo en segundos
}

// Función para determinar la dificultad basada en el nivel y operación
export function getDifficulty(level: number, operation: string): 'easy' | 'medium' | 'hard' {
  // Dificultad específica por operación primero
  if (operation === 'multiplication' && level >= 3) return 'hard';
  if (operation === 'division' && level >= 2) return 'hard';
  
  // Dificultad general por nivel
  if (level === 1) return 'easy';
  if (level === 2) return 'medium';
  if (level === 3) return 'medium';
  if (level === 4) return 'hard';
  
  return 'medium';
}