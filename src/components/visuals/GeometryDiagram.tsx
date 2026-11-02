import type { CoordinateValueProblem, GridPoint, PlaneTransformProblem, ShapeClassificationProblem } from '../../types';
import { CoordinateGrid, MiniGrid, gridToSvg } from './CoordinateGrid';

/**
 * Diagramas de geometría visual (PIT-16): punto para leer coordenadas,
 * figuras de transformación (original marcada en la cuadrícula y cada opción
 * en su MINI-CUADRÍCULA separada A/B/C, sin solapes) y polígono a
 * clasificar. Todo se dibuja del payload; las alternativas textuales
 * equivalen al dibujo sin revelar la respuesta.
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
  strokeWidth = 2,
}: {
  vertices: GridPoint[];
  color?: string;
  opacity?: number;
  strokeWidth?: number;
}) {
  return (
    <polygon
      data-visual-role="shape"
      points={polygonPoints(vertices)}
      fill={color}
      fillOpacity={opacity * 0.25}
      stroke={color}
      strokeWidth={strokeWidth}
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

/**
 * Original marcada en la cuadrícula (etiqueta «Original», trazo grueso
 * distinto) y las tres opciones, cada una en su mini-cuadrícula con la letra
 * DENTRO: nada de figuras superpuestas ni letras fuera de la cuadrícula.
 */
function TransformDiagram({ problem }: { problem: PlaneTransformProblem }) {
  const lineStart = problem.mirrorLine
    ? gridToSvg(problem.mirrorLine.axis === 'x' ? { x: problem.mirrorLine.value, y: 0 } : { x: 0, y: problem.mirrorLine.value })
    : null;
  const lineEnd = problem.mirrorLine
    ? gridToSvg(problem.mirrorLine.axis === 'x' ? { x: problem.mirrorLine.value, y: 10 } : { x: 10, y: problem.mirrorLine.value })
    : null;
  const originalAnchor = gridToSvg(problem.vertices[0]);
  const letterPosition = gridToSvg({ x: 0, y: 10 });

  return (
    <div className="space-y-3">
      <CoordinateGrid
        description={`Transformación en la cuadrícula: ${problem.prompt}`}
        alternative={
          <div className="text-left mx-auto max-w-md">
            <p>
              Figura original (marcada como «Original»): vértices {pointsText(problem.vertices)}
              {problem.mirrorLine
                ? `. Recta de simetría: ${problem.mirrorLine.axis === 'x' ? 'x' : 'y'} = ${problem.mirrorLine.value}.`
                : `. Traslación: ${problem.translation?.x ?? 0} casillas en horizontal y ${problem.translation?.y ?? 0} en vertical.`}
            </p>
            {problem.options.map((label, index) => (
              <p key={label}>
                Opción {label} (mini-cuadrícula {label}): vértices {pointsText(problem.optionFigures[index])}.
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
        <ShapePolygon vertices={problem.vertices} color="#1e3a5f" strokeWidth={3.5} />
        <text x={originalAnchor.x - 14} y={originalAnchor.y - 10} fontSize={15} fontWeight={700} fill="#1e3a5f" textAnchor="end">
          Original
        </text>
      </CoordinateGrid>
      <div className="grid grid-cols-3 gap-2 w-full max-w-md mx-auto">
        {problem.options.map((label, index) => (
          <MiniGrid key={label} label={`Opción ${label}`}>
            <ShapePolygon
              vertices={problem.optionFigures[index]}
              color={OPTION_COLORS[index % OPTION_COLORS.length]}
              strokeWidth={2.5}
            />
            <text x={letterPosition.x + 8} y={letterPosition.y + 26} fontSize={22} fontWeight={700} fill="#374151">
              {label}
            </text>
          </MiniGrid>
        ))}
      </div>
    </div>
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
