import type { AttemptRecord } from '../../services/adminService';
import type { SkillProgress } from '../../types';
import { SKILL_AREAS, TIER_LABELS, getSkillById } from '../../utils/skillCatalog';
import {
  ATTEMPT_SOURCE_LABELS,
  MASTERY_STATUS_LABELS,
  buildSkillMastery,
  buildWeeklySummary,
  pendingReviews,
  type MasteryStatus,
  type WeeklySummary,
} from '../../utils/skillReport';
import { contentStageLabel } from '../../utils/contentStage';

const STATUS_STYLES: Record<MasteryStatus, string> = {
  locked: 'bg-gray-100 text-gray-500',
  'not-started': 'bg-slate-50 text-slate-500',
  practicing: 'bg-blue-50 text-blue-800',
  dominated: 'bg-green-50 text-green-800',
  review: 'bg-amber-50 text-amber-800',
};

function formatDay(dayKey: string): string {
  const [year, month, day] = dayKey.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
  });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function WeeklySummaryCard({ summary }: { summary: WeeklySummary }) {
  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-3">
      <h4 className="font-semibold text-gray-800">
        📅 Esta semana <span className="text-sm font-normal text-gray-500">(desde el {formatDay(summary.weekStart)})</span>
      </h4>
      {summary.total === 0 ? (
        <p className="text-sm text-gray-500">Esta semana todavía no ha hecho ejercicios.</p>
      ) : (
        <>
          <p className="text-sm text-gray-600">
            {summary.total} {summary.total === 1 ? 'intento' : 'intentos'} · {summary.accuracy}% de aciertos
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <h5 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Procedencia</h5>
              <ul className="mt-1 space-y-1 text-sm text-gray-700">
                {summary.bySource.map((row) => (
                  <li key={row.source} className="flex justify-between gap-2">
                    <span>{ATTEMPT_SOURCE_LABELS[row.source]}</span>
                    <span className="text-gray-500">
                      {row.total} · {Math.round((row.correct / row.total) * 100)}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h5 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Tramo del contenido</h5>
              <ul className="mt-1 space-y-1 text-sm text-gray-700">
                {summary.byStage.map((row) => (
                  <li key={row.stage ?? 'sin-clasificar'} className="flex justify-between gap-2">
                    <span>{contentStageLabel(row.stage)}</span>
                    <span className="text-gray-500">
                      {row.total} · {Math.round((row.correct / row.total) * 100)}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export interface SkillMasteryViewProps {
  /** Progreso persistido del niño (game_state.data.skills). */
  skills: Record<string, SkillProgress>;
  /** Marca temporal de la fila game_state (null si aún no existe). */
  updatedAt: string | null;
  /** Intentos del niño (null si no se pudieron cargar). */
  attempts: AttemptRecord[] | null;
  /** «Hoy» inyectable para que los tests sean deterministas. */
  now?: Date;
}

/**
 * Vista familiar de solo lectura (PIT-30): dominio real por habilidad con el
 * mismo motor que «Mi camino», repasos pendientes y resumen de la semana.
 * No infiere dominio desde porcentajes ni diagnostica tipos de error.
 */
export function SkillMasteryView({ skills, updatedAt, attempts, now }: SkillMasteryViewProps) {
  const today = now ?? new Date();
  const mastery = buildSkillMastery(skills, today);
  const reviews = pendingReviews(mastery);
  const weekly = attempts === null ? null : buildWeeklySummary(attempts, today);
  const hasProgress = Object.keys(skills).length > 0;
  const areas = Object.values(SKILL_AREAS);

  return (
    <section className="space-y-4" aria-label="Dominio por habilidad y resumen semanal">
      {weekly !== null && <WeeklySummaryCard summary={weekly} />}
      {weekly === null && (
        <div className="bg-white rounded-lg shadow p-4">
          <h4 className="font-semibold text-gray-800">📅 Esta semana</h4>
          <p className="text-sm text-gray-500">No pudimos cargar los intentos de esta semana.</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-4 space-y-2">
        <h4 className="font-semibold text-gray-800">🔁 Repasos pendientes</h4>
        {reviews.length === 0 ? (
          <p className="text-sm text-gray-500">
            Ninguno ahora mismo: los repasos de las habilidades dominadas están al día.
          </p>
        ) : (
          <ul className="space-y-1 text-sm text-gray-700">
            {reviews.map((row) => (
              <li key={row.skillId} className="flex flex-wrap items-baseline gap-x-2">
                <span className="font-medium">
                  {row.icon} {row.name}
                </span>
                <span className="text-amber-700">
                  le toca repasar{row.reviewDueDate ? ` desde el ${formatDay(row.reviewDueDate)}` : ''}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <div>
          <h4 className="font-semibold text-gray-800">🎯 Dominio por habilidad</h4>
          {updatedAt && (
            <p className="text-xs text-gray-400">Progreso guardado el {formatDate(updatedAt)}.</p>
          )}
          {!hasProgress && (
            <p className="mt-1 text-sm text-gray-500">
              Todavía no hay progreso guardado en «Mi camino»: las habilidades figuran como
              «Sin empezar» o «Bloqueada», no como fallo.
            </p>
          )}
        </div>

        {areas.map((area) => {
          const rows = mastery.filter((row) => row.areaId === area.id);
          if (rows.length === 0) {
            return null;
          }
          return (
            <div key={area.id}>
              <h5 className="text-sm font-semibold text-gray-600 mb-2">
                {area.icon} {area.name}
              </h5>
              <ul className="divide-y divide-gray-100">
                {rows.map((row) => (
                  <li key={row.skillId} className="py-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-medium text-gray-700">
                      {row.icon} {row.name}
                    </span>
                    <span className="text-xs text-gray-400">{TIER_LABELS[row.tier]}</span>
                    <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded ${STATUS_STYLES[row.status]}`}>
                      {MASTERY_STATUS_LABELS[row.status]}
                    </span>
                    <span className="w-full text-xs text-gray-500">
                      {row.status === 'locked' &&
                        `Se desbloquea al dominar: ${row.missingPrerequisites
                          .map((id) => getSkillById(id)?.name ?? id)
                          .join(', ')}.`}
                      {row.status === 'not-started' && 'Todavía no la ha practicado.'}
                      {row.status === 'practicing' &&
                        `Nivel ${row.level}/3${row.updatedAt ? ` · última práctica ${formatDate(row.updatedAt)}` : ''}.`}
                      {row.status === 'dominated' &&
                        `Nivel ${row.level}/3${row.updatedAt ? ` · dominada el ${formatDate(row.updatedAt)}` : ''}.`}
                      {row.status === 'review' &&
                        `Nivel ${row.level}/3 · repaso pendiente${row.reviewDueDate ? ` desde el ${formatDay(row.reviewDueDate)}` : ''}.`}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
