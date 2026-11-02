import type { NumberLineProblem } from '../../types';
import { formatMathNumber } from '../mathUtils';
import { randomInt, type LevelConfig } from './shared';

/**
 * Recta numérica visual (PIT-15): lectura de la posición de un punto, sin
 * arrastre. Todos los valores se calculan con enteros escalados por 10^scale
 * para evitar errores de coma flotante; el punto NUNCA se etiqueta con su
 * valor (la solución no se lee directamente).
 */

export type NumberLineSpec = Pick<
  NumberLineProblem,
  'start' | 'step' | 'tickCount' | 'pointIndex' | 'scale'
>;

/** Valor de la marca `tickIndex`, calculado con enteros escalados. */
export function numberLineValueAt(spec: NumberLineSpec, tickIndex: number): number {
  const factor = 10 ** spec.scale;
  const value = Math.round(spec.start * factor) + tickIndex * Math.round(spec.step * factor);
  return value / factor;
}

/**
 * Etiqueta de cada marca; vacía en la del punto (no se revela la solución).
 * Las etiquetas se computan del payload, nunca al azar en el render.
 */
export function numberLineLabels(spec: NumberLineSpec): string[] {
  return Array.from({ length: spec.tickCount }, (_, tickIndex) =>
    tickIndex === spec.pointIndex ? '' : formatMathNumber(numberLineValueAt(spec, tickIndex)),
  );
}

/** Alternativa textual equivalente para lectores de pantalla, sin el resultado. */
export function numberLineAltText(spec: NumberLineSpec): string {
  const position = spec.pointIndex + 1;
  return (
    `Recta numérica de ${formatMathNumber(numberLineValueAt(spec, 0))} a ` +
    `${formatMathNumber(numberLineValueAt(spec, spec.tickCount - 1))}, con marcas cada ` +
    `${formatMathNumber(spec.step)}. El punto está en la ${position}.ª marca de ${spec.tickCount} ` +
    `(contando desde la primera).`
  );
}

/** Genera un problema de recta numérica con decimales (décimas o centésimas). */
export function generateNumberLineDecimal(levelConfig: LevelConfig): NumberLineProblem {
  // Centésimas solo si el nivel ya trabaja con 2 decimales.
  const scale = levelConfig.maxDecimalPlaces >= 2 && randomInt(0, 1) === 0 ? 2 : 1;
  const tickCount = randomInt(6, 10);
  const pointIndex = randomInt(1, tickCount - 2);
  const step = 10 ** -scale;
  const answer = numberLineValueAt({ start: 0, step, tickCount, pointIndex, scale }, pointIndex);
  return {
    prompt: '¿Qué número está marcado con el punto en la recta?',
    operation: 'number-line-decimal',
    start: 0,
    step,
    tickCount,
    pointIndex,
    scale,
    answer,
    explanation: `El punto está ${pointIndex} marcas después del 0 y cada marca vale ${formatMathNumber(step)}: ${pointIndex} × ${formatMathNumber(step)} = ${formatMathNumber(answer)}.`,
  };
}

/** Genera un problema de recta numérica con enteros (incluye negativos, 6.º). */
export function generateNumberLineInteger(levelConfig: LevelConfig): NumberLineProblem {
  const tickCount = randomInt(8, 10);
  // Rango de enteros que crece con el nivel (siempre cruza el 0).
  const start = randomInt(-(4 + 2 * levelConfig.id), levelConfig.id + 2);
  const pointIndex = randomInt(1, tickCount - 2);
  const answer = numberLineValueAt({ start, step: 1, tickCount, pointIndex, scale: 0 }, pointIndex);
  return {
    prompt: '¿Qué número está marcado con el punto en la recta?',
    operation: 'number-line-integer',
    start,
    step: 1,
    tickCount,
    pointIndex,
    scale: 0,
    answer,
    explanation: `El punto está ${pointIndex} marcas después de ${start}: ${start} + ${pointIndex} × 1 = ${answer}.`,
  };
}
