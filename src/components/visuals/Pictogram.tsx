import type { DataChartProblem } from '../../types';
import { VisualProblemFrame } from './VisualProblemFrame';
import { ChartDataTable } from './BarChart';

/**
 * Pictograma SVG accesible (PIT-17): filas de símbolos COMPLETOS (sin
 * medias figuras), siempre con leyenda explícita. Render determinista a
 * partir del payload.
 */

const ROW_HEIGHT = 56;
const WIDTH = 640;
const MARGIN = { top: 8, left: 140 };

/** Singular/plural del unit en la leyenda: «1 voto», «2 votos». */
function unitLabel(symbolValue: number, unit: string): string {
  return symbolValue === 1 ? unit.replace(/s$/, '') : unit;
}

export function Pictogram({ problem }: { problem: DataChartProblem }) {
  const height = MARGIN.top + problem.categories.length * ROW_HEIGHT + 16;
  const legendUnit = unitLabel(problem.symbolValue, problem.unit);

  return (
    <VisualProblemFrame
      title={problem.title}
      description={`Pictograma: cada ${problem.symbol} representa ${problem.symbolValue} ${legendUnit}.`}
      alternative={
        <>
          <p className="font-medium text-gray-700">
            1 {problem.symbol} = {problem.symbolValue} {legendUnit}
          </p>
          <ChartDataTable problem={problem} />
        </>
      }
      viewBox={`0 0 ${WIDTH} ${height}`}
      maxHeight={problem.categories.length * 52 + 40}
    >
      {problem.categories.map((category, index) => {
        const symbolCount = problem.values[index] / problem.symbolValue;
        const y = MARGIN.top + index * ROW_HEIGHT + ROW_HEIGHT / 2;
        return (
          <g key={category}>
            <text x={MARGIN.left - 12} y={y + 5} textAnchor="end" fontSize={15} fill="#374151">
              {category}
            </text>
            {Array.from({ length: symbolCount }, (_, symbolIndex) => (
              <text
                key={`${category}-${symbolIndex}`}
                data-visual-role="symbol"
                x={MARGIN.left + symbolIndex * 36}
                y={y + 8}
                fontSize={26}
              >
                {problem.symbol}
              </text>
            ))}
          </g>
        );
      })}
    </VisualProblemFrame>
  );
}
