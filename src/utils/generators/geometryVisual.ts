import type { CoordinateValueProblem, GridPoint, PlaneTransformProblem, ShapeClassificationProblem } from '../../types';
import { randomInt, shuffle } from './shared';

/**
 * Geometría visual (PIT-16): coordenadas en el primer cuadrante, simetrías
 * sobre rectas verticales/horizontales del primer cuadrante, traslaciones
 * enteras y clasificación de figuras por número de lados. Cuadrícula 0–10,
 * vértices enteros, sin rotaciones ni cuatro cuadrantes. Todo el render es
 * determinista a partir del payload; la alternativa textual no revela la
 * respuesta.
 */

const SIDE_NAMES: Record<number, string> = {
  3: 'triángulo',
  4: 'cuadrilátero',
  5: 'pentágono',
  6: 'hexágono',
};

type Figure = GridPoint[];

function inBounds(point: GridPoint): boolean {
  return point.x >= 0 && point.x <= 10 && point.y >= 0 && point.y <= 10;
}

function figureInBounds(figure: Figure): boolean {
  return figure.every(inBounds);
}

function sameFigure(a: Figure, b: Figure): boolean {
  return a.length === b.length && a.every((vertex, index) => vertex.x === b[index].x && vertex.y === b[index].y);
}

/** Figura base: triángulo rectángulo o rectángulo de vértices enteros pequeños. */
function generateBaseShape(): Figure {
  const x = randomInt(1, 3);
  const y = randomInt(1, 3);
  if (Math.random() < 0.5) {
    const width = randomInt(2, 3);
    const height = randomInt(2, 3);
    return [
      { x, y },
      { x: x + width, y },
      { x: x + width, y: y + height },
      { x, y: y + height },
    ];
  }
  return [
    { x, y },
    { x: x + randomInt(2, 3), y },
    { x, y: y + randomInt(2, 3) },
  ];
}

/** Coordenadas: punto entero del primer cuadrante y pregunta de x o y. */
export function generateCoordinateValue(): CoordinateValueProblem {
  const axis: 'x' | 'y' = Math.random() < 0.5 ? 'x' : 'y';
  const point: GridPoint = { x: randomInt(0, 10), y: randomInt(0, 10) };
  const answer = axis === 'x' ? point.x : point.y;
  return {
    prompt: `¿Qué valor tiene la coordenada ${axis} del punto P?`,
    operation: 'coordinate-value',
    point,
    pointLabel: 'P',
    axis,
    answer,
    explanation:
      axis === 'x'
        ? `La coordenada x se lee avanzando en horizontal desde el eje vertical: ${point.x} casillas.`
        : `La coordenada y se lee subiendo en vertical desde el eje horizontal: ${point.y} casillas.`,
  };
}

/** Genera dos distractores válidos (dentro de la cuadrícula y distintos entre sí y de la correcta). */
function generateDistractors(transform: PlaneTransformProblem['transform'], correct: Figure): Figure[] {
  const distractors: Figure[] = [];
  const candidates: Figure[] = [];
  if (transform === 'translation') {
    // Traslaciones «casi» iguales: uno o dos pasos de diferencia en cada eje.
    for (const [dx, dy] of [
      [1, 0],
      [0, 1],
      [-1, 0],
      [0, -1],
      [1, 1],
      [-1, -1],
      [2, 0],
      [0, 2],
      [-2, 0],
      [0, -2],
      [2, -2],
      [-2, 2],
    ] as const) {
      candidates.push(correct.map((vertex) => ({ x: vertex.x + dx, y: vertex.y + dy })));
    }
  } else {
    // Simetría con la recta desplazada (el reflejo «casi» correcto).
    for (const offset of [-1, 1, -2, 2, -3, 3, -4, 4]) {
      candidates.push(
        correct.map((vertex) => ({
          x: vertex.x + 2 * offset,
          y: vertex.y,
        })),
      );
    }
  }
  for (const candidate of candidates) {
    if (!figureInBounds(candidate)) {
      continue;
    }
    if (sameFigure(candidate, correct)) {
      continue;
    }
    if (distractors.some((distractor) => sameFigure(distractor, candidate))) {
      continue;
    }
    distractors.push(candidate);
    if (distractors.length === 2) {
      break;
    }
  }
  return distractors;
}

/** Simetría (recta vertical u horizontal) o traslación entera sobre una figura de la cuadrícula. */
export function generatePlaneTransform(): PlaneTransformProblem {
  const kind = randomInt(0, 2);
  const vertices = generateBaseShape();

  if (kind === 2) {
    // Traslación entera que mantiene la figura en la cuadrícula.
    const minX = Math.min(...vertices.map((vertex) => vertex.x));
    const maxX = Math.max(...vertices.map((vertex) => vertex.x));
    const minY = Math.min(...vertices.map((vertex) => vertex.y));
    const maxY = Math.max(...vertices.map((vertex) => vertex.y));
    const dx = randomInt(-minX, 10 - maxX);
    const dy = randomInt(-minY, 10 - maxY);
    const translation = { x: dx, y: dy };
    const correct = vertices.map((vertex) => ({ x: vertex.x + dx, y: vertex.y + dy }));
    const problem: PlaneTransformProblem = {
      prompt: 'Elige la figura que resulta de trasladar la original.',
      operation: 'plane-transform',
      transform: 'translation',
      vertices,
      translation,
      options: [],
      optionFigures: [],
      answer: '',
      explanation: `Cada vértice se desplaza ${dx} casilla(s) en horizontal y ${dy} en vertical.`,
    };
    const distractors = generateDistractors('translation', correct);
    return withTransformOptions(problem, correct, distractors);
  }

  const axis: 'x' | 'y' = kind === 0 ? 'x' : 'y';
  // Recta de simetría a la derecha/encima de la figura y reflejo dentro de la
  // cuadrícula: se reintenta con otras figuras hasta que ambas lo cumplen.
  let correct: Figure = [];
  let lineValue = 0;
  for (let attempt = 0; attempt < 50 && correct.length === 0; attempt += 1) {
    const candidate = generateBaseShape();
    const relevant = (axis === 'x' ? candidate.map((vertex) => vertex.x) : candidate.map((vertex) => vertex.y));
    const max = Math.max(...relevant);
    lineValue = randomInt(max + 1, 9);
    const reflected = candidate.map((vertex) =>
      axis === 'x' ? { x: 2 * lineValue - vertex.x, y: vertex.y } : { x: vertex.x, y: 2 * lineValue - vertex.y },
    );
    if (figureInBounds(reflected)) {
      correct = reflected;
      vertices.length = 0;
      vertices.push(...candidate);
    }
  }
  const mirrorLine = { axis, value: lineValue };
  const problem: PlaneTransformProblem = {
    prompt: `Elige la figura que resulta de reflejar la original sobre la recta ${axis === 'x' ? 'vertical' : 'horizontal'}.`,
    operation: 'plane-transform',
    transform: axis === 'x' ? 'reflection-vertical' : 'reflection-horizontal',
    vertices,
    mirrorLine,
    options: [],
    optionFigures: [],
    answer: '',
    explanation: `Cada vértice salta al otro lado de la recta ${axis === 'x' ? `x = ${lineValue}` : `y = ${lineValue}`}, a la misma distancia.`,
  };
  const distractors = generateDistractors(problem.transform, correct);
  return withTransformOptions(problem, correct, distractors);
}

/** Etiqueta A/B/C las figuras barajadas y fija la correcta. */
function withTransformOptions(
  problem: PlaneTransformProblem,
  correct: Figure,
  distractors: Figure[],
): PlaneTransformProblem {
  const labels = ['A', 'B', 'C'];
  const shuffled = shuffle([correct, ...distractors].map((figure) => [...figure]));
  const correctIndex = shuffled.findIndex((figure) => sameFigure(figure, correct));
  return { ...problem, options: labels, optionFigures: shuffled, answer: labels[correctIndex] };
}

/** Polígono irregular de n vértices enteros distintos dentro de 1–9. */
function generatePolygon(sides: number): Figure {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const startAngle = randomInt(0, 11) * (Math.PI / 6);
    const vertices: Figure = [];
    for (let index = 0; index < sides; index += 1) {
      const angle = startAngle + (index * 2 * Math.PI) / sides;
      const radius = randomInt(2, 4);
      vertices.push({
        x: Math.min(9, Math.max(1, Math.round(5 + radius * Math.cos(angle)))),
        y: Math.min(9, Math.max(1, Math.round(5 + radius * Math.sin(angle)))),
      });
    }
    const unique = new Set(vertices.map((vertex) => `${vertex.x},${vertex.y}`));
    if (unique.size === sides) {
      return vertices;
    }
  }
  // Fallback determinista: polígono regular «de la cuadrícula».
  const fallbacks: Record<number, Figure> = {
    3: [
      { x: 2, y: 2 },
      { x: 7, y: 2 },
      { x: 4, y: 7 },
    ],
    4: [
      { x: 2, y: 3 },
      { x: 7, y: 2 },
      { x: 8, y: 7 },
      { x: 3, y: 8 },
    ],
    5: [
      { x: 3, y: 1 },
      { x: 8, y: 3 },
      { x: 7, y: 8 },
      { x: 3, y: 9 },
      { x: 1, y: 4 },
    ],
    6: [
      { x: 2, y: 2 },
      { x: 7, y: 1 },
      { x: 9, y: 5 },
      { x: 7, y: 9 },
      { x: 2, y: 8 },
      { x: 1, y: 5 },
    ],
  };
  return fallbacks[sides];
}

/** Clasificación por número de lados, con categorías excluyentes. */
export function generateShapeClassification(): ShapeClassificationProblem {
  const sides = randomInt(3, 6);
  const vertices = generatePolygon(sides);
  const answer = SIDE_NAMES[sides];
  const otherNames = Object.values(SIDE_NAMES).filter((name) => name !== answer);
  return {
    prompt: '¿Cómo se clasifica esta figura por su número de lados?',
    operation: 'shape-classification',
    vertices,
    options: shuffle([answer, ...otherNames]),
    answer,
    explanation: `La figura tiene ${sides} lados, así que es un ${answer}.`,
  };
}
