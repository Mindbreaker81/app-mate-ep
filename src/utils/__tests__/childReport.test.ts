import { describe, expect, it } from 'vitest';
import { buildChildReport, type ChildAttempt } from '../childReport';

const NOW = new Date('2026-07-19T12:00:00Z');

function attempt(overrides: Partial<ChildAttempt> = {}): ChildAttempt {
  return {
    operation: 'division',
    grade: '5e',
    isCorrect: true,
    timeSpent: 10,
    createdAt: '2026-07-18T10:00:00Z',
    ...overrides,
  };
}

function many(count: number, correct: number, overrides: Partial<ChildAttempt> = {}): ChildAttempt[] {
  return Array.from({ length: count }, (_, i) => attempt({ ...overrides, isCorrect: i < correct }));
}

describe('buildChildReport', () => {
  it('agrupa por curso y tipo con aciertos, fallos y tiempo medio', () => {
    const report = buildChildReport(
      [
        attempt({ grade: '5e', operation: 'division', isCorrect: true, timeSpent: 10 }),
        attempt({ grade: '5e', operation: 'division', isCorrect: false, timeSpent: 20 }),
        attempt({ grade: '6e', operation: 'power', isCorrect: true, timeSpent: 6 }),
      ],
      NOW,
    );

    expect(report.byGrade).toHaveLength(2);
    const grade5 = report.byGrade.find((g) => g.grade === '5e');
    expect(grade5?.operations).toEqual([
      {
        operation: 'division',
        contentStage: 'cycle-start',
        total: 2,
        correct: 1,
        failed: 1,
        accuracy: 50,
        avgTime: 15,
      },
    ]);
    const grade6 = report.byGrade.find((g) => g.grade === '6e');
    expect(grade6?.operations[0]).toMatchObject({ operation: 'power', total: 1, accuracy: 100 });
  });

  it('anota el tramo del contenido en cada ejercicio del curso elegido', () => {
    const report = buildChildReport(
      [
        attempt({ grade: '6e', operation: 'two-step-equation' }),
        attempt({ grade: '6e', operation: 'division' }),
      ],
      NOW,
    );

    const grade6 = report.byGrade.find((g) => g.grade === '6e')!;
    const eso = grade6.operations.find((op) => op.operation === 'two-step-equation')!;
    expect(eso.contentStage).toBe('eso-extension');
    const division = grade6.operations.find((op) => op.operation === 'division')!;
    expect(division.contentStage).toBe('cycle-start');
  });

  it('agrupa por tramo: repaso de 4.º, ciclo y ampliación ESO', () => {
    const report = buildChildReport(
      [
        // Curso elegido 4.º con contenido T1 → repaso de 4.º.
        attempt({ grade: '4t', operation: 'addition', isCorrect: true }),
        attempt({ grade: '4t', operation: 'addition', isCorrect: false }),
        // Curso elegido 6.º con contenido T3 → ampliación ESO (nunca «6.º»).
        attempt({ grade: '6e', operation: 'two-step-equation' }),
        // Curso elegido 5.º con contenido T2 → consolidación del ciclo.
        attempt({ grade: '5e', operation: 'decimal-addition' }),
      ],
      NOW,
    );

    expect(report.byStage.map((stage) => stage.stage)).toEqual([
      'review-4',
      'cycle-consolidation',
      'eso-extension',
    ]);

    const repaso = report.byStage.find((stage) => stage.stage === 'review-4')!;
    expect(repaso.total).toBe(2);
    expect(repaso.accuracy).toBe(50);
    expect(repaso.operations[0]).toMatchObject({ operation: 'addition', total: 2 });

    const eso = report.byStage.find((stage) => stage.stage === 'eso-extension')!;
    expect(eso.total).toBe(1);
    expect(eso.operations[0].operation).toBe('two-step-equation');
  });

  it('agrupa las operaciones fuera del catálogo como tramo desconocido', () => {
    const report = buildChildReport([attempt({ operation: 'operacion-historica' })], NOW);
    const last = report.byStage.at(-1)!;
    expect(last.stage).toBeNull();
    expect(last.operations[0].operation).toBe('operacion-historica');
  });

  it('ordena los cursos 4t, 5e, 6e', () => {
    const report = buildChildReport(
      [attempt({ grade: '6e' }), attempt({ grade: '4t' }), attempt({ grade: '5e' })],
      NOW,
    );
    expect(report.byGrade.map((g) => g.grade)).toEqual(['4t', '5e', '6e']);
  });

  it('genera aviso de refuerzo con ≥8 intentos y <60% de aciertos', () => {
    const report = buildChildReport(many(10, 4, { operation: 'division' }), NOW);

    const reinforce = report.advisories.find((a) => a.kind === 'reinforce');
    expect(reinforce).toMatchObject({ kind: 'reinforce', operation: 'division', accuracy: 40, total: 10 });
    expect(reinforce?.message).toMatch(/reforzar divisiones/i);
  });

  it('genera aviso de fortaleza con ≥8 intentos y ≥85% de aciertos', () => {
    const report = buildChildReport(many(8, 7, { operation: 'fraction-addition' }), NOW);

    const strength = report.advisories.find((a) => a.kind === 'strength');
    expect(strength).toMatchObject({ kind: 'strength', operation: 'fraction-addition', accuracy: 88 });
    expect(strength?.message).toMatch(/va muy bien/i);
  });

  it('no genera avisos con menos de 8 intentos', () => {
    const report = buildChildReport(many(7, 0, { operation: 'division' }), NOW);
    expect(report.advisories.filter((a) => a.kind !== 'inactive')).toHaveLength(0);
  });

  it('no genera aviso en la franja intermedia (60-84%)', () => {
    const report = buildChildReport(many(10, 7, { operation: 'division' }), NOW);
    expect(report.advisories.filter((a) => a.kind !== 'inactive')).toHaveLength(0);
  });

  it('genera aviso de inactividad tras 14 días sin ejercicios', () => {
    const report = buildChildReport(
      [attempt({ createdAt: '2026-06-20T10:00:00Z' })],
      NOW,
    );

    const inactive = report.advisories.find((a) => a.kind === 'inactive');
    expect(inactive).toBeDefined();
    expect(inactive?.message).toMatch(/29 días/);
  });

  it('no marca inactividad con actividad reciente ni con cero intentos', () => {
    expect(
      buildChildReport([attempt({ createdAt: '2026-07-18T10:00:00Z' })], NOW).advisories.find(
        (a) => a.kind === 'inactive',
      ),
    ).toBeUndefined();
    expect(buildChildReport([], NOW).advisories).toHaveLength(0);
  });
});
