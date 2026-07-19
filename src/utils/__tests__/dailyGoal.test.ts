import { describe, expect, it } from 'vitest';
import {
  DAILY_GOAL,
  computeDayStreak,
  localDateKey,
  updateDailyProgress,
  updatePracticeDays,
} from '../dailyGoal';

describe('dailyGoal', () => {
  it('la meta diaria es 10 ejercicios', () => {
    expect(DAILY_GOAL).toBe(10);
  });

  it('incrementa el contador del día actual', () => {
    const result = updateDailyProgress({ date: '2026-07-19', count: 3 }, new Date('2026-07-19T10:00:00'));
    expect(result).toEqual({ date: '2026-07-19', count: 4 });
  });

  it('reinicia el contador al cambiar de día', () => {
    const result = updateDailyProgress({ date: '2026-07-18', count: 9 }, new Date('2026-07-19T10:00:00'));
    expect(result).toEqual({ date: '2026-07-19', count: 1 });
  });

  it('arranca desde cero sin progreso previo', () => {
    const result = updateDailyProgress(null, new Date('2026-07-19T10:00:00'));
    expect(result).toEqual({ date: '2026-07-19', count: 1 });
  });

  it('añade el día a practiceDays sin duplicar y limita a 60', () => {
    const now = new Date('2026-07-19T10:00:00');
    expect(updatePracticeDays(['2026-07-18'], now)).toEqual(['2026-07-18', '2026-07-19']);
    expect(updatePracticeDays(['2026-07-18', '2026-07-19'], now)).toEqual(['2026-07-18', '2026-07-19']);

    const many = Array.from({ length: 60 }, (_, i) => `2026-05-${String(i + 1).padStart(2, '0')}`);
    const result = updatePracticeDays(many, now);
    expect(result).toHaveLength(60);
    expect(result[result.length - 1]).toBe('2026-07-19');
  });

  it('racha de días consecutivos terminando hoy', () => {
    const now = new Date('2026-07-19T10:00:00');
    expect(computeDayStreak(['2026-07-17', '2026-07-18', '2026-07-19'], now)).toBe(3);
  });

  it('terminar ayer aún cuenta (la racha sigue viva hoy)', () => {
    const now = new Date('2026-07-19T10:00:00');
    expect(computeDayStreak(['2026-07-17', '2026-07-18'], now)).toBe(2);
  });

  it('cadena rota devuelve 0', () => {
    const now = new Date('2026-07-19T10:00:00');
    expect(computeDayStreak(['2026-07-15', '2026-07-16'], now)).toBe(0);
    expect(computeDayStreak([], now)).toBe(0);
  });

  it('localDateKey usa la fecha local', () => {
    expect(localDateKey(new Date(2026, 6, 19, 23, 59))).toBe('2026-07-19');
    expect(localDateKey(new Date(2026, 0, 5, 0, 1))).toBe('2026-01-05');
  });
});
