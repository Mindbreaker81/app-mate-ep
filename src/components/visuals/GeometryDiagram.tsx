import type { CoordinateValueProblem, GridPoint, PlaneTransformProblem, ShapeClassificationProblem } from '../../types';
import { CoordinateGrid, gridToSvg } from './CoordinateGrid';

/**
 * Diagramas de geometría visual (PIT-16): punto para leer coordenadas,
 * figuras de transformación (original + opciones A/B/C y recta de simetría)
 * y polígono a clasificar. Todo se dibuja del payload; las alternativas
 * textuales equivalen al dibujo sin revelar la respuesta.
 */

const OPTION_COLORS = ['#2563eb', '#16a34a', '#d97706'];

function pointsText(vertices: GridPoint[]): string {
  return vertices.map((vertex) => `(${vertex.x}, ${vertex.y})`).join(', ');
}

function polygonPoints(vertices: GridPoint[]): string {
  return vertices.map((vertex) => gridToSvg(vertex)).map((point) => `${point.x},${point.y}`).join(' ');
}

function ShapePolygon({
  vertices,
  color = '#9333ea',
  opacity = 1,
}: {
  vertices: GridPoint[];
  color?: string;
  opacity?: number;
}) {
  return (
    <polygon
      data-visual-role="shape"
      points={polygonPoints(vertices)}
      fill={color}
      fillOpacity={opacity * 0.25}
      stroke={color}
      strokeWidth={2}
    />
  );
}

/** Punto etiquetado sin escribir su coordenada (se lee contra los ejes). */
function CoordinatePoint({ problem }: { problem: CoordinateValueProblem }) {
  const point = gridToSvg(problem.point);
  return (
    <g>
      <circle cx={point.x} cy={point.y} r={7} fill="#dc2626" data-visual-role="point" />
      <text x={point.x + 12} y={point.y - 10} fontSize={16} fill="#374151">
        {problem.pointLabel}
      </text>
    </g>
  );
}

/** Original (línea continua), recta de simetría (discontinua) y opciones con letra. */
function TransformDiagram({ problem }: { problem: PlaneTransformProblem }) {
  const lineStart = problem.mirrorLine
    ? gridToSvg(problem.mirrorLine.axis === 'x' ? { x: problem.mirrorLine.value, y: 0 } : { x: 0, y: problem.mirrorLine.value })
    : null;
  const lineEnd = problem.mirrorLine
    ? gridToSvg(problem.mirrorLine.axis === 'x' ? { x: problem.mirrorLine.value, y: 10 } : { x: 10, y: problem.mirrorLine.value })
    : null;

  return (
    <CoordinateGrid
      description={`Transformación en la cuadrícula: ${problem.prompt}`}
      alternative={
        <div className="text-left mx-auto max-w-md">
          <p>
            Figura original: vértices {pointsText(problem.vertices)}
            {problem.mirrorLine
              ? `. Recta de simetría: ${problem.mirrorLine.axis === 'x' ? 'x' : 'y'} = ${problem.mirrorLine.value}.`
              : `. Traslación: ${problem.translation?.x ?? 0} casillas en horizontal y ${problem.translation?.y ?? 0} en vertical.`}
          </p>
          {problem.options.map((label, index) => (
            <p key={label}>
              Opción {label}: vértices {pointsText(problem.optionFigures[index])}.
            </p>
          ))}
        </div>
      }
    >
      {problem.mirrorLine && lineStart && lineEnd && (
        <line
          x1={lineStart.x}
          y1={lineStart.y}
          x2={lineEnd.x}
          y2={lineEnd.y}
          stroke="#6b7280"
          strokeWidth={2}
          strokeDasharray="6 4"
          data-visual-role="mirror"
        />
      )}
      <ShapePolygon vertices={problem.vertices} />
      {problem.optionFigures.map((figure, index) => {
        const label = problem.options[index];
        const anchor = figure[0];
        const position = gridToSvg(anchor);
        return (
          <g key={label}>
            <ShapePolygon vertices={figure} color={OPTION_COLORS[index % OPTION_COLORS.length]} opacity={0.7} />
            <text x={position.x + 14} y={position.y - 10} fontSize={15} fontWeight={600} fill="#374151">
              {label}
            </text>
          </g>
        );
      })}
    </CoordinateGrid>
  );
}

/** Polígono a clasificar; la alternativa no cuenta los lados (esa es la tarea). */
function ClassificationDiagram({ problem }: { problem: ShapeClassificationProblem }) {
  return (
    <CoordinateGrid
      description="Figura en la cuadrícula para clasificar por sus lados."
      alternative={
        <p>
          Figura cerrada dibujada en la cuadrícula. Recorre su borde y cuenta los lados para clasificarla.
        </p>
      }
    >
      <ShapePolygon vertices={problem.vertices} />
    </CoordinateGrid>
  );
}

export function GeometryDiagram({ problem }: { problem: PlaneTransformProblem | ShapeClassificationProblem }) {
  return problem.operation === 'plane-transform' ? (
    <TransformDiagram problem={problem} />
  ) : (
    <ClassificationDiagram problem={problem} />
  );
}

export { CoordinatePoint };
