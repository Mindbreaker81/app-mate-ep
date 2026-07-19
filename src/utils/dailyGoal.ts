import type { DailyProgress } from '../types';

export const DAILY_GOAL = 10;
const MAX_PRACTICE_DAYS = 60;

export type { DailyProgress } from '../types';

export function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function updateDailyProgress(previous: DailyProgress | null, now: Date): DailyProgress {
  const today = localDateKey(now);
  if (previous && previous.date === today) {
    return { date: today, count: previous.count + 1 };
  }
  return { date: today, count: 1 };
}

export function updatePracticeDays(days: string[], now: Date): string[] {
  const today = localDateKey(now);
  if (days.includes(today)) {
    return days;
  }
  const next = [...days, today].sort();
  return next.slice(-MAX_PRACTICE_DAYS);
}

/** Días consecutivos de práctica; la cadena sigue viva si el último día es hoy o ayer. */
export function computeDayStreak(days: string[], now: Date): number {
  if (days.length === 0) {
    return 0;
  }

  const daySet = new Set(days);
  // Aritmética de calendario, no de milisegundos: restar 24 h al cruzar el cambio
  // de hora se salta un día y rompería la racha.
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const previousDay = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1);

  let cursor: Date;
  if (daySet.has(localDateKey(startOfToday))) {
    cursor = startOfToday;
  } else if (daySet.has(localDateKey(previousDay(startOfToday)))) {
    cursor = previousDay(startOfToday);
  } else {
    return 0;
  }

  let streak = 0;
  while (daySet.has(localDateKey(cursor))) {
    streak += 1;
    cursor = previousDay(cursor);
  }
  return streak;
}
