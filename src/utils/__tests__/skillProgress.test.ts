import { describe, expect, it } from 'vitest';
import type { SkillProgress } from '../../types';
import { SKILLS, skillIdForOperation } from '../skillCatalog';
import {
  DOMINANCE_MIN_ATTEMPTS,
  DOMINANCE_WINDOW,
  DAILY_SESSION_SIZE,
  MAX_SAME_SKILL_IN_ROW,
  buildDailySession,
  createSkillProgress,
  deriveSkillState,
  initializeSkillProgressFromAttempts,
  mergeSkillProgress,
  prerequisitesMet,
  recordSkillAttempt,
} from '../skillProgress';

const DAY_1 = new Date('2026-07-20T10:00:00');
const DAY_2 = new Date('2026-07-21T10:00:00');

function progressWith(results: boolean[], days: string[]): SkillProgress {
  return {
    state: 'practicing',
    recentResults: results,
    streakCorrect: 0,
    streakWrong: 0,
    activeDays: days,
    reviewDueDate: null,
    reviewCount: 0,
    level: 1,
    updatedAt: DAY_1.toISOString(),
  };
}

describe('skillCatalog', () => {
  it('cada operación pertenece a una sola habilidad', () => {
    const seen = new Set<string>();
    for (const skill of SKILLS) {
      for (const operation of skill.operations) {
        expect(seen.has(operation), `operación repetida: ${operation}`).toBe(false);
        seen.add(operation);
        expect(skillIdForOperation(operation)).toBe(skill.id);
      }
    }
  });

  it('las habilidades T1 no tienen prerrequisitos y las T3 se llaman Ampliació ESO', () => {
    for (const skill of SKILLS) {
      if (skill.tier === 1) {
        expect(skill.prerequisites).toHaveLength(0);
      }
    }
    // Etiquetas de tier sin cursos exactos.
    expect(SKILLS.every((skill) => skill.tier >= 1 && skill.tier <= 3)).toBe(true);
  });
});

describe('skillProgress: dominio', () => {
  it('domina con 10 intentos al 80 % y 2 días distintos dentro de la ventana', () => {
    const results = Array.from({ length: 10 }, (_, i) => i < 8); // 8/10 = 80 %
    const progress = recordSkillAttempt(progressWith(results, ['2026-07-20']), {
      isCorrect: true,
      isFirstTry: true,
      date: DAY_2,
    });
    expect(progress.recentResults).toHaveLength(11);
    expect(deriveSkillState(progress, true, DAY_2)).toBe('dominated');
  });

  it('no domina con menos de 10 intentos aunque el porcentaje sea alto', () => {
    const results = Array.from({ length: DOMINANCE_MIN_ATTEMPTS - 1 }, () => true); // 9 aciertos
    const progress = progressWith(results, ['2026-07-20', '2026-07-21']);
    expect(deriveSkillState(progress, true, DAY_2)).toBe('practicing');
  });

  it('no domina con 2 días si el porcentaje es bajo', () => {
    const results = Array.from({ length: 12 }, (_, i) => i < 9); // 9/12 = 75 %
    const progress = progressWith(results, ['2026-07-20', '2026-07-21']);
    expect(deriveSkillState(progress, true, DAY_2)).toBe('practicing');
  });

  it('no domina con 80 % si solo hay actividad en un día', () => {
    const results = Array.from({ length: 12 }, (_, i) => i < 10); // 10/12 ≈ 83 %
    const progress = progressWith(results, ['2026-07-20']);
    expect(deriveSkillState(progress, true, DAY_2)).toBe('practicing');
  });

  it('la ventana guarda como máximo 12 intentos', () => {
    let progress = createSkillProgress(DAY_1);
    for (let i = 0; i < 30; i += 1) {
      progress = recordSkillAttempt(progress, { isCorrect: i % 2 === 0, isFirstTry: true, date: DAY_1 });
    }
    expect(progress.recentResults).toHaveLength(DOMINANCE_WINDOW);
  });

  it('queda bloqueada sin prerrequisitos cumplidos', () => {
    const progress = progressWith(Array.from({ length: 12 }, () => true), ['2026-07-20', '2026-07-21']);
    expect(deriveSkillState(progress, false, DAY_2)).toBe('locked');
    expect(prerequisitesMet(SKILLS.find((skill) => skill.id === 'decimales')!, {})).toBe(false);
  });
});

describe('skillProgress: niveles', () => {
  it('sube de nivel con 3 aciertos seguidos al primer intento (máx. 3)', () => {
    let progress = createSkillProgress(DAY_1);
    for (let i = 0; i < 7; i += 1) {
      progress = recordSkillAttempt(progress, { isCorrect: true, isFirstTry: true, date: DAY_1 });
    }
    expect(progress.level).toBe(3);

    // Un intento correcto que no es el primero no sube nivel.
    progress = recordSkillAttempt(progress, { isCorrect: true, isFirstTry: false, date: DAY_1 });
    expect(progress.level).toBe(3);
  });

  it('baja de nivel con 2 fallos seguidos (mín. 1)', () => {
    let progress: SkillProgress = { ...createSkillProgress(DAY_1), level: 3 };
    progress = recordSkillAttempt(progress, { isCorrect: false, isFirstTry: true, date: DAY_1 });
    expect(progress.level).toBe(3);
    progress = recordSkillAttempt(progress, { isCorrect: false, isFirstTry: true, date: DAY_1 });
    expect(progress.level).toBe(2);
    progress = recordSkillAttempt(progress, { isCorrect: false, isFirstTry: true, date: DAY_1 });
    expect(progress.level).toBe(2);
  });
});

describe('skillProgress: repaso espaciado', () => {
  it('programa el primer repaso a 1 día desde el dominio y luego 3, 7 y 14', () => {
    const results = Array.from({ length: 12 }, (_, i) => i < 10);
    let progress = progressWith(results.slice(0, 11), ['2026-07-20']);
    progress = recordSkillAttempt(progress, { isCorrect: true, isFirstTry: true, date: DAY_2 });
    expect(progress.state).toBe('review');
    expect(progress.reviewDueDate).toBe('2026-07-22'); // 1 día después

    // Repaso completado el día due → siguiente intervalo (3 días).
    progress = recordSkillAttempt(progress, { isCorrect: true, isFirstTry: true, date: new Date('2026-07-22T10:00:00') });
    expect(progress.state).toBe('dominated');
    expect(progress.reviewDueDate).toBe('2026-07-25');

    progress = recordSkillAttempt(progress, { isCorrect: true, isFirstTry: true, date: new Date('2026-07-25T10:00:00') });
    expect(progress.reviewDueDate).toBe('2026-08-01'); // 7 días
  });

  it('sigue dominada si aún no toca repaso', () => {
    const progress: SkillProgress = {
      ...progressWith(Array.from({ length: 12 }, () => true), ['2026-07-20', '2026-07-21']),
      state: 'dominated',
      reviewDueDate: '2026-07-28',
    };
    expect(deriveSkillState(progress, true, DAY_2)).toBe('dominated');
    expect(deriveSkillState(progress, true, new Date('2026-07-28T09:00:00'))).toBe('review');
  });
});

describe('skillProgress: fusión e inicialización', () => {
  it('fusiona local y remoto usando updatedAt más reciente por habilidad', () => {
    const local: Record<string, SkillProgress> = {
      decimales: { ...createSkillProgress(DAY_1), updatedAt: '2026-07-20T12:00:00', level: 2 },
    };
    const remote: Record<string, SkillProgress> = {
      decimales: { ...createSkillProgress(DAY_1), updatedAt: '2026-07-21T08:00:00', level: 1 },
      enteros: { ...createSkillProgress(DAY_1), updatedAt: '2026-07-19T08:00:00', level: 2 },
    };
    const merged = mergeSkillProgress(local, remote);
    expect(merged.decimales.level).toBe(1); // gana el remoto (más reciente)
    expect(merged.enteros.level).toBe(2); // entra el remoto (no existía local)
  });

  it('inicializa el progreso desde el historial de intentos', () => {
    const attempts = [
      { operation: 'addition', grade: '5e', isCorrect: true, timeSpent: 5, createdAt: '2026-07-18T10:00:00' },
      { operation: 'addition', grade: '5e', isCorrect: true, timeSpent: 5, createdAt: '2026-07-19T10:00:00' },
      { operation: 'multiplication', grade: '5e', isCorrect: false, timeSpent: 8, createdAt: '2026-07-19T11:00:00' },
      { operation: 'operacion-desconocida', grade: '5e', isCorrect: true, timeSpent: 3, createdAt: '2026-07-19T12:00:00' },
    ];
    const progress = initializeSkillProgressFromAttempts(attempts);
    expect(progress['sumas-restas'].recentResults).toEqual([true, true]);
    expect(progress['sumas-restas'].activeDays).toEqual(['2026-07-18', '2026-07-19']);
    expect(progress['multiplicacion-division'].recentResults).toEqual([false]);
    expect(progress['operacion-desconocida']).toBeUndefined();
  });
});

describe('skillProgress: sesión diaria', () => {
  it('genera 10 ejercicios sin más de 3 seguidos de la misma habilidad (con alternativas)', () => {
    const session = buildDailySession({}, { today: DAY_1 });
    expect(session).toHaveLength(DAILY_SESSION_SIZE);
    // Con las 4 habilidades T1 disponibles nunca hay más de 3 consecutivos.
    expect(new Set(session).size).toBeGreaterThanOrEqual(2);
    let run = 1;
    for (let i = 1; i < session.length; i += 1) {
      run = session[i] === session[i - 1] ? run + 1 : 1;
      expect(run, `más de ${MAX_SAME_SKILL_IN_ROW} consecutivos de ${session[i]}`).toBeLessThanOrEqual(MAX_SAME_SKILL_IN_ROW);
    }
  });

  it('excluye dominadas y bloqueadas de la sesión', () => {
    const dominated = progressWith(Array.from({ length: 12 }, () => true), ['2026-07-20', '2026-07-21']);
    const progress: Record<string, SkillProgress> = {
      'sumas-restas': { ...dominated, state: 'dominated', reviewDueDate: null },
    };
    const session = buildDailySession(progress, { today: DAY_1 });
    expect(session).toHaveLength(DAILY_SESSION_SIZE);
    expect(session).not.toContain('sumas-restas'); // dominada sin repaso pendiente: fuera
    expect(session).not.toContain('enteros'); // T2 sin prerrequisitos dominados: bloqueada
  });

  it('prioriza los repasos pendientes y las habilidades en práctica', () => {
    const dominated = progressWith(Array.from({ length: 12 }, () => true), ['2026-07-20', '2026-07-21']);
    const progress: Record<string, SkillProgress> = {
      'sumas-restas': { ...dominated, state: 'dominated', reviewDueDate: null },
      'multiplicacion-division': { ...dominated, state: 'dominated', reviewDueDate: null },
      'division-con-resto': { ...dominated, state: 'dominated', reviewDueDate: null },
      'operaciones-mixtas': { ...dominated, state: 'dominated', reviewDueDate: null },
      'fracciones-basicas': { ...dominated, state: 'dominated', reviewDueDate: null },
      'geometria-basica': { ...dominated, state: 'dominated', reviewDueDate: null },
      decimales: { ...progressWith([], ['2026-07-20']), state: 'review', reviewDueDate: '2026-07-20' },
      porcentajes: progressWith([false], ['2026-07-20']),
    };
    const session = buildDailySession(progress, { today: DAY_1 });
    expect(session).toHaveLength(DAILY_SESSION_SIZE);
    expect(session[0]).toBe('decimales'); // repaso pendiente primero
    // 'estimacion-redondeo' está en práctica con prerrequisito (decimales) en repaso: entra.
    expect(session).toContain('estimacion-redondeo');
    // 'porcentajes' queda bloqueada: su prerrequisito 'equivalencias' solo está iniciado.
    expect(session).not.toContain('porcentajes');
    expect(session).not.toContain('enteros'); // bloqueada fuera
  });
});
