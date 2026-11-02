import type { DataChartProblem } from '../../types';
import { VisualProblemFrame } from './VisualProblemFrame';

/**
 * Gráfico de barras SVG accesible (PIT-17). Escala lineal desde cero con
 * líneas de cuadrícula etiquetadas: el valor se lee contra el eje, las
 * barras NO muestran su número. Render determinista a partir del payload.
 */

const COLORS = ['#2563eb', '#16a34a', '#d97706', '#9333ea', '#dc2626'];
const WIDTH = 640;
const HEIGHT = 300;
const MARGIN = { top: 16, right: 16, bottom: 44, left: 44 };

function niceMax(maxValue: number): number {
  if (maxValue <= 4) {
    return 4;
  }
  if (maxValue <= 8) {
    return 8;
  }
  if (maxValue <= 10) {
    return 10;
  }
  return Math.ceil(maxValue / 4) * 4;
}

/** Filas «categoría: valor» compartidas por todos los gráficos como alternativa textual. */
export function ChartDataTable({ problem }: { problem: DataChartProblem }) {
  return (
    <table className="mx-auto text-sm border-collapse">
      <caption className="text-sm font-medium text-gray-600 text-center pb-1">
        Tabla de datos: {problem.title}.
      </caption>
      <tbody>
        {problem.categories.map((category, index) => (
          <tr key={category}>
            <th scope="row" className="pr-3 font-normal text-left">
              {category}
            </th>
            <td className="font-semibold">{problem.values[index]}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function BarChart({ problem }: { problem: DataChartProblem }) {
  const scaleMax = niceMax(Math.max(...problem.values));
  const plotWidth = WIDTH - MARGIN.left - MARGIN.right;
  const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
  // Eje de 2 en 2: frecuencias ≤ 12, así hay siempre 3–7 líneas de cuadrícula.
  const axisStep = 2;

  return (
    <VisualProblemFrame
      title={problem.title}
      description={`Gráfico de barras: frecuencia de cada categoría en ${problem.unit}.`}
      alternative={<ChartDataTable problem={problem} />}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      maxHeight={260}
    >
      {/* Líneas de cuadrícula horizontales con su valor en el eje. */}
      {Array.from({ length: scaleMax / axisStep + 1 }, (_, index) => {
        const value = index * axisStep;
        const y = MARGIN.top + plotHeight - (value / scaleMax) * plotHeight;
        return (
          <g key={`grid-${value}`}>
            <line x1={MARGIN.left} y1={y} x2={WIDTH - MARGIN.right} y2={y} stroke="#e5e7eb" strokeWidth={1} />
            <text x={MARGIN.left - 8} y={y + 4} textAnchor="end" fontSize={12} fill="#6b7280">
              {value}
            </text>
          </g>
        );
      })}
      {/* Barras: sin etiqueta de valor, se leen contra el eje. */}
      {problem.values.map((value, index) => {
        const barWidth = plotWidth / problem.categories.length;
        const barHeight = (value / scaleMax) * plotHeight;
        return (
          <g key={problem.categories[index]}>
            <rect
              data-visual-role="bar"
              x={MARGIN.left + index * barWidth + barWidth * 0.15}
              y={MARGIN.top + plotHeight - barHeight}
              width={barWidth * 0.7}
              height={barHeight}
              fill={COLORS[index % COLORS.length]}
              rx={4}
            />
            <text
              x={MARGIN.left + index * barWidth + barWidth / 2}
              y={MARGIN.top + plotHeight + 18}
              textAnchor="middle"
              fontSize={13}
              fill="#374151"
            >
              {problem.categories[index]}
            </text>
          </g>
        );
      })}
      {/* Ejes. */}
      <line x1={MARGIN.left} y1={MARGIN.top} x2={MARGIN.left} y2={MARGIN.top + plotHeight} stroke="#9ca3af" strokeWidth={1.5} />
      <line
        x1={MARGIN.left}
        y1={MARGIN.top + plotHeight}
        x2={WIDTH - MARGIN.right}
        y2={MARGIN.top + plotHeight}
        stroke="#9ca3af"
        strokeWidth={1.5}
      />
      <text x={MARGIN.left - 8} y={MARGIN.top - 4} textAnchor="end" fontSize={12} fill="#6b7280">
        {problem.unit}
      </text>
    </VisualProblemFrame>
  );
}
