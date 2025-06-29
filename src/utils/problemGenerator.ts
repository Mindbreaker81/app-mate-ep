import type { Operation, Problem } from '../types';

export function generateProblem(operation: Operation): Problem {
  let num1: number, num2: number, answer: number;
  let question: string;
  let steps: string[];

  switch (operation) {
    case 'add':
      num1 = Math.floor(Math.random() * 100) + 1;
      num2 = Math.floor(Math.random() * 100) + 1;
      answer = num1 + num2;
      question = `${num1} + ${num2} = ?`;
      
      // Explicación más clara para sumas
      const unidades1 = num1 % 10;
      const decenas1 = Math.floor(num1 / 10);
      const unidades2 = num2 % 10;
      const decenas2 = Math.floor(num2 / 10);
      
      steps = [
        `Paso 1: Escribe ${num1} + ${num2}`,
        `Paso 2: Separa en unidades y decenas:`,
        `   ${num1} = ${decenas1} decenas + ${unidades1} unidades`,
        `   ${num2} = ${decenas2} decenas + ${unidades2} unidades`,
        `Paso 3: Suma las unidades: ${unidades1} + ${unidades2} = ${unidades1 + unidades2}`,
        `Paso 4: Suma las decenas: ${decenas1} + ${decenas2} = ${decenas1 + decenas2}`,
        `Paso 5: Resultado: ${answer}`
      ];
      break;

    case 'sub':
      num1 = Math.floor(Math.random() * 100) + 50;
      num2 = Math.floor(Math.random() * num1) + 1;
      answer = num1 - num2;
      question = `${num1} - ${num2} = ?`;
      
      // Explicación más clara para restas
      const unidades1_sub = num1 % 10;
      const decenas1_sub = Math.floor(num1 / 10);
      const unidades2_sub = num2 % 10;
      const decenas2_sub = Math.floor(num2 / 10);
      
      steps = [
        `Paso 1: Escribe ${num1} - ${num2}`,
        `Paso 2: Separa en unidades y decenas:`,
        `   ${num1} = ${decenas1_sub} decenas + ${unidades1_sub} unidades`,
        `   ${num2} = ${decenas2_sub} decenas + ${unidades2_sub} unidades`,
        `Paso 3: Resta las unidades: ${unidades1_sub} - ${unidades2_sub} = ${unidades1_sub - unidades2_sub}`,
        `Paso 4: Resta las decenas: ${decenas1_sub} - ${decenas2_sub} = ${decenas1_sub - decenas2_sub}`,
        `Paso 5: Resultado: ${answer}`
      ];
      break;

    case 'mul':
      num1 = Math.floor(Math.random() * 12) + 1;
      num2 = Math.floor(Math.random() * 12) + 1;
      answer = num1 * num2;
      question = `${num1} × ${num2} = ?`;
      steps = [
        `Paso 1: Escribe ${num1} × ${num2}`,
        `Paso 2: Multiplica ${num1} por ${num2}`,
        `Paso 3: ${num1} × ${num2} = ${answer}`,
        `Paso 4: Resultado: ${answer}`
      ];
      break;

    case 'div':
      // Generar división exacta
      num2 = Math.floor(Math.random() * 12) + 1;
      answer = Math.floor(Math.random() * 12) + 1;
      num1 = num2 * answer;
      question = `${num1} ÷ ${num2} = ?`;
      steps = [
        `Paso 1: Escribe ${num1} ÷ ${num2}`,
        `Paso 2: Busca un número que multiplicado por ${num2} dé ${num1}`,
        `Paso 3: ${num2} × ${answer} = ${num1}`,
        `Paso 4: Resultado: ${answer}`
      ];
      break;

    default:
      throw new Error(`Operación no válida: ${operation}`);
  }

  return {
    question,
    answer,
    steps,
    operation
  };
}

export function getRandomOperation(): Operation {
  const operations: Operation[] = ['add', 'sub', 'mul', 'div'];
  return operations[Math.floor(Math.random() * operations.length)];
} 