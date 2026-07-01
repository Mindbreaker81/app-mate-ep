import type { CircleProblem, TriangleAngleProblem, VolumeProblem } from '../../types';
import { formatMathNumber, roundToPrecision } from '../mathUtils';
import { getPiValue, randomInt, resolveLevelLimits, type LevelConfig } from './shared';

export function generateCircleArea(levelConfig: LevelConfig): CircleProblem {
  const limits = resolveLevelLimits(levelConfig);
  const radius = randomInt(2, limits.maxCircleRadius);
  const piValue = getPiValue(levelConfig.id);
  const answer = roundToPrecision(piValue * radius * radius, 2);
  return {
    prompt: `Calcula el área de un círculo de radio ${radius} cm (usa π = ${piValue})`,
    radius,
    piValue,
    operation: 'circle-area',
    answer,
    explanation: `Paso 1: A = π × r² = ${piValue} × ${radius}².\nPaso 2: A = ${formatMathNumber(answer)} cm².`,
  };
}

export function generateCircleCircumference(levelConfig: LevelConfig): CircleProblem {
  const limits = resolveLevelLimits(levelConfig);
  const radius = randomInt(2, limits.maxCircleRadius);
  const piValue = getPiValue(levelConfig.id);
  const answer = roundToPrecision(2 * piValue * radius, 2);
  return {
    prompt: `Calcula la longitud de un círculo de radio ${radius} cm (usa π = ${piValue})`,
    radius,
    piValue,
    operation: 'circle-circumference',
    answer,
    explanation: `Paso 1: L = 2 × π × r = 2 × ${piValue} × ${radius}.\nPaso 2: L = ${formatMathNumber(answer)} cm.`,
  };
}

export function generateVolumeRectangularPrism(levelConfig: LevelConfig): VolumeProblem {
  const limits = resolveLevelLimits(levelConfig);
  const length = randomInt(2, Math.min(limits.maxGeometrySide, 12));
  const width = randomInt(2, Math.min(limits.maxGeometrySide, 10));
  const height = randomInt(2, Math.min(limits.maxGeometrySide, 8));
  const answer = length * width * height;
  return {
    prompt: `Calcula el volumen de un prisma de ${length} × ${width} × ${height} cm`,
    operation: 'volume-rectangular-prism',
    answer,
    explanation: `Paso 1: V = largo × ancho × alto.\nPaso 2: V = ${length} × ${width} × ${height} = ${answer} cm³.`,
  };
}

export function generateTriangleAngleSum(levelConfig: LevelConfig): TriangleAngleProblem {
  const maxAngle = Math.min(80, 40 + levelConfig.id * 4);
  const angle1 = randomInt(30, maxAngle);
  const angle2 = randomInt(30, maxAngle);
  const answer = 180 - angle1 - angle2;
  return {
    prompt: `En un triángulo, dos ángulos miden ${angle1}° y ${angle2}°. ¿Cuánto mide el tercero?`,
    operation: 'triangle-angle-sum',
    answer,
    explanation: `Paso 1: Los ángulos de un triángulo suman 180°.\nPaso 2: 180 - ${angle1} - ${angle2} = ${answer}°.`,
  };
}

export function generateGeometryAdvancedProblem(
  levelConfig: LevelConfig,
  operation: CircleProblem['operation'] | VolumeProblem['operation'] | TriangleAngleProblem['operation'],
) {
  switch (operation) {
    case 'circle-area':
      return generateCircleArea(levelConfig);
    case 'circle-circumference':
      return generateCircleCircumference(levelConfig);
    case 'volume-rectangular-prism':
      return generateVolumeRectangularPrism(levelConfig);
    case 'triangle-angle-sum':
      return generateTriangleAngleSum(levelConfig);
    default: {
      const exhaustive: never = operation;
      throw new Error(`Geometría avanzada no soportada: ${exhaustive}`);
    }
  }
}
