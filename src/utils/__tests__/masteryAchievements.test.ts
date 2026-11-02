import { describe, expect, it } from 'vitest';
import type { SkillProgress } from '../../types';
import { ACHIEVEMENTS } from '../gameConfig';
import {
  AREA_BADGE_PREFIX,
  evaluateMasteryAchievements,
  masteryAchievementCatalog,
  masteryBadgeId,
  MASTERY_AREA_SETS,
  newMasteryAchievements,
} from '../masteryAchievements';
import { recordSkillAttempt } from '../skillProgress';
import { SKILLS, SKILL_AREAS } from '../skillCatalog';

const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = new Date('2026-11-02T12:00:00');

/**
 * Progreso construido intento a intento con fechas controladas.
 * `days` reparte los intentos entre días distintos (p. ej. [5, 5] = 5 ayer + 5 hoy).
 */
function buildProgress(correct: number, wrong: number, days: number[]): SkillProgress {
  let progress: SkillProgress | undefined;
  const results = [...Array(correct).fill(true), ...Array(wrong).fill(false)] as boolean[];
  results.forEach((isCorrect, index) => {
    progress = recordSkillAttempt(progress, {
      isCorrect,
      isFirstTry: true,
      date: new Date(NOW.getTime() + dayOffsetFor(index, days) * DAY_MS),
    });
  });
  return progress!;
}

function dayOffsetFor(index: number, days: number[]): number {
  let start = 0;
  for (let i = 0; i < days.length; i += 1) {
    if (index < start + days[i]) {
      return i - (days.length - 1);
    }
    start += days[i];
  }
  return 0;
}

/** Progreso dominado de una habilidad: 10 aciertos repartidos en dos días. */
function dominatedProgress(): SkillProgress {
  return buildProgress(10, 0, [5, 5]);
}

/** Progreso con todas las habilidades del área (y sus prerrequisitos) dominadas. */
function dominatedCatalog(): Record<string, SkillProgress> {
  return Object.fromEntries(SKILLS.map((skill) => [skill.id, dominatedProgress()]));
}

describe('catálogo de insignias por dominio', () => {
  it('genera una insignia por habilidad y una por área con IDs estables y únicos', () => {
    const catalog = masteryAchievementCatalog();
    const ids = catalog.map((badge) => badge.id);

    expect(new Set(ids).size).toBe(ids.length);
    for (const skill of SKILLS) {
      expect(ids).toContain(`mastery:${skill.id}`);
    }
    for (const area of Object.values(SKILL_AREAS)) {
      expect(ids).toContain(`mastery-area:${area.id}`);
    }
    expect(ids.filter((id) => id.startsWith('mastery:'))).toHaveLength(SKILLS.length);
    expect(ids.filter((id) => id.startsWith(AREA_BADGE_PREFIX))).toHaveLength(
      MASTERY_AREA_SETS.length,
    );
  });

  it('no reutiliza IDs de los logros existentes', () => {
    const badgeIds = new Set(masteryAchievementCatalog().map((badge) => badge.id));
    for (const achievement of ACHIEVEMENTS) {
      expect(badgeIds.has(achievement.id)).toBe(false);
    }
    // level_10 y los demás logros por puntuación/racha conservan su semántica.
    expect(ACHIEVEMENTS.some((a) => a.id === 'level_10')).toBe(true);
  });

  it('cada insignia explica cómo se obtiene', () => {
    for (const badge of masteryAchievementCatalog()) {
      expect(badge.name.trim()).not.toBe('');
      expect(badge.description).toMatch(/domina/i);
      expect(badge.unlocked).toBe(false);
    }
  });

  it('los conjuntos de área están versionados y reproducen el catálogo actual', () => {
    // Versiones explícitas: suben cuando el conjunto cambia (PIT-15 añadió
    // «recta-enteros» a cálculo y «recta-decimales» a número; PIT-23 añade
    // las habilidades T3 a «ampliacion»; PIT-17 añadió «graficos-datos» a datos).
    const expectedVersions: Record<string, number> = {
      calculo: 2,
      numero: 2,
      fracciones: 1,
      aplicaciones: 1,
      medidas: 1,
      datos: 2,
      ampliacion: 4,
    };
    for (const set of MASTERY_AREA_SETS) {
      expect(set.version).toBe(expectedVersions[set.areaId]);
      const catalogSkillIds = SKILLS.filter((skill) => skill.areaId === set.areaId).map(
        (skill) => skill.id,
      );
      expect(set.skillIds).toEqual(catalogSkillIds);
    }
  });
});

describe('evaluateMasteryAchievements', () => {
  it('no concede insignia con 9 intentos en la ventana', () => {
    const progress = { 'sumas-restas': buildProgress(9, 0, [4, 5]) };
    expect(evaluateMasteryAchievements(progress, NOW).size).toBe(0);
  });

  it('no concede insignia por debajo del 80 % de aciertos', () => {
    // 7/10 = 70 % en dos días: ni dominio ni insignia.
    const progress = { 'sumas-restas': buildProgress(7, 3, [5, 5]) };
    expect(evaluateMasteryAchievements(progress, NOW).size).toBe(0);
  });

  it('no concede insignia con 12 aciertos en un solo día', () => {
    const progress = { 'sumas-restas': buildProgress(12, 0, [12]) };
    expect(evaluateMasteryAchievements(progress, NOW).size).toBe(0);
  });

  it('concede mastery:<skillId> al dominar una habilidad sin prerrequisitos', () => {
    const progress = { 'sumas-restas': dominatedProgress() };
    expect(evaluateMasteryAchievements(progress, NOW)).toContain('mastery:sumas-restas');
  });

  it('el 80 % exacto dentro de la ventana concede la insignia', () => {
    // 8/10 = 80 % en dos días: dominio justo en el umbral.
    const progress = { 'sumas-restas': buildProgress(8, 2, [5, 5]) };
    expect(evaluateMasteryAchievements(progress, NOW)).toContain('mastery:sumas-restas');
  });

  it('sigue concedida cuando el repaso ya está pendiente', () => {
    // El dominio se alcanzó ayer; hoy ya tocaría repaso → la insignia se mantiene.
    const progress = { 'sumas-restas': dominatedProgress() };
    const tomorrow = new Date(NOW.getTime() + DAY_MS);
    expect(evaluateMasteryAchievements(progress, tomorrow)).toContain('mastery:sumas-restas');
  });

  it('no concede la insignia de una habilidad bloqueada por prerrequisitos', () => {
    // Progreso dominado en «enteros» pero sin dominar «operaciones-mixtas» ni «decimales».
    const progress = { enteros: dominatedProgress() };
    expect(evaluateMasteryAchievements(progress, NOW)).not.toContain('mastery:enteros');
  });

  it('concede la insignia cuando los prerrequisitos también están dominados', () => {
    const progress = {
      enteros: dominatedProgress(),
      'operaciones-mixtas': dominatedProgress(),
      decimales: dominatedProgress(),
      'multiplicacion-division': dominatedProgress(),
    };
    expect(evaluateMasteryAchievements(progress, NOW)).toContain('mastery:enteros');
  });

  it('concede la insignia de área solo con todo el conjunto versionado dominado', () => {
    const progress = dominatedCatalog();
    // El área «cálculo» queda incompleta: falta «enteros».
    delete progress.enteros;
    const earned = evaluateMasteryAchievements(progress, NOW);
    expect(earned).not.toContain('mastery-area:calculo');

    // Completando «enteros» (con sus prerrequisitos ya dominados) salta el área.
    progress.enteros = dominatedProgress();
    const completed = evaluateMasteryAchievements(progress, NOW);
    expect(completed).toContain('mastery-area:calculo');
  });

  it('con todas las habilidades dominadas concede las 7 insignias de área', () => {
    const earned = evaluateMasteryAchievements(dominatedCatalog(), NOW);
    for (const set of MASTERY_AREA_SETS) {
      expect(earned).toContain(`mastery-area:${set.areaId}`);
    }
    expect(earned.size).toBe(SKILLS.length + MASTERY_AREA_SETS.length);
  });
});

describe('newMasteryAchievements', () => {
  it('devuelve insignias desbloqueadas con sello temporal', () => {
    const progress = { 'sumas-restas': dominatedProgress() };
    const earned = newMasteryAchievements(progress, new Set(), NOW);

    expect(earned).toHaveLength(1);
    expect(earned[0].id).toBe('mastery:sumas-restas');
    expect(earned[0].unlocked).toBe(true);
    expect(earned[0].unlockedAt).toBe(NOW);
    expect(earned[0].name).toContain('Sumas y restas');
  });

  it('es idempotente: no repite IDs ya concedidos', () => {
    const progress = { 'sumas-restas': dominatedProgress() };
    const first = newMasteryAchievements(progress, new Set(), NOW);
    const second = newMasteryAchievements(progress, new Set(first.map((a) => a.id)), NOW);

    expect(first).toHaveLength(1);
    expect(second).toHaveLength(0);
  });
});

describe('masteryBadgeId', () => {
  it('construye el ID estable de una habilidad', () => {
    expect(masteryBadgeId('sumas-restas')).toBe('mastery:sumas-restas');
  });
});
