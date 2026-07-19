import type { ChildAttempt } from './childReport';
import { localDateKey } from './dailyGoal';

export interface WeeklyBucket {
  /** Lunes de la semana, fecha local YYYY-MM-DD. */
  weekStart: string;
  total: number;
  correct: number;
  /** Porcentaje 0-100, o null si no hubo intentos. */
  accuracy: number | null;
}

function mondayOf(date: Date): Date {
  const day = date.getDay(); // 0 = domingo
  const offset = day === 0 ? 6 : day - 1;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - offset);
}

/** Precisión por semana (lunes a domingo) de las últimas `weeks` semanas, la actual al final. */
export function buildWeeklyTrend(attempts: ChildAttempt[], now: Date = new Date(), weeks = 8): WeeklyBucket[] {
  const currentMonday = mondayOf(now);
  const starts: Date[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    // Aritmética de calendario, no de milisegundos: al cruzar el cambio de hora
    // restar 7×24 h dejaría la fecha en el domingo anterior a las 23:00.
    starts.push(
      new Date(currentMonday.getFullYear(), currentMonday.getMonth(), currentMonday.getDate() - i * 7),
    );
  }

  const buckets = new Map<string, { total: number; correct: number }>();
  for (const start of starts) {
    buckets.set(localDateKey(start), { total: 0, correct: 0 });
  }

  for (const attempt of attempts) {
    const key = localDateKey(mondayOf(new Date(attempt.createdAt)));
    const bucket = buckets.get(key);
    if (!bucket) continue;
    bucket.total += 1;
    if (attempt.isCorrect) bucket.correct += 1;
  }

  return starts.map((start) => {
    const key = localDateKey(start);
    const { total, correct } = buckets.get(key)!;
    return {
      weekStart: key,
      total,
      correct,
      accuracy: total > 0 ? Math.round((correct / total) * 100) : null,
    };
  });
}
