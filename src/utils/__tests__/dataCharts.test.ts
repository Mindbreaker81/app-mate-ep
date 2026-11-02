import { describe, expect, it } from 'vitest';
import { LEVELS } from '../gameConfig';
import { generateOperationForTest } from '../generators';
import { answersMatch, formatProblemAnswer, isDataChartProblem } from '../problemUtils';
import type { DataChartProblem } from '../../types';

const LEVEL_2 = LEVELS[1];

function generateDataChart(operation: 'bar-chart-reading' | 'pictogram-reading'): DataChartProblem {
  const problem = generateOperationForTest(operation, 2, LEVEL_2);
  if (!isDataChartProblem(problem)) {
    throw new Error(`Operación inesperada: ${problem.operation}`);
  }
  return problem;
}

describe('generador de gráficos de datos', () => {
  it('gráficos de barras: 3–5 categorías, frecuencias enteras y positivas', () => {
    for (let i = 0; i < 60; i += 1) {
      const problem = generateDataChart('bar-chart-reading');
      expect(problem.operation).toBe('bar-chart-reading');
      expect(problem.categories.length).toBeGreaterThanOrEqual(3);
      expect(problem.categories.length).toBeLessThanOrEqual(5);
      expect(problem.values).toHaveLength(problem.categories.length);
      for (const value of problem.values) {
        expect(Number.isInteger(value)).toBe(true);
        expect(value).toBeGreaterThan(0);
        expect(value).toBeLessThanOrEqual(12);
      }
      expect(new Set(problem.categories).size).toBe(problem.categories.length);
    }
  });

  it('pictogramas: símbolos completos, valores múltiplos de la leyenda', () => {
    for (let i = 0; i < 60; i += 1) {
      const problem = generateDataChart('pictogram-reading');
      expect(problem.operation).toBe('pictogram-reading');
      expect([1, 2, 5]).toContain(problem.symbolValue);
      expect(problem.symbol.trim()).not.toBe('');
      for (const value of problem.values) {
        expect(value % problem.symbolValue).toBe(0);
        expect(value / problem.symbolValue).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('pregunta «el más frecuente»: máximo único y opciones válidas', () => {
    let seenMostFrequent = false;
    for (let i = 0; i < 80; i += 1) {
      const problem = generateDataChart('bar-chart-reading');
      if (problem.question !== 'most-frequent') {
        continue;
      }
      seenMostFrequent = true;
      const max = Math.max(...problem.values);
      expect(problem.values.filter((value) => value === max)).toHaveLength(1);
      expect(problem.answer).toBe(problem.categories[problem.values.indexOf(max)]);
      expect(problem.options).toBeTruthy();
      expect(new Set(problem.options).size).toBe(problem.options!.length);
      expect(problem.options).toContain(problem.answer);
    }
    expect(seenMostFrequent).toBe(true);
  });

  it('pregunta «diferencia»: el resultado no aparece en la tabla (no se revela)', () => {
    for (let i = 0; i < 80; i += 1) {
      const problem = generateDataChart('bar-chart-reading');
      if (problem.question !== 'difference') {
        continue;
      }
      const [a, b] = problem.questionIndexes;
      expect(Math.abs(problem.values[a] - problem.values[b])).toBe(problem.answer);
      expect(problem.values).not.toContain(problem.answer);
    }
  });

  it('pregunta «total»: la suma de las frecuencias', () => {
    let seenTotal = false;
    for (let i = 0; i < 80; i += 1) {
      const problem = generateDataChart('pictogram-reading');
      if (problem.question !== 'total') {
        continue;
      }
      seenTotal = true;
      expect(problem.answer).toBe(problem.values.reduce((total, value) => total + value, 0));
    }
    expect(seenTotal).toBe(true);
  });

  it('las preguntas cubren frecuencia, total, diferencia y el más frecuente', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 120; i += 1) {
      seen.add(generateDataChart('bar-chart-reading').question);
      seen.add(generateDataChart('pictogram-reading').question);
    }
    expect([...seen].sort()).toEqual(['difference', 'frequency', 'most-frequent', 'total']);
  });
});

describe('respuestas de gráficos de datos', () => {
  it('numéricas: acepta coma y punto, y el formateado como válido', () => {
    for (let i = 0; i < 40; i += 1) {
      const problem = generateDataChart('bar-chart-reading');
      if (typeof problem.answer !== 'number') {
        continue;
      }
      expect(answersMatch(problem, formatProblemAnswer(problem))).toBe(true);
      expect(answersMatch(problem, String(problem.answer))).toBe(true);
      expect(answersMatch(problem, formatProblemAnswer(problem).replace('.', ','))).toBe(true);
      if (typeof problem.answer === 'number') {
        expect(answersMatch(problem, String(problem.answer + 1))).toBe(false);
      }
    }
  });

  it('«el más frecuente»: se responde tocando la opción correcta', () => {
    for (let i = 0; i < 40; i += 1) {
      const problem = generateDataChart('pictogram-reading');
      if (problem.question !== 'most-frequent') {
        continue;
      }
      expect(answersMatch(problem, problem.answer as string)).toBe(true);
      expect(answersMatch(problem, problem.options!.find((option) => option !== problem.answer)!)).toBe(false);
    }
  });
});
