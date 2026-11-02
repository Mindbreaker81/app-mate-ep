import type { ReactNode } from 'react';
import { VisualProblemFrame } from './VisualProblemFrame';

/**
 * Cuadrícula de coordenadas del primer cuadrante, 0–10 (PIT-16). SVG directo
 * sobre el marco accesible reutilizable; los ejes llevan TODOS los números y
 * el contenido (puntos, figuras) va como children SIN escribir sus valores.
 */

const UNIT = 40;
const MARGIN = 36;
const SIZE = UNIT * 10;
const WIDTH = SIZE + 2 * MARGIN + 16;
const HEIGHT = SIZE + 2 * MARGIN;

/** Convierte coordenadas del plano (0–10) a píxeles del SVG (y invertida). */
export function gridToSvg(point: { x: number; y: number }): { x: number; y: number } {
  return { x: MARGIN + point.x * UNIT, y: MARGIN + SIZE - point.y * UNIT };
}

export function CoordinateGrid({
  description,
  alternative,
  children,
}: {
  description: string;
  alternative: ReactNode;
  children: ReactNode;
}) {
  const gridLines = Array.from({ length: 11 }, (_, index) => index);

  return (
    <VisualProblemFrame
      title="Cuadrícula de coordenadas"
      description={description}
      alternative={alternative}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      maxHeight={380}
    >
      {/* Líneas de la cuadrícula. */}
      {gridLines.map((index) => {
        const vertical = gridToSvg({ x: index, y: 0 });
        const horizontal = gridToSvg({ x: 0, y: index });
        return (
          <g key={`grid-${index}`}>
            <line x1={vertical.x} y1={MARGIN} x2={vertical.x} y2={MARGIN + SIZE} stroke="#e5e7eb" strokeWidth={1} />
            <line x1={MARGIN} y1={horizontal.y} x2={MARGIN + SIZE} y2={horizontal.y} stroke="#e5e7eb" strokeWidth={1} />
          </g>
        );
      })}
      {/* Ejes con todos los números visibles. */}
      {gridLines.map((index) => {
        const xTick = gridToSvg({ x: index, y: 0 });
        const yTick = gridToSvg({ x: 0, y: index });
        return (
          <g key={`axis-${index}`} fontSize={12} fill="#6b7280">
            <text x={xTick.x} y={MARGIN + SIZE + 20} textAnchor="middle">
              {index}
            </text>
            <text x={MARGIN - 10} y={yTick.y + 4} textAnchor="end">
              {index}
            </text>
          </g>
        );
      })}
      <line x1={MARGIN - 8} y1={MARGIN + SIZE} x2={MARGIN + SIZE + 8} y2={MARGIN + SIZE} stroke="#9ca3af" strokeWidth={1.5} />
      <line x1={MARGIN} y1={MARGIN + SIZE + 8} x2={MARGIN} y2={MARGIN - 8} stroke="#9ca3af" strokeWidth={1.5} />
      <text x={MARGIN + SIZE + 8} y={MARGIN + SIZE - 8} fontSize={14} fill="#374151">
        x
      </text>
      <text x={MARGIN + 8} y={MARGIN - 8} fontSize={14} fill="#374151">
        y
      </text>
      {children}
    </VisualProblemFrame>
  );
}
