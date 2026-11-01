import type { ChildAttempt } from './childReport';
import type { SkillProgress, SkillState } from '../types';
import { SKILLS, skillIdForOperation, type Skill } from './skillCatalog';

// — Parámetros por defecto acordados en la revisión —

/** Ventana de intentos que se considera para valorar el dominio. */
export const DOMINANCE_WINDOW = 12;
/** Acierto mínimo dentro de la ventana para dominar. */
export const DOMINANCE_ACCURACY = 0.8;
/** Mínimo de intentos dentro de la ventana de 12 antes de poder dominar. */
export const DOMINANCE_MIN_ATTEMPTS = 10;
/** Nivel sube con 3 aciertos seguidos al primer intento. */
export const LEVEL_UP_STREAK = 3;
/** Nivel baja con 2 fallos seguidos. */
export const LEVEL_DOWN_STREAK = 2;
/** Intervalos del repaso espaciado en días. */
export const REVIEW_INTERVALS_DAYS = [1, 3, 7, 14];
/** Máximo de ejercicios consecutivos de la misma habilidad en una sesión. */
export const MAX_SAME_SKILL_IN_ROW = 3;
/** Tamaño de la sesión diaria. */
export const DAILY_SESSION_SIZE = 10;

/** Nivel de problema (1–10) a partir del nivel de habilidad (1–3): 3/6/9. */
export const SKILL_TO_PROBLEM_LEVEL = (skillLevel: number): number =>
  Math.min(10, Math.max(1, skillLevel * 3));

export function todayKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return todayKey(date);
}

export function createSkillProgress(now: Date = new Date()): SkillProgress {
  return {
    state: 'practicing',
    recentResults: [],
    streakCorrect: 0,
    streakWrong: 0,
    activeDays: [],
    reviewDueDate: null,
    reviewCount: 0,
    level: 1,
    updatedAt: now.toISOString(),
  };
}

function windowAccuracy(progress: SkillProgress): number | null {
  const results = progress.recentResults.slice(-DOMINANCE_WINDOW);
  if (results.length < DOMINANCE_MIN_ATTEMPTS) {
    return null;
  }
  const correct = results.filter((result) => result).length;
  return correct / results.length;
}

function reviewIntervalDays(reviewCount: number): number | null {
  const intervals = REVIEW_INTERVALS_DAYS;
  return reviewCount < intervals.length ? intervals[reviewCount] : null;
}

/**
 * Estado efectivo de la habilidad. 'locked' se deriva de los prerrequisitos;
 * el resto se calcula desde el progreso guardado.
 */
export function deriveSkillState(
  progress: SkillProgress,
  prerequisitesMet: boolean,
  today: Date = new Date(),
): SkillState {
  if (!prerequisitesMet) {
    return 'locked';
  }
  if (progress.state === 'dominated' || (progress.state === 'review' && progress.reviewDueDate !== null)) {
    // Dominio alcanzado: pasa a repaso cuando toca, o sigue dominada.
    const due = progress.reviewDueDate;
    if (due !== null && todayKey(today) >= due) {
      return 'review';
    }
    return 'dominated';
  }

  const accuracy = windowAccuracy(progress);
  const twoDistinctDays = new Set(progress.activeDays).size >= 2;
  if (accuracy !== null && accuracy >= DOMINANCE_ACCURACY && twoDistinctDays) {
    return 'dominated';
  }
  if (progress.recentResults.length > 0) {
    return 'practicing';
  }
  return 'practicing';
}

/** Registra un intento y devuelve el progreso nuevo (funciones puras, inmutable). */
export function recordSkillAttempt(
  progress: SkillProgress | undefined,
  attempt: { isCorrect: boolean; isFirstTry: boolean; date?: Date },
): SkillProgress {
  const date = attempt.date ?? new Date();
  const day = todayKey(date);
  const base: SkillProgress = progress ?? createSkillProgress(date);

  const recentResults = [...base.recentResults, attempt.isCorrect].slice(-DOMINANCE_WINDOW);
  let streakCorrect = attempt.isCorrect && attempt.isFirstTry ? base.streakCorrect + 1 : base.streakCorrect;
  let streakWrong = !attempt.isCorrect ? base.streakWrong + 1 : 0;
  let level = base.level;

  if (streakCorrect >= LEVEL_UP_STREAK) {
    level = Math.min(3, level + 1);
    streakCorrect = 0;
  }
  if (streakWrong >= LEVEL_DOWN_STREAK) {
    level = Math.max(1, level - 1);
    streakWrong = 0;
  }

  const activeDays = base.activeDays.includes(day) ? base.activeDays : [...base.activeDays, day].slice(-60);

  const next: SkillProgress = {
    ...base,
    recentResults,
    streakCorrect,
    streakWrong,
    level,
    activeDays,
    updatedAt: date.toISOString(),
  };

  // Dominio recién alcanzado: programar el primer repaso.
  const accuracy = windowAccuracy(next);
  const twoDistinctDays = new Set(next.activeDays).size >= 2;
  const alreadyDominated = base.state === 'dominated' || base.state === 'review';
  if (!alreadyDominated && accuracy !== null && accuracy >= DOMINANCE_ACCURACY && twoDistinctDays) {
    const interval = reviewIntervalDays(0);
    return {
      ...next,
      state: 'review',
      reviewCount: 0,
      reviewDueDate: interval !== null ? addDays(day, interval) : null,
    };
  }

  // Repaso completado a tiempo: programar el siguiente intervalo.
  if (alreadyDominated && next.reviewDueDate !== null && day >= next.reviewDueDate && attempt.isCorrect && attempt.isFirstTry) {
    const reviewCount = Math.min(next.reviewCount + 1, REVIEW_INTERVALS_DAYS.length);
    const interval = reviewIntervalDays(reviewCount);
    return {
      ...next,
      state: 'dominated',
      reviewCount,
      reviewDueDate: interval !== null ? addDays(day, interval) : null,
    };
  }

  return next;
}

/** Fusión local/remoto: para cada habilidad gana el registro con updatedAt más reciente. */
export function mergeSkillProgress(
  local: Record<string, SkillProgress>,
  remote: Record<string, SkillProgress> | undefined,
): Record<string, SkillProgress> {
  if (!remote) {
    return local;
  }
  const merged: Record<string, SkillProgress> = { ...local };
  for (const [skillId, remoteProgress] of Object.entries(remote)) {
    const localProgress = merged[skillId];
    if (!localProgress || new Date(remoteProgress.updatedAt) > new Date(localProgress.updatedAt)) {
      merged[skillId] = remoteProgress;
    }
  }
  return merged;
}

/**
 * Inicializa el progreso de un usuario actual a partir de su historial de
 * intentos (ChildAttempt), para que nadie empiece de cero.
 */
export function initializeSkillProgressFromAttempts(attempts: ChildAttempt[]): Record<string, SkillProgress> {
  const progress: Record<string, SkillProgress> = {};
  for (const attempt of attempts) {
    const skillId = skillIdForOperation(attempt.operation as never);
    if (!skillId) {
      continue;
    }
    progress[skillId] = recordSkillAttempt(progress[skillId], {
      isCorrect: attempt.isCorrect,
      isFirstTry: true,
      date: new Date(attempt.createdAt),
    });
  }
  return progress;
}

/** Prerrequisitos cumplidos: todos dominados o en repaso (las T1 no tienen prerrequisitos). */
export function prerequisitesMet(skill: Skill, progress: Record<string, SkillProgress>): boolean {
  return skill.prerequisites.every((prerequisiteId) => {
    const prerequisiteProgress = progress[prerequisiteId];
    if (!prerequisiteProgress) {
      return false;
    }
    const state = deriveSkillState(prerequisiteProgress, true);
    return state === 'dominated' || state === 'review';
  });
}

/** Para las habilidades T1 (sin prerrequisitos) el acceso es libre desde el principio. */
export function isSkillUnlocked(skill: Skill, progress: Record<string, SkillProgress>): boolean {
  return prerequisitesMet(skill, progress);
}

export interface SessionEntry {
  skillId: string;
  state: SkillState;
}

/**
 * Sesión diaria de 10 ejercicios: primero repaso pendiente, luego habilidades
 * en práctica, y por último novedades desbloqueadas. Nunca más de
 * MAX_SAME_SKILL_IN_ROW ejercicios consecutivos de la misma habilidad.
 */
export function buildDailySession(
  progress: Record<string, SkillProgress>,
  options: { count?: number; today?: Date } = {},
): string[] {
  const count = options.count ?? DAILY_SESSION_SIZE;
  const today = options.today ?? new Date();

  const dueReviews: string[] = [];
  const inProgress: string[] = [];

  for (const skill of SKILLS) {
    const state = deriveSkillState(progress[skill.id] ?? createSkillProgress(today), prerequisitesMet(skill, progress), today);
    if (state === 'review') {
      dueReviews.push(skill.id);
    } else if (state === 'practicing') {
      inProgress.push(skill.id);
    }
    // Las dominadas no entran; las bloqueadas se abren al dominar sus prerrequisitos.
  }

  const pool: string[] = [...dueReviews, ...inProgress];
  if (pool.length === 0) {
    // Sin habilidades abiertas (p. ej. usuario nuevo sin progreso): empezar por las T1.
    pool.push(...SKILLS.filter((skill) => skill.prerequisites.length === 0).map((skill) => skill.id));
  }

  const session: string[] = [];
  let consecutiveSame = 0;
  let lastSkillId: string | null = null;

  while (session.length < count) {
    const before = pool.length;
    let pickedIndex = -1;
    for (let index = 0; index < pool.length; index += 1) {
      const skillId = pool[index];
      if (skillId === lastSkillId && consecutiveSame >= MAX_SAME_SKILL_IN_ROW) {
        continue;
      }
      pickedIndex = index;
      break;
    }
    if (pickedIndex === -1) {
      pickedIndex = 0;
    }
    const skillId = pool[pickedIndex];
    if (before === 0) {
      break;
    }
    session.push(skillId);
    consecutiveSame = skillId === lastSkillId ? consecutiveSame + 1 : 1;
    lastSkillId = skillId;
    // Rotación: la habilidad usada va al final para no repetirla en exceso.
    pool.splice(pickedIndex, 1);
    pool.push(skillId);
  }

  return session;
}

/** Práctica asociada a una habilidad: su primera operación es representativa del modo. */
export function representativeOperationForSkill(skill: Skill): string {
  return skill.operations[0];
}
