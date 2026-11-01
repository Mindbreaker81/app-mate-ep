import { describe, expect, it } from 'vitest';
import { problemSpeechText, verbalizeMathText } from '../problemText';
import type { Problem } from '../../types';

describe('verbalizeMathText', () => {
  it('verbaliza operadores y la incógnita', () => {
    expect(verbalizeMathText('x + 4 = 9. ¿Cuánto vale x?')).toBe(
      'equis más 4 igual 9. ¿Cuánto vale equis?',
    );
    expect(verbalizeMathText('3x = 12. ¿Cuánto vale x?')).toBe('3 equis igual 12. ¿Cuánto vale equis?');
    expect(verbalizeMathText('720 - 280')).toBe('720 menos 280');
    expect(verbalizeMathText('22 × 28')).toBe('22 por 28');
    expect(verbalizeMathText('197 ÷ 10')).toBe('197 entre 10');
  });

  it('verbaliza fracciones con denominadores comunes y números mixtos', () => {
    expect(verbalizeMathText('Convierte 3/4 a decimal')).toContain('tres cuartos');
    expect(verbalizeMathText('Convierte 1/2 a decimal')).toContain('un medio');
    expect(verbalizeMathText('¿Cuál es mayor: 5/6 o 7/8?')).toContain('cinco sextos');
    // Denominador no común: lectura genérica comprensible.
    expect(verbalizeMathText('5/12')).toBe('5 entre 12');
    // Número mixto: «2 1/3» se lee «2 y un tercio».
    expect(verbalizeMathText('Convierte 2 1/3 a fracción impropia')).toBe(
      'Convierte 2 y un tercio a fracción impropia',
    );
  });

  it('verbaliza unidades, porcentajes, grados, euros y pi', () => {
    expect(verbalizeMathText('¿Cuántos cm son 2 m?')).toBe('¿Cuántos centímetros son 2 metros?');
    expect(verbalizeMathText('¿Cuántos cm² son 5 m²?')).toBe(
      '¿Cuántos centímetros cuadrados son 5 metros cuadrados?',
    );
    expect(verbalizeMathText('¿Cuántos cm³ son 2 L?')).toBe('¿Cuántos centímetros cúbicos son 2 litros?');
    expect(verbalizeMathText('¿Cuántos kg son 4 t?')).toBe('¿Cuántos kilogramos son 4 toneladas?');
    expect(verbalizeMathText('va a 80 km/h')).toBe('va a 80 kilómetros por hora');
    expect(verbalizeMathText('el 15% de 80')).toBe('el 15 por ciento de 80');
    expect(verbalizeMathText('¿Qué tipo de ángulo mide 90°?')).toBe('¿Qué tipo de ángulo mide 90 grados?');
    expect(verbalizeMathText('(usa π = 3.14)')).toBe('usa pi igual 3 coma 14');
    expect(verbalizeMathText('cuesta 20 €')).toBe('cuesta 20 euros');
  });

  it('verbaliza decimales con coma y razones', () => {
    expect(verbalizeMathText('¿Qué fracción es 0.75?')).toBe('¿Qué fracción es 0 coma 75?');
    expect(verbalizeMathText('Si 2:3 = 4:x, ¿cuánto vale x?')).toBe(
      'Si 2 es a 3 igual 4 es a equis, ¿cuánto vale equis?',
    );
    expect(verbalizeMathText('En un plano escala 1:100, 5 cm representan')).toBe(
      'En un plano escala 1 a 100, 5 centímetros representan',
    );
  });

  it('verbaliza comparaciones y potencias/raíces sueltas', () => {
    expect(verbalizeMathText('5 < 7')).toBe('5 menor que 7');
    expect(verbalizeMathText('7 > 5')).toBe('7 mayor que 5');
    expect(verbalizeMathText('√25')).toBe('raíz cuadrada de 25');
  });

  it('omite los paréntesis de inciso pero no altera su contenido', () => {
    expect(verbalizeMathText('¿Qué fracción es 75 %? (simplificada)')).toBe(
      '¿Qué fracción es 75 por ciento? simplificada',
    );
  });
});

describe('problemSpeechText', () => {
  it('verbaliza operaciones numéricas sin revelar la respuesta', () => {
    const problem: Problem = {
      num1: 7,
      num2: 5,
      operation: 'addition',
      answer: 12,
      explanation: '7 + 5 = 12',
    };
    const text = problemSpeechText(problem);
    expect(text).toBe('7 más 5');
    expect(text).not.toContain('12');
  });

  it('verbaliza cada operación aritmética y los decimales con coma', () => {
    const template = { answer: 0, explanation: '' };
    expect(problemSpeechText({ num1: 9, num2: 4, operation: 'subtraction', ...template })).toBe('9 menos 4');
    expect(problemSpeechText({ num1: 6, num2: 7, operation: 'multiplication', ...template })).toBe('6 por 7');
    expect(problemSpeechText({ num1: 8, num2: 2, operation: 'division', ...template })).toBe('8 entre 2');
    expect(
      problemSpeechText({ num1: 4.5, num2: 2, operation: 'decimal-addition', ...template }),
    ).toBe('4 coma 5 más 2');
  });

  it('verbaliza la división con resto pidiendo cociente y resto', () => {
    const problem: Problem = {
      num1: 7,
      num2: 2,
      operation: 'division-remainder',
      answer: { quotient: 3, remainder: 1 },
      explanation: '',
    };
    const text = problemSpeechText(problem);
    expect(text).toContain('7 entre 2');
    expect(text).toMatch(/cociente/);
    expect(text).toMatch(/resto/);
    expect(text).not.toContain('3 resto 1');
  });

  it('verbaliza fracciones y números mixtos con su operación', () => {
    const fraction: Problem = {
      num1: { numerator: 3, denominator: 4 },
      num2: { numerator: 1, denominator: 2 },
      operation: 'fraction-addition',
      answer: { numerator: 5, denominator: 4 },
      explanation: '',
    };
    expect(problemSpeechText(fraction)).toBe('tres cuartos más un medio');

    const mixedNumber: Problem = {
      num1: { whole: 2, numerator: 1, denominator: 3 },
      num2: { whole: 1, numerator: 1, denominator: 2 },
      operation: 'mixed-number-subtraction',
      answer: { whole: 0, numerator: 5, denominator: 6 },
      explanation: '',
    };
    expect(problemSpeechText(mixedNumber)).toBe('2 y un tercio menos 1 y un medio');
  });

  it('verbaliza potencias, raíces y expresiones con paréntesis', () => {
    expect(
      problemSpeechText({ base: 5, exponent: 2, operation: 'power', answer: 25, explanation: '' }),
    ).toBe('5 al cuadrado');
    expect(
      problemSpeechText({ base: 5, exponent: 3, operation: 'power', answer: 125, explanation: '' }),
    ).toBe('5 al cubo');
    expect(
      problemSpeechText({ radicand: 16, operation: 'square-root', answer: 4, explanation: '' }),
    ).toBe('raíz cuadrada de 16');

    const mixed: Problem = {
      expression: '(7 + 3) × 2',
      tokens: ['(', 7, '+', 3, ')', '×', 2],
      operation: 'mixed',
      answer: 20,
      explanation: '',
    };
    const text = problemSpeechText(mixed);
    expect(text).toBe('abre paréntesis 7 más 3 cierra paréntesis por 2');
  });

  it('verbaliza enteros con su signo', () => {
    const problem: Problem = {
      display: '(-3) + (-2)',
      num1: -3,
      num2: -2,
      operation: 'integer-addition',
      answer: -5,
      explanation: '',
    };
    expect(problemSpeechText(problem)).toBe('menos 3 más menos 2');
  });

  it('verbaliza prompts sin revelar la solución', () => {
    const percent: Problem = {
      prompt: '¿Cuánto es el 15% de 80?',
      operation: 'percentage',
      answer: 12,
      explanation: '',
    };
    const text = problemSpeechText(percent);
    expect(text).toBe('¿Cuánto es el 15 por ciento de 80?');
    expect(text).not.toContain('12');

    const word: Problem = {
      prompt: 'Tienes 20 caramelos y los repartes entre 4 amigos por igual. ¿Cuántos recibe cada uno?',
      operation: 'word-problem',
      answer: 5,
      explanation: '',
    };
    expect(problemSpeechText(word)).toContain('repartes entre 4 amigos');
    expect(problemSpeechText(word)).not.toContain('5');
  });

  it('verbaliza la factorización con la consigna en pantalla', () => {
    const problem: Problem = {
      target: 12,
      operation: 'factorization',
      answer: '2 × 2 × 3',
      explanation: '',
    };
    expect(problemSpeechText(problem)).toBe('Descompón 12 en factores primos');
    expect(problemSpeechText(problem)).not.toContain('2 por 2');
  });

  it('lee las opciones visibles sin señalar la correcta', () => {
    const angle: Problem = {
      prompt: '¿Qué tipo de ángulo mide 90°?',
      degrees: 90,
      operation: 'angle-type',
      answer: 'recto',
      options: ['agudo', 'recto', 'obtuso'],
      explanation: '',
    };
    const text = problemSpeechText(angle);
    expect(text).toContain('¿Qué tipo de ángulo mide 90 grados?');
    expect(text).toContain('Opciones: Agudo, Recto, Obtuso');

    const estimation: Problem = {
      prompt: '¿Cuál es la mejor estimación de 22 × 28?',
      options: [400, 500, 600, 700],
      operation: 'estimation',
      answer: 600,
      explanation: '',
    };
    const estText = problemSpeechText(estimation);
    expect(estText).toContain('22 por 28');
    expect(estText).toContain('Opciones: 400, 500, 600, 700');
  });

  it('verbaliza comparaciones y ordenaciones con sus opciones', () => {
    const compare: Problem = {
      prompt: '¿Cuál es mayor: 3/4 o 0.6?',
      operation: 'compare-fraction-decimal',
      answer: '<',
      explanation: '',
    };
    const text = problemSpeechText(compare);
    expect(text).toContain('tres cuartos o 0 coma 6');
    expect(text).toContain('El primero es menor');
    expect(text).toContain('Son iguales');

    const order: Problem = {
      prompt: 'Ordena de menor a mayor:',
      values: ['1/2', '0.4', '3/5'],
      options: ['0.4, 1/2, 3/5', '1/2, 3/5, 0.4'],
      operation: 'order-values',
      answer: '0.4, 1/2, 3/5',
      explanation: '',
    };
    const orderText = problemSpeechText(order);
    expect(orderText).toContain('un medio');
    expect(orderText).toContain('Opciones:');
    // Las opciones también se verbalizan (fracciones y decimales dentro).
    expect(orderText).toContain('0 coma 4');
  });
});
