import type { Operation } from '../types';
import { getSkillById, skillIdForOperation, type SkillTier } from './skillCatalog';

/**
 * Tramo curricular del contenido de un intento.
 *
 * No es el curso elegido (`attempts.grade`, que se conserva tal cual): se deriva
 * de `attempts.operation` vía el catálogo de habilidades, así que también sirve
 * para los intentos históricos sin migración.
 *
 * - `review-4`: repaso de 4.º (curso elegido 4.º con contenido T1).
 * - `cycle-start` / `cycle-consolidation`: ciclo 5.º–6.º en conjunto (T1/T2);
 *   nunca se atribuyen a un solo curso.
 * - `eso-extension`: T3 «Ampliació ESO»; nunca se presenta como 5.º ni 6.º.
 */
export type ContentStage = 'review-4' | 'cycle-start' | 'cycle-consolidation' | 'eso-extension';

const STAGE_BY_TIER: Record<SkillTier, ContentStage> = {
  1: 'cycle-start',
  2: 'cycle-consolidation',
  3: 'eso-extension',
};

export const CONTENT_STAGE_LABELS: Record<ContentStage, string> = {
  'review-4': 'Repaso de 4.º',
  'cycle-start': 'Inicio del ciclo 5.º–6.º',
  'cycle-consolidation': 'Consolidación del ciclo 5.º–6.º',
  'eso-extension': 'Ampliación ESO',
};

/** Orden de presentación de los tramos en los informes (desconocido al final). */
export const CONTENT_STAGE_ORDER: ContentStage[] = [
  'review-4',
  'cycle-start',
  'cycle-consolidation',
  'eso-extension',
];

/**
 * Tramo del contenido de un intento a partir de su operación (y del curso
 * elegido solo para distinguir el repaso de 4.º).
 *
 * El modo libre de 4.º solo genera operaciones T1, así que `grade === '4t'` con
 * una operación T1 es repaso de 4.º; si la operación es T2/T3 solo pudo venir
 * de «Mi camino» y manda el tramo de la habilidad. Devuelve `null` cuando la
 * operación no está en el catálogo (texto libre histórico).
 */
export function contentStageFor(grade: string, operation: string): ContentStage | null {
  const skillId = skillIdForOperation(operation as Operation);
  const skill = skillId ? getSkillById(skillId) : null;
  if (!skill) {
    return null;
  }
  if (grade === '4t' && skill.tier === 1) {
    return 'review-4';
  }
  return STAGE_BY_TIER[skill.tier];
}

/** Tramo de una habilidad del catálogo por su tier (sin contexto de intento). */
export function contentStageForTier(tier: SkillTier): ContentStage {
  return STAGE_BY_TIER[tier];
}

export function contentStageLabel(stage: ContentStage | null): string {
  return stage === null ? 'Sin clasificar' : CONTENT_STAGE_LABELS[stage];
}
