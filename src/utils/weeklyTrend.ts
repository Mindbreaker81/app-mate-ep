import type { ChildAttempt } from './childReport';
import { localDateKey } from './dailyGoal';

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;

export interface WeeklyBucket {
  /** Lunes de la semana, fecha local YYYY-MM-DD. */
  weekStart: string;
  total: number;
  correct: number;
  /** Porcentaje 0-100, o null si no hubo intentos. */
  accuracy: number | null;
}

function mondayOf(date: Date): Date {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = result.getDay(); // 0 = domingo
  const offset = day === 0 ? 6 : day - 1;
  return new Date(result.getTime() - offset * DAY_MS);
}

/** Precisión por semana (lunes a domingo) de las últimas `weeks` semanas, la actual al final. */
export function buildWeeklyTrend(attempts: ChildAttempt[], now: Date = new Date(), weeks = 8): WeeklyBucket[] {
  const currentMonday = mondayOf(now);
  const starts: Date[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    starts.push(new Date(currentMonday.getTime() - i * WEEK_MS));
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
