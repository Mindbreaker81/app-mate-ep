import { describe, expect, it } from 'vitest';
import type { Problem } from '../../types';
import { LEVELS } from '../gameConfig';
import { generateOperation } from '../generators';
import { buildHint, simplifiableFractionNote, typicalMistakeMessage } from '../hints';

const config = LEVELS[3];

describe('buildHint', () => {
  it('da pistas graduales distintas en nivel 1 y 2', () => {
    const problem = generateOperation('mean', 3, config);
    const hint1 = buildHint(problem, 1);
    const hint2 = buildHint(problem, 2);
    expect(hint1).toBeTruthy();
    expect(hint2).toBeTruthy();
    expect(hint1).not.toBe(hint2);
  });

  it('siempre devuelve alguna pista incluso para operaciones sin plantilla', () => {
    const problem = generateOperation('addition', 3, config);
    expect(buildHint(problem, 1)).toBeTruthy();
  });
});

describe('typicalMistakeMessage', () => {
  it('detecta restas hechas al revés', () => {
    let problem = generateOperation('subtraction', 3, config);
    for (let i = 0; i < 20 && (problem as { num2: number }).num2 >= (problem as { num1: number }).num1; i += 1) {
      problem = generateOperation('subtraction', 3, config);
    }
    const { num1, num2, answer } = problem as { num1: number; num2: number; answer: number };
    if (num1 <= num2) {
      return; // no generó el caso buscado
    }
    expect(typicalMistakeMessage(problem, String(num2 - num1))).toMatch(/revés/i);
    expect(typicalMistakeMessage(problem, String(answer))).toBeNull();
  });

  it('detecta la media sin dividir', () => {
    const problem = generateOperation('mean', 3, config);
    if (problem.operation !== 'mean') {
      return;
    }
    const sum = problem.values.reduce((total, value) => total + value, 0);
    if (sum === problem.answer) {
      return;
    }
    expect(typicalMistakeMessage(problem, String(sum))).toMatch(/media/i);
  });

  it('detecta errores de coma decimal', () => {
    const problem = generateOperation('decimal-addition', 3, config);
    if (problem.operation !== 'decimal-addition') {
      return;
    }
    if (problem.answer === 0) {
      return;
    }
    const offByTen = problem.answer * 10;
    expect(typicalMistakeMessage(problem, String(offByTen))).toMatch(/coma/i);
  });

  it('devuelve null para respuestas sin patrón conocido', () => {
    const problem = generateOperation('addition', 3, config);
    if (problem.operation !== 'addition') {
      return;
    }
    expect(typicalMistakeMessage(problem, String(problem.answer + 7))).toBeNull();
  });
});

describe('simplifiableFractionNote', () => {
  it('avisa cuando la fracción correcta no está simplificada', () => {
    const problem = generateOperation('fraction-addition', 3, config);
    if (problem.operation !== 'fraction-addition') {
      return;
    }
    const { numerator, denominator } = problem.answer;
    const doubled = { numerator: numerator * 2, denominator: denominator * 2 };
    expect(simplifiableFractionNote(problem, doubled.numerator, doubled.denominator)).toMatch(/simplificar/);
    expect(simplifiableFractionNote(problem, numerator, denominator)).toBeNull();
  });

  it('ignora problemas que no son de fracciones', () => {
    const problem = generateOperation('addition', 3, config);
    expect(simplifiableFractionNote(problem as unknown as Problem, 2, 4)).toBeNull();
  });
});
