import { describe, expect, it } from 'vitest';
import type { AttemptRecord } from '../../services/adminService';
import { buildSkillReport, skillReportToCsv } from '../skillReport';

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
