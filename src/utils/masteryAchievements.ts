import type { Achievement, SkillProgress } from '../types';
import { createSkillProgress, deriveSkillState, prerequisitesMet } from './skillProgress';
import { getSkillById, SKILLS, SKILL_AREAS, type SkillAreaId } from './skillCatalog';

/**
 * Insignias por dominio (PIT-20): reconocimiento permanente al dominar una
 * habilidad o un área completa del camino de aprendizaje. Se guardan como
 * achievements normales en game_state.data (sin migración); un repaso
 * pendiente NUNCA retira una insignia ya concedida.
 *
 * IDs estables: `mastery:<skillId>` por habilidad y `mastery-area:<areaId>`
 * por área. No reutilizan ni cambian los IDs de logros existentes.
 */
export const MASTERY_BADGE_PREFIX = 'mastery:';
export const AREA_BADGE_PREFIX = 'mastery-area:';

export function masteryBadgeId(skillId: string): string {
  return `${MASTERY_BADGE_PREFIX}${skillId}`;
}

export function areaBadgeId(areaId: SkillAreaId): string {
  return `${AREA_BADGE_PREFIX}${areaId}`;
}

/** true si el ID es de una insignia por dominio (habilidad o área). */
export function isMasteryBadgeId(id: string): boolean {
  return id.startsWith(MASTERY_BADGE_PREFIX) || id.startsWith(AREA_BADGE_PREFIX);
}

/**
 * Conjunto explícito y versionado de habilidades que exige cada insignia de
 * área. Si el catálogo crece, hay que revisar estas listas a propósito y
 * subir `version`: las insignias ya concedidas nunca se retiran, pero el
 * conjunto deja de reflejar el área completa si no se actualiza.
 */
export interface MasteryAreaSet {
  areaId: SkillAreaId;
  version: number;
  skillIds: string[];
}

export const MASTERY_AREA_SETS: MasteryAreaSet[] = [
  {
    // v2: entra «recta-enteros» (PIT-15).
    areaId: 'calculo',
    version: 2,
    skillIds: [
      'sumas-restas',
      'multiplicacion-division',
      'division-con-resto',
      'operaciones-mixtas',
      'enteros',
      'recta-enteros',
    ],
  },
  {
    // v2: entra «recta-decimales» (PIT-15).
    areaId: 'numero',
    version: 2,
    skillIds: [
      'decimales',
      'estimacion-redondeo',
      'potencias-raices',
      'valor-posicional',
      'recta-decimales',
      'secuencias',
      'teoria-numeros',
    ],
  },
  {
    areaId: 'fracciones',
    version: 1,
    skillIds: ['fracciones-basicas', 'fracciones-avanzadas', 'equivalencias'],
  },
  {
    areaId: 'aplicaciones',
    version: 1,
    skillIds: ['porcentajes', 'problemas', 'razones-proporciones', 'finanzas'],
  },
  {
    areaId: 'medidas',
    version: 1,
    skillIds: ['unidades', 'geometria-basica', 'geometria-avanzada'],
  },
  { areaId: 'datos', version: 1, skillIds: ['estadistica', 'probabilidad'] },
  {
    areaId: 'ampliacion',
    version: 1,
    skillIds: ['ecuaciones', 'ecuaciones-dos-pasos', 'proporcionalidad-inversa'],
  },
];

/** Dominio efectivo de una habilidad: 'dominated' o 'review' con prerrequisitos cumplidos. */
function skillMastered(
  skillId: string,
  progress: Record<string, SkillProgress>,
  today: Date,
): boolean {
  const skill = getSkillById(skillId);
  if (!skill) {
    return false;
  }
  const state = deriveSkillState(
    progress[skillId] ?? createSkillProgress(today),
    prerequisitesMet(skill, progress),
    today,
  );
  // 'review' también cuenta: la insignia reconoce el dominio YA alcanzado,
  // aunque toque repasarlo.
  return state === 'dominated' || state === 'review';
}

/**
 * IDs de insignias ganadas por el progreso actual (habilidad dominada con
 * sus prerrequisitos; área con todo su conjunto versionado dominado).
 * Función pura: no concede ni quita nada, solo calcula.
 */
export function evaluateMasteryAchievements(
  progress: Record<string, SkillProgress>,
  today: Date = new Date(),
): Set<string> {
  const earned = new Set<string>();
  for (const skill of SKILLS) {
    if (skillMastered(skill.id, progress, today)) {
      earned.add(masteryBadgeId(skill.id));
    }
  }
  for (const set of MASTERY_AREA_SETS) {
    if (set.skillIds.every((skillId) => skillMastered(skillId, progress, today))) {
      earned.add(areaBadgeId(set.areaId));
    }
  }
  return earned;
}

/**
 * Catálogo completo de insignias (bloqueadas), para mostrarlas en la UI con
 * la forma de conseguirlas. La descripción explica cómo se obtiene cada una.
 */
export function masteryAchievementCatalog(): Achievement[] {
  return [
    ...SKILLS.map((skill) => ({
      id: masteryBadgeId(skill.id),
      name: `Dominio: ${skill.name}`,
      description: `Domina «${skill.name}» en Mi camino`,
      icon: skill.icon,
      unlocked: false,
    })),
    ...MASTERY_AREA_SETS.map((set) => {
      const area = SKILL_AREAS[set.areaId];
      return {
        id: areaBadgeId(set.areaId),
        name: `Área: ${area.name}`,
        description: `Domina todas las habilidades del área «${area.name}»`,
        icon: area.icon,
        unlocked: false,
      };
    }),
  ];
}

/**
 * Insignias ganadas que aún no están en `existingIds` (fusión por ID:
 * nunca duplica). Devuelve achievements listos para añadir, ya desbloqueados.
 */
export function newMasteryAchievements(
  progress: Record<string, SkillProgress>,
  existingIds: ReadonlySet<string>,
  now: Date = new Date(),
): Achievement[] {
  const earned = evaluateMasteryAchievements(progress, now);
  return masteryAchievementCatalog()
    .filter((badge) => earned.has(badge.id) && !existingIds.has(badge.id))
    .map((badge) => ({ ...badge, unlocked: true, unlockedAt: now }));
}
