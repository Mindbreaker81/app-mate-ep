import type { WeeklyBucket } from '../../utils/weeklyTrend';

function formatWeekLabel(weekStart: string): string {
  const [year, month, day] = weekStart.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

/**
 * Barras de precisión semanal. Una sola serie: un solo azul (gris = sin datos),
 * con el % visible en tinta y tooltip nativo por barra.
 */
export function ChildTrendView({ trend }: { trend: WeeklyBucket[] }) {
  if (trend.every((bucket) => bucket.total === 0)) {
    return null;
  }

  const summary = trend
    .filter((bucket) => bucket.accuracy !== null)
    .map((bucket) => `semana del ${formatWeekLabel(bucket.weekStart)}: ${bucket.accuracy} %`)
    .join(', ');

  return (
    <section className="bg-white rounded-lg shadow p-4 space-y-3">
      <h3 className="text-xl font-semibold text-gray-700">📈 Evolución (últimas {trend.length} semanas)</h3>
      <div
        role="img"
        aria-label={`Precisión por semana: ${summary}`}
        className="flex items-end gap-2 h-36"
      >
        {trend.map((bucket) => {
          const label = formatWeekLabel(bucket.weekStart);
          const hasData = bucket.accuracy !== null;
          const title = hasData
            ? `Semana del ${label}: ${bucket.accuracy} % (${bucket.total} intentos)`
            : `Semana del ${label}: sin intentos`;
          return (
            <div
              key={bucket.weekStart}
              data-week={bucket.weekStart}
              title={title}
              className="flex-1 flex flex-col items-center justify-end gap-1 h-full min-w-0"
            >
              {hasData && <span className="text-xs font-semibold text-gray-700">{bucket.accuracy}%</span>}
              <div
                className={`w-full max-w-8 rounded-t ${hasData ? 'bg-blue-500' : 'bg-gray-200'}`}
                style={{ height: hasData ? `${Math.max(4, bucket.accuracy!)}%` : '4px' }}
              />
              <span className="text-[10px] text-gray-500 whitespace-nowrap">{label}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
