import { describe, expect, it } from 'vitest';
import { buildWeeklyTrend } from '../weeklyTrend';
import type { ChildAttempt } from '../childReport';

const attempt = (createdAt: string, isCorrect: boolean): ChildAttempt => ({
  operation: 'division',
  grade: '5e',
  isCorrect,
  timeSpent: 10,
  createdAt,
});

// 2026-07-19 es domingo; su semana ISO empieza el lunes 13.
const now = new Date('2026-07-19T12:00:00');

describe('buildWeeklyTrend', () => {
  it('devuelve 8 semanas terminando en la actual, lunes como inicio', () => {
    const trend = buildWeeklyTrend([], now, 8);

    expect(trend).toHaveLength(8);
    expect(trend[7].weekStart).toBe('2026-07-13');
    expect(trend[0].weekStart).toBe('2026-05-25');
    for (const bucket of trend) {
      expect(bucket.total).toBe(0);
      expect(bucket.accuracy).toBeNull();
    }
  });

  it('agrupa intentos por semana y calcula precisión', () => {
    const attempts = [
      attempt('2026-07-14T10:00:00Z', true),
      attempt('2026-07-15T10:00:00Z', false),
      attempt('2026-07-16T10:00:00Z', true),
      attempt('2026-07-17T10:00:00Z', true),
      // Semana anterior (6-12 julio)
      attempt('2026-07-07T10:00:00Z', false),
      attempt('2026-07-08T10:00:00Z', false),
    ];

    const trend = buildWeeklyTrend(attempts, now, 8);

    const current = trend[7];
    expect(current.total).toBe(4);
    expect(current.correct).toBe(3);
    expect(current.accuracy).toBe(75);

    const previous = trend[6];
    expect(previous.weekStart).toBe('2026-07-06');
    expect(previous.total).toBe(2);
    expect(previous.accuracy).toBe(0);
  });

  // El 29 de marzo de 2026 los relojes se adelantan una hora en España: restar
  // 7×24 h desde el lunes local deja las semanas anteriores en domingo a las 23:00.
  it('mantiene los lunes al cruzar el cambio de hora de primavera', () => {
    const afterDst = new Date('2026-03-31T18:00:00');
    const trend = buildWeeklyTrend([attempt('2026-03-24T17:00:00', true)], afterDst, 8);

    expect(trend.map((b) => b.weekStart)).toEqual([
      '2026-02-09',
      '2026-02-16',
      '2026-02-23',
      '2026-03-02',
      '2026-03-09',
      '2026-03-16',
      '2026-03-23',
      '2026-03-30',
    ]);
    expect(trend[6].total).toBe(1);
    expect(trend[6].accuracy).toBe(100);
  });

  it('ignora intentos fuera de la ventana', () => {
    const trend = buildWeeklyTrend([attempt('2026-01-01T10:00:00Z', true)], now, 8);

    expect(trend.every((bucket) => bucket.total === 0)).toBe(true);
  });
});
