import { describe, expect, it } from 'vitest';
import type { AttemptRecord } from '../../services/adminService';
import type { SkillProgress } from '../../types';
import {
  buildSkillMastery,
  buildSkillReport,
  buildWeeklySummary,
  pendingReviews,
  skillReportToCsv,
} from '../skillReport';

const attempt = (operation: string, isCorrect: boolean, timeSpent = 5): AttemptRecord =>
  ({
    userId: 'u1',
    operation,
    grade: '5e',
    isCorrect,
    timeSpent,
    createdAt: '2026-07-20T10:00:00',
  }) as AttemptRecord;

describe('buildSkillReport', () => {
  it('agrega intentos por habilidad con acierto y tiempo medio', () => {
    const rows = buildSkillReport([
      attempt('addition', true, 4),
      attempt('subtraction', false, 6),
      attempt('addition', true, 6),
      attempt('decimal-addition', true, 10),
      attempt('operacion-inexistente', true),
    ]);
    expect(rows).toHaveLength(2);

    const calculo = rows.find((row) => row.skillId === 'sumas-restas')!;
    expect(calculo.total).toBe(3);
    expect(calculo.correct).toBe(2);
    expect(calculo.accuracy).toBe(67);
    expect(calculo.avgTime).toBe(5);
    expect(calculo.skillName).toBe('Sumas y restas');
    expect(calculo.tier).toBe(1);

    const decimales = rows.find((row) => row.skillId === 'decimales')!;
    expect(decimales.total).toBe(1);
    expect(decimales.accuracy).toBe(100);
    expect(decimales.tier).toBe(2);
  });

  it('marca el tier de la habilidad, también el de ampliación ESO', () => {
    const rows = buildSkillReport([attempt('two-step-equation', true)]);
    expect(rows[0].skillId).toBe('ecuaciones-dos-pasos');
    expect(rows[0].tier).toBe(3);
  });

  it('devuelve una lista vacía sin intentos mapeables', () => {
    expect(buildSkillReport([attempt('operacion-inexistente', true)])).toHaveLength(0);
    expect(buildSkillReport([])).toHaveLength(0);
  });
});

describe('buildSkillMastery', () => {
  const progress = (overrides: Partial<SkillProgress> = {}): SkillProgress => ({
    state: 'practicing',
    recentResults: [],
    streakCorrect: 0,
    streakWrong: 0,
    activeDays: [],
    reviewDueDate: null,
    reviewCount: 0,
    level: 1,
    updatedAt: '2026-10-31T10:00:00Z',
    ...overrides,
  });

  const today = new Date('2026-11-02T12:00:00');

  it('sin progreso: T1 «Sin empezar» y T2 «Bloqueada» con sus prerrequisitos', () => {
    const rows = buildSkillMastery({}, today);

    expect(rows.find((row) => row.skillId === 'sumas-restas')!.status).toBe('not-started');
    const decimales = rows.find((row) => row.skillId === 'decimales')!;
    expect(decimales.status).toBe('locked');
    expect(decimales.missingPrerequisites).toEqual(['multiplicacion-division']);
  });

  it('refleja dominio persistido y nivel', () => {
    const rows = buildSkillMastery(
      {
        'sumas-restas': progress({
          state: 'dominated',
          level: 3,
          reviewDueDate: '2026-12-01',
          updatedAt: '2026-10-31T10:00:00Z',
        }),
      },
      today,
    );

    const row = rows.find((entry) => entry.skillId === 'sumas-restas')!;
    expect(row.status).toBe('dominated');
    expect(row.level).toBe(3);
    expect(row.updatedAt).toBe('2026-10-31T10:00:00Z');
  });

  it('deriva dominio efectivo desde la ventana aunque el estado guardado siga en práctica', () => {
    const rows = buildSkillMastery(
      {
        'sumas-restas': progress({
          state: 'practicing',
          recentResults: Array.from({ length: 10 }, () => true),
          activeDays: ['2026-10-30', '2026-10-31'],
        }),
      },
      today,
    );

    expect(rows.find((row) => row.skillId === 'sumas-restas')!.status).toBe('dominated');
  });

  it('una dominada con repaso vencido queda en repaso pendiente con su fecha', () => {
    const rows = buildSkillMastery(
      {
        'sumas-restas': progress({
          state: 'review',
          reviewDueDate: '2026-10-20',
          reviewCount: 1,
        }),
      },
      today,
    );

    const row = rows.find((entry) => entry.skillId === 'sumas-restas')!;
    expect(row.status).toBe('review');
    expect(row.reviewDueDate).toBe('2026-10-20');
    expect(pendingReviews(rows).map((entry) => entry.skillId)).toEqual(['sumas-restas']);
  });

  it('los prerrequisitos dominados abren la habilidad; solo faltan los no dominados', () => {
    // equivalencias exige fracciones-basicas y decimales; decimales exige multiplicacion-division
    const dominated = { state: 'dominated', level: 2, updatedAt: '2026-10-31T10:00:00Z' } as const;
    const rows = buildSkillMastery(
      {
        'multiplicacion-division': progress({ ...dominated }),
        decimales: progress({ ...dominated }),
        'fracciones-basicas': progress({ ...dominated }),
      },
      today,
    );

    const equivalencias = rows.find((row) => row.skillId === 'equivalencias')!;
    expect(equivalencias.status).toBe('not-started');
    expect(equivalencias.missingPrerequisites).toEqual([]);

    const porcentajes = rows.find((row) => row.skillId === 'porcentajes')!;
    expect(porcentajes.status).toBe('locked');
    expect(porcentajes.missingPrerequisites).toEqual(['equivalencias']);
  });

  it('en práctica conserva nivel y fecha; una habilidad sin registro no es suspenso', () => {
    const rows = buildSkillMastery(
      {
        'fracciones-basicas': progress({
          recentResults: [true, false, true],
          activeDays: ['2026-11-01'],
          level: 2,
        }),
      },
      today,
    );

    const row = rows.find((entry) => entry.skillId === 'fracciones-basicas')!;
    expect(row.status).toBe('practicing');
    expect(row.level).toBe(2);
    expect(row.reviewDueDate).toBeNull();
  });
});

describe('buildWeeklySummary', () => {
  const now = new Date('2026-11-04T12:00:00'); // miércoles; lunes = 2026-11-02

  const weekAttempt = (
    operation: string,
    grade: string,
    source: AttemptRecord['source'],
    isCorrect: boolean,
    createdAt: string,
  ): AttemptRecord =>
    ({ userId: 'u1', operation, grade, source, isCorrect, timeSpent: 5, createdAt }) as AttemptRecord;

  it('resume la semana en curso distinguiendo procedencia y tramo', () => {
    const summary = buildWeeklySummary(
      [
        weekAttempt('addition', '4t', 'free', true, '2026-11-02T09:00:00'),
        weekAttempt('addition', '6e', 'daily-session', true, '2026-11-03T09:00:00'),
        weekAttempt('two-step-equation', '6e', 'path', false, '2026-11-04T09:00:00'),
        weekAttempt('operacion-inexistente', '5e', 'free', true, '2026-11-04T10:00:00'),
        // Semana anterior: se ignora
        weekAttempt('addition', '5e', 'free', true, '2026-10-25T09:00:00'),
      ],
      now,
    );

    expect(summary.weekStart).toBe('2026-11-02');
    expect(summary.total).toBe(4);
    expect(summary.correct).toBe(3);
    expect(summary.accuracy).toBe(75);
    expect(summary.bySource).toEqual([
      { source: 'free', total: 2, correct: 2 },
      { source: 'path', total: 1, correct: 0 },
      { source: 'daily-session', total: 1, correct: 1 },
    ]);
    expect(summary.byStage).toEqual([
      { stage: 'review-4', total: 1, correct: 1 },
      { stage: 'cycle-start', total: 1, correct: 1 },
      { stage: 'eso-extension', total: 1, correct: 0 },
      { stage: null, total: 1, correct: 1 },
    ]);
  });

  it('sin intentos esta semana: accuracy null y desgloses vacíos', () => {
    const summary = buildWeeklySummary(
      [weekAttempt('addition', '5e', 'free', true, '2026-10-25T09:00:00')],
      now,
    );

    expect(summary.total).toBe(0);
    expect(summary.accuracy).toBeNull();
    expect(summary.bySource).toEqual([]);
    expect(summary.byStage).toEqual([]);
  });
});

describe('skillReportToCsv', () => {
  it('genera CSV con BOM, cabecera y campos escapados', () => {
    const csv = skillReportToCsv([
      { skillId: 'sumas-restas', skillName: 'Sumas y restas', area: 'calculo', tier: 1, total: 3, correct: 2, accuracy: 67, avgTime: 5 },
      { skillId: 'problemas', skillName: 'Problemas; verbales', area: 'aplicaciones', tier: 2, total: 1, correct: 1, accuracy: 100, avgTime: 8 },
      { skillId: 'ecuaciones-dos-pasos', skillName: 'Ecuaciones de dos pasos', area: 'ampliacion', tier: 3, total: 4, correct: 3, accuracy: 75, avgTime: 12 },
    ]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    const lines = csv.replace(/\ufeff/g, '').trim().split('\r\n');
    expect(lines[0]).toBe('habilidad;área;tramo;intentos;correctos;acierto_%;tiempo_medio_s');
    expect(lines[1]).toBe('Sumas y restas;calculo;Inicio del ciclo 5.º–6.º;3;2;67;5');
    expect(lines[2]).toContain('"Problemas; verbales"');
    expect(lines[2]).toContain('Consolidación del ciclo 5.º–6.º');
    expect(lines[3]).toBe('Ecuaciones de dos pasos;ampliacion;Ampliación ESO;4;3;75;12');
  });
});
