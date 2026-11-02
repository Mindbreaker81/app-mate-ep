import { numberLineAltText, numberLineLabels, numberLineValueAt } from '../../utils/generators/numberLine';
import type { NumberLineProblem } from '../../types';
import { VisualProblemFrame } from './VisualProblemFrame';

/**
 * Recta numérica de lectura de puntos (PIT-15): marcas explícitas con su
 * valor salvo la del punto, que solo se dibuja como punto. Todo se calcula
 * del payload del problema (nada de azar en el render) y la alternativa
 * textual no revela la solución.
 */
export function NumberLine({ problem }: { problem: NumberLineProblem }) {
  const width = 640;
  const margin = 40;
  const lineY = 64;
  const spacing = (width - 2 * margin) / (problem.tickCount - 1);

  const tickX = (tickIndex: number) => margin + tickIndex * spacing;
  const labels = numberLineLabels(problem);
  const description =
    `Recta de ${numberLineValueAt(problem, 0)} a ` +
    `${numberLineValueAt(problem, problem.tickCount - 1)} con ${problem.tickCount} marcas`;

  return (
    <VisualProblemFrame
      title="Recta numérica"
      description={description}
      alternative={numberLineAltText(problem)}
    >
      <line
        x1={margin - 12}
        y1={lineY}
        x2={width - margin + 12}
        y2={lineY}
        stroke="#1e3a5f"
        strokeWidth={2}
        data-visual-role="axis"
      />
      {labels.map((label, tickIndex) => (
        <g key={tickIndex}>
          <line
            x1={tickX(tickIndex)}
            y1={lineY - 8}
            x2={tickX(tickIndex)}
            y2={lineY + 8}
            stroke="#1e3a5f"
            strokeWidth={2}
          />
          {label !== '' && (
            <text
              x={tickX(tickIndex)}
              y={lineY + 32}
              textAnchor="middle"
              fontSize={16}
              fill="#1e3a5f"
            >
              {label}
            </text>
          )}
        </g>
      ))}
      <circle
        cx={tickX(problem.pointIndex)}
        cy={lineY}
        r={8}
        fill="#2563eb"
        data-visual-role="point"
      />
    </VisualProblemFrame>
  );
}
