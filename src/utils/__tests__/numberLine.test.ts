import { describe, expect, it } from 'vitest';
import { LEVELS } from '../gameConfig';
import { generateOperationForTest } from '../generators';
import {
  numberLineAltText,
  numberLineLabels,
  numberLineValueAt,
  type NumberLineSpec,
} from '../generators/numberLine';
import { answersMatch, formatProblemAnswer, isNumberLineProblem } from '../problemUtils';
import type { NumberLineProblem } from '../../types';

const LEVEL_2 = LEVELS[1];

function generateNumberLine(operation: 'number-line-decimal' | 'number-line-integer'): NumberLineProblem {
  const problem = generateOperationForTest(operation, 2, LEVEL_2);
  if (!isNumberLineProblem(problem)) {
    throw new Error(`Operación inesperada: ${problem.operation}`);
  }
  return problem;
}

describe('generador de recta numérica', () => {
  it('décimas y centésimas: valores exactos entre 0 y 1, sin negativos', () => {
    for (let i = 0; i < 80; i += 1) {
      const problem = generateNumberLine('number-line-decimal');
      expect(problem.operation).toBe('number-line-decimal');
      expect(problem.scale).toBeGreaterThanOrEqual(1);
      expect(problem.scale).toBeLessThanOrEqual(2);
      expect(problem.start).toBe(0);
      expect(problem.tickCount).toBeGreaterThanOrEqual(5);
      expect(problem.pointIndex).toBeGreaterThanOrEqual(1);
      expect(problem.pointIndex).toBeLessThanOrEqual(problem.tickCount - 2);
      // Exactitud: valor escalado entero (sin errores de coma flotante).
      expect(problem.answer * 10 ** problem.scale).toBeCloseTo(Math.round(problem.answer * 10 ** problem.scale), 6);
      expect(problem.answer).toBeGreaterThan(0);
      expect(problem.answer).toBeLessThan(1);
    }
  });

  it('enteros: respuesta entera y con negativos en algún momento del rango', () => {
    let sawNegative = false;
    for (let i = 0; i < 80; i += 1) {
      const problem = generateNumberLine('number-line-integer');
      expect(problem.operation).toBe('number-line-integer');
      expect(problem.scale).toBe(0);
      expect(Number.isInteger(problem.answer)).toBe(true);
      expect(Number.isInteger(problem.start)).toBe(true);
      sawNegative ||= problem.start < 0 || problem.answer < 0;
    }
    expect(sawNegative).toBe(true);
  });

  it('el valor de una marca es coherente con inicio, paso y posición', () => {
    const spec: NumberLineSpec = { start: 0.2, step: 0.1, tickCount: 6, pointIndex: 3, scale: 1 };
    expect(numberLineValueAt(spec, 0)).toBe(0.2);
    expect(numberLineValueAt(spec, 3)).toBeCloseTo(0.5, 6);
    // Escalado entero: sin deriva de coma flotante.
    expect(numberLineValueAt({ start: 0, step: 0.1, tickCount: 10, pointIndex: 3, scale: 1 }, 3) * 10).toBe(3);
  });

  it('la marca del punto no lleva etiqueta (la solución no se lee directamente)', () => {
    for (let i = 0; i < 40; i += 1) {
      const problem = generateNumberLine('number-line-decimal');
      const labels = numberLineLabels(problem);
      expect(labels).toHaveLength(problem.tickCount);
      expect(labels[problem.pointIndex]).toBe('');
      // Todas las demás marcas sí están etiquetadas.
      labels.forEach((label, index) => {
        if (index !== problem.pointIndex) {
          expect(label, `marca ${index} sin etiqueta`).not.toBe('');
        }
      });
    }
  });

  it('la alternativa textual explica la escala y no revela el valor del punto', () => {
    for (let i = 0; i < 30; i += 1) {
      const problem = generateNumberLine('number-line-decimal');
      const alt = numberLineAltText(problem);
      expect(alt).toContain('punto');
      // El texto no contiene el valor correcto escrito como número. Con
      // pointIndex 1 el paso coincide con la respuesta (es la escala misma).
      if (problem.pointIndex !== 1) {
        expect(alt).not.toContain(formatProblemAnswer(problem));
      }
    }
    // Caso determinista: el punto está en la 4.ª marca de una recta de décimas.
    const alt = numberLineAltText({ start: 0, step: 0.1, tickCount: 6, pointIndex: 3, scale: 1 });
    expect(alt).not.toContain('0.3');
    expect(alt).toContain('0.1');
  });
});

describe('respuestas de recta numérica', () => {
  it('acepta coma y punto, y el formateado como válido', () => {
    const problem = generateNumberLine('number-line-decimal');
    const canonical = formatProblemAnswer(problem);
    expect(answersMatch(problem, canonical)).toBe(true);
    const withComma = canonical.replace('.', ',');
    expect(answersMatch(problem, withComma)).toBe(true);
    expect(answersMatch(problem, '0')).toBe(false);
  });

  it('enteros aceptan el signo negativo', () => {
    for (let i = 0; i < 40; i += 1) {
      const problem = generateNumberLine('number-line-integer');
      expect(answersMatch(problem, formatProblemAnswer(problem))).toBe(true);
      expect(answersMatch(problem, String(problem.answer))).toBe(true);
      expect(answersMatch(problem, String(problem.answer + 1))).toBe(false);
    }
  });
});
