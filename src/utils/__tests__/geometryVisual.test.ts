import { describe, expect, it } from 'vitest';
import {
  generateCoordinateValue,
  generatePlaneTransform,
  generateShapeClassification,
} from '../generators/geometryVisual';
import { answersMatch, formatProblemAnswer } from '../problemUtils';
import type { GridPoint } from '../../types';

function verticesKey(vertices: GridPoint[]): string {
  return vertices.map((vertex) => `${vertex.x},${vertex.y}`).join('|');
}

function figureInBounds(figure: GridPoint[]): boolean {
  return figure.every((vertex) => vertex.x >= 0 && vertex.x <= 10 && vertex.y >= 0 && vertex.y <= 10);
}

/** Transformación esperada, calculada de forma independiente en el test. */
function expectedVertices(problem: ReturnType<typeof generatePlaneTransform>): GridPoint[] {
  if (problem.transform === 'translation') {
    return problem.vertices.map((vertex) => ({
      x: vertex.x + (problem.translation?.x ?? 0),
      y: vertex.y + (problem.translation?.y ?? 0),
    }));
  }
  const line = problem.mirrorLine!;
  return problem.vertices.map((vertex) => ({
    x: line.axis === 'x' ? 2 * line.value - vertex.x : vertex.x,
    y: line.axis === 'y' ? 2 * line.value - vertex.y : vertex.y,
  }));
}

describe('generateCoordinateValue', () => {
  it('genera puntos en el primer cuadrante (0–10) con respuesta igual a la coordenada pedida', () => {
    for (let index = 0; index < 40; index += 1) {
      const problem = generateCoordinateValue();
      expect(problem.operation).toBe('coordinate-value');
      expect(problem.point.x).toBeGreaterThanOrEqual(0);
      expect(problem.point.x).toBeLessThanOrEqual(10);
      expect(problem.point.y).toBeGreaterThanOrEqual(0);
      expect(problem.point.y).toBeLessThanOrEqual(10);
      expect(Number.isInteger(problem.point.x)).toBe(true);
      expect(Number.isInteger(problem.point.y)).toBe(true);
      expect(problem.answer).toBe(problem.axis === 'x' ? problem.point.x : problem.point.y);
      expect(problem.explanation).not.toContain('¡');
      // La explicación sí puede revelar la solución, pero el enunciado no.
      expect(problem.prompt).not.toContain(String(problem.answer));
    }
  });

  it('valida la respuesta numérica con coma o punto y rechaza otras entradas', () => {
    const problem = generateCoordinateValue();
    expect(answersMatch(problem, String(problem.answer))).toBe(true);
    expect(answersMatch(problem, formatProblemAnswer(problem))).toBe(true);
    const decimal = problem.answer + 0.5;
    expect(answersMatch(problem, String(decimal).replace('.', ','))).toBe(false);
  });
});

describe('generatePlaneTransform', () => {
  it('mantiene original y opciones dentro de la cuadrícula 0–10', () => {
    for (let index = 0; index < 40; index += 1) {
      const problem = generatePlaneTransform();
      const all = [problem.vertices, ...problem.optionFigures];
      for (const figure of all) {
        for (const vertex of figure) {
          expect(vertex.x).toBeGreaterThanOrEqual(0);
          expect(vertex.x).toBeLessThanOrEqual(10);
          expect(vertex.y).toBeGreaterThanOrEqual(0);
          expect(vertex.y).toBeLessThanOrEqual(10);
          expect(Number.isInteger(vertex.x)).toBe(true);
          expect(Number.isInteger(vertex.y)).toBe(true);
        }
      }
    }
  });

  it('tiene exactamente una opción correcta y sin duplicados', () => {
    for (let index = 0; index < 40; index += 1) {
      const problem = generatePlaneTransform();
      expect(problem.options).toHaveLength(3);
      expect(problem.optionFigures).toHaveLength(3);
      const keys = problem.optionFigures.map((figure) => verticesKey(figure));
      expect(new Set(keys).size).toBe(3);
      const expected = verticesKey(expectedVertices(problem));
      expect(keys.filter((key) => key === expected)).toHaveLength(1);
      const correctIndex = problem.options.indexOf(problem.answer);
      expect(verticesKey(problem.optionFigures[correctIndex])).toBe(expected);
    }
  });

  it('usa reflejo sobre recta del primer cuadrante o traslación entera', () => {
    for (let index = 0; index < 40; index += 1) {
      const problem = generatePlaneTransform();
      if (problem.transform === 'translation') {
        expect(Number.isInteger(problem.translation?.x)).toBe(true);
        expect(Number.isInteger(problem.translation?.y)).toBe(true);
      } else {
        expect(problem.mirrorLine!.value).toBeGreaterThanOrEqual(0);
        expect(problem.mirrorLine!.value).toBeLessThanOrEqual(10);
      }
    }
  });

  it('valida la respuesta como opción tocada', () => {
    const problem = generatePlaneTransform();
    expect(answersMatch(problem, problem.answer)).toBe(true);
    const wrong = problem.options.find((label) => label !== problem.answer)!;
    expect(answersMatch(problem, wrong)).toBe(false);
  });

  it('cada figura de opción es un polígono completo dentro de la cuadrícula (caben sin salirse)', () => {
    for (let index = 0; index < 60; index += 1) {
      const problem = generatePlaneTransform();
      // Options y optionFigures siempre alineados: 3 letras, 3 figuras.
      expect(problem.options).toEqual(['A', 'B', 'C']);
      expect(problem.optionFigures).toHaveLength(problem.options.length);
      for (const figure of problem.optionFigures) {
        // Misma forma que la original (sin figuras degeneradas) y dentro de 0–10.
        expect(figure).toHaveLength(problem.vertices.length);
        expect(figureInBounds(figure)).toBe(true);
      }
      // La original también cabe.
      expect(figureInBounds(problem.vertices)).toBe(true);
    }
  });
});

describe('generateShapeClassification', () => {
  it('clasifica por lados con categorías excluyentes y una sola correcta', () => {
    for (let index = 0; index < 40; index += 1) {
      const problem = generateShapeClassification();
      expect(problem.operation).toBe('shape-classification');
      // El número de vértices distintos determina los lados.
      const keys = new Set(problem.vertices.map((vertex) => `${vertex.x},${vertex.y}`));
      const sides = keys.size;
      const NAMES: Record<number, string> = { 3: 'triángulo', 4: 'cuadrilátero', 5: 'pentágono', 6: 'hexágono' };
      expect(problem.answer).toBe(NAMES[sides]);
      expect(problem.options).toContain(problem.answer);
      expect(new Set(problem.options).size).toBe(problem.options.length);
      for (const vertex of problem.vertices) {
        expect(vertex.x).toBeGreaterThanOrEqual(0);
        expect(vertex.x).toBeLessThanOrEqual(10);
        expect(vertex.y).toBeGreaterThanOrEqual(0);
        expect(vertex.y).toBeLessThanOrEqual(10);
      }
      // Criterio explícito en el enunciado.
      expect(problem.prompt).toMatch(/lados/i);
    }
  });

  it('valida la respuesta como categoría tocada', () => {
    const problem = generateShapeClassification();
    expect(answersMatch(problem, problem.answer)).toBe(true);
    expect(problem.options.filter((option) => option !== problem.answer && answersMatch(problem, option))).toHaveLength(0);
  });
});
