import type { AngleProblem, GeometryProblem } from '../../types';
import { pickRandom, randomInt, resolveLevelLimits, type LevelConfig } from './shared';

const ANGLE_TYPES = ['agudo', 'recto', 'obtuso'] as const;

export function generatePerimeterRectangle(levelConfig: LevelConfig): GeometryProblem {
  const limits = resolveLevelLimits(levelConfig);
  const width = randomInt(2, limits.maxGeometrySide);
  const height = randomInt(2, limits.maxGeometrySide);
  const answer = 2 * (width + height);
  return {
    prompt: `Calcula el perímetro de un rectángulo de ${width} cm × ${height} cm`,
    operation: 'perimeter-rectangle',
    answer,
    explanation: `Paso 1: P = 2 × (a + b).\nPaso 2: P = 2 × (${width} + ${height}) = ${answer} cm.`,
  };
}

export function generatePerimeterSquare(levelConfig: LevelConfig): GeometryProblem {
  const limits = resolveLevelLimits(levelConfig);
  const side = randomInt(2, limits.maxGeometrySide);
  const answer = 4 * side;
  return {
    prompt: `Calcula el perímetro de un cuadrado de lado ${side} cm`,
    operation: 'perimeter-square',
    answer,
    explanation: `Paso 1: P = 4 × lado.\nPaso 2: P = 4 × ${side} = ${answer} cm.`,
  };
}

export function generateAreaRectangle(levelConfig: LevelConfig): GeometryProblem {
  const limits = resolveLevelLimits(levelConfig);
  const width = randomInt(2, limits.maxGeometrySide);
  const height = randomInt(2, limits.maxGeometrySide);
  const answer = width * height;
  return {
    prompt: `Calcula el área de un rectángulo de ${width} cm × ${height} cm`,
    operation: 'area-rectangle',
    answer,
    explanation: `Paso 1: A = base × altura.\nPaso 2: A = ${width} × ${height} = ${answer} cm².`,
  };
}

export function generateAreaTriangle(levelConfig: LevelConfig): GeometryProblem {
  const limits = resolveLevelLimits(levelConfig);
  const base = randomInt(4, limits.maxGeometrySide);
  const height = randomInt(2, Math.max(2, Math.floor(limits.maxGeometrySide / 2)));
  const answer = (base * height) / 2;
  return {
    prompt: `Calcula el área de un triángulo con base ${base} cm y altura ${height} cm`,
    operation: 'area-triangle',
    answer,
    explanation: `Paso 1: A = (base × altura) ÷ 2.\nPaso 2: A = (${base} × ${height}) ÷ 2 = ${answer} cm².`,
  };
}

export function generateAngleType(_levelConfig: LevelConfig): AngleProblem {
  const template = randomInt(0, 2);
  let degrees: number;
  let answer: (typeof ANGLE_TYPES)[number];

  if (template === 0) {
    degrees = pickRandom([30, 45, 60, 75]);
    answer = 'agudo';
  } else if (template === 1) {
    degrees = 90;
    answer = 'recto';
  } else {
    degrees = pickRandom([100, 110, 120, 135]);
    answer = 'obtuso';
  }

  return {
    prompt: `¿Qué tipo de ángulo mide ${degrees}°?`,
    degrees,
    operation: 'angle-type',
    answer,
    options: [...ANGLE_TYPES],
    explanation:
      answer === 'agudo'
        ? 'Un ángulo agudo mide menos de 90°.'
        : answer === 'recto'
          ? 'Un ángulo recto mide exactamente 90°.'
          : 'Un ángulo obtuso mide más de 90° y menos de 180°.',
  };
}

export function generateGeometryProblem(levelConfig: LevelConfig): GeometryProblem | AngleProblem {
  const ops = [
    generatePerimeterRectangle,
    generatePerimeterSquare,
    generateAreaRectangle,
    generateAreaTriangle,
    generateAngleType,
  ];
  return ops[randomInt(0, ops.length - 1)](levelConfig);
}
