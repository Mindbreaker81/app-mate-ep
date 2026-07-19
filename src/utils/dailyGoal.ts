import type { DailyProgress } from '../types';

export const DAILY_GOAL = 10;
const MAX_PRACTICE_DAYS = 60;
const DAY_MS = 24 * 60 * 60 * 1000;

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
  const today = localDateKey(now);
  const yesterday = localDateKey(new Date(now.getTime() - DAY_MS));

  let cursor: Date;
  if (daySet.has(today)) {
    cursor = new Date(now.getTime());
  } else if (daySet.has(yesterday)) {
    cursor = new Date(now.getTime() - DAY_MS);
  } else {
    return 0;
  }

  let streak = 0;
  while (daySet.has(localDateKey(cursor))) {
    streak += 1;
    cursor = new Date(cursor.getTime() - DAY_MS);
  }
  return streak;
}
