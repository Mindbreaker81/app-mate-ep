import type { AttemptRecord } from '../services/adminService';
import type { AttemptSource, Operation, SkillProgress, SkillState } from '../types';
import {
  SKILL_AREAS,
  SKILLS,
  skillIdForOperation,
  getSkillById,
  type SkillAreaId,
  type SkillTier,
} from './skillCatalog';
import {
  CONTENT_STAGE_ORDER,
  contentStageFor,
  contentStageForTier,
  contentStageLabel,
  type ContentStage,
} from './contentStage';
import { deriveSkillState } from './skillProgress';
import { localDateKey } from './dailyGoal';
import { mondayOf } from './weeklyTrend';

export interface SkillReportRow {
  skillId: string;
  skillName: string;
  area: string;
  /** Tier del catálogo (1/2 ciclo 5.º–6.º, 3 ampliación ESO). */
  tier: SkillTier;
  total: number;
  correct: number;
  accuracy: number; // 0-100
  avgTime: number;
}

function emptyRow(skillId: string): SkillReportRow {
  const skill = getSkillById(skillId);
  return {
    skillId,
    skillName: skill?.name ?? skillId,
    area: skill ? skill.areaId : '',
    tier: skill?.tier ?? 1,
    total: 0,
    correct: 0,
    accuracy: 0,
    avgTime: 0,
  };
}

/** Agrega intentos por habilidad del catálogo (las operaciones sin habilidad se ignoran). */
export function buildSkillReport(attempts: AttemptRecord[]): SkillReportRow[] {
  const rows = new Map<string, SkillReportRow>();

  for (const attempt of attempts) {
    const skillId = skillIdForOperation(attempt.operation as Operation);
    if (!skillId) {
      continue;
    }
    const row = rows.get(skillId) ?? emptyRow(skillId);
    row.total += 1;
    row.correct += attempt.isCorrect ? 1 : 0;
    row.avgTime += attempt.timeSpent;
    rows.set(skillId, row);
  }

  return Array.from(rows.values())
    .map((row) => ({
      ...row,
      accuracy: row.total > 0 ? Math.round((row.correct / row.total) * 100) : 0,
      avgTime: row.total > 0 ? Math.round(row.avgTime / row.total) : 0,
    }))
    .sort((left, right) => right.total - left.total);
}

const SEPARATOR = ';'; // Excel/LibreOffice en es-ES esperan punto y coma
const BOM = '﻿';

function escapeField(value: string): string {
  if (value.includes(SEPARATOR) || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** CSV del informe por habilidad (BOM UTF-8, separador ;). */
export function skillReportToCsv(rows: SkillReportRow[]): string {
  const header = ['habilidad', 'área', 'tramo', 'intentos', 'correctos', 'acierto_%', 'tiempo_medio_s'].join(SEPARATOR);
  const lines = rows.map((row) =>
    [
      escapeField(row.skillName),
      escapeField(row.area),
      escapeField(contentStageLabel(contentStageForTier(row.tier))),
      String(row.total),
      String(row.correct),
      String(row.accuracy),
      String(row.avgTime),
    ].join(SEPARATOR),
  );
  return `${BOM}${[header, ...lines].join('\r\n')}\r\n`;
}

// — Panel familiar: dominio por habilidad y resumen semanal (PIT-30) —

/** Estado a mostrar en el panel: el del motor más «Sin empezar» (sin registro). */
export type MasteryStatus = SkillState | 'not-started';

export const MASTERY_STATUS_LABELS: Record<MasteryStatus, string> = {
  locked: 'Bloqueada',
  'not-started': 'Sin empezar',
  practicing: 'En práctica',
  dominated: 'Dominada',
  review: 'Repaso pendiente',
};

export interface SkillMasteryRow {
  skillId: string;
  name: string;
  icon: string;
  areaId: SkillAreaId;
  areaName: string;
  tier: SkillTier;
  status: MasteryStatus;
  /** Nivel 1–3 dentro de la habilidad (1 si aún no hay progreso). */
  level: number;
  /** Prerrequisitos todavía no dominados (vacío si la habilidad está abierta). */
  missingPrerequisites: string[];
  /** Fecha local YYYY-MM-DD en la que toca repaso (solo en estado review). */
  reviewDueDate: string | null;
  /** Último cambio del progreso de la habilidad (null si nunca se practicó). */
  updatedAt: string | null;
}

/**
 * Estado efectivo de cada habilidad del catálogo para el panel familiar,
 * derivado del progreso persistido (game_state.data.skills) con el mismo
 * motor que «Mi camino»: deriveSkillState + prerrequisitos. Sin registro de
 * progreso la habilidad queda «Sin empezar» (ausencia de datos), no suspenso.
 */
export function buildSkillMastery(
  skills: Record<string, SkillProgress>,
  today: Date = new Date(),
): SkillMasteryRow[] {
  return SKILLS.map((skill) => {
    const progress = skills[skill.id];
    // Misma regla que prerequisitesMet, pero con el `today` inyectado.
    const missingPrerequisites = skill.prerequisites.filter((prerequisiteId) => {
      const prerequisiteProgress = skills[prerequisiteId];
      if (!prerequisiteProgress) {
        return true;
      }
      const state = deriveSkillState(prerequisiteProgress, true, today);
      return state !== 'dominated' && state !== 'review';
    });
    const unlocked = missingPrerequisites.length === 0;
    const status: MasteryStatus = !unlocked
      ? 'locked'
      : progress
        ? deriveSkillState(progress, true, today)
        : 'not-started';
    return {
      skillId: skill.id,
      name: skill.name,
      icon: skill.icon,
      areaId: skill.areaId,
      areaName: SKILL_AREAS[skill.areaId].name,
      tier: skill.tier,
      status,
      level: progress?.level ?? 1,
      missingPrerequisites,
      reviewDueDate: status === 'review' ? progress?.reviewDueDate ?? null : null,
      updatedAt: progress?.updatedAt ?? null,
    };
  });
}

/** Habilidades con repaso pendiente hoy (mismo criterio que la sesión diaria). */
export function pendingReviews(mastery: SkillMasteryRow[]): SkillMasteryRow[] {
  return mastery.filter((row) => row.status === 'review');
}

/** Procedencia del intento en los informes familiares. */
export const ATTEMPT_SOURCE_LABELS: Record<AttemptSource, string> = {
  free: 'Modo libre',
  path: 'Mi camino',
  'daily-session': 'Sesión diaria',
  placement: 'Prueba de colocación',
};

const ATTEMPT_SOURCE_ORDER: AttemptSource[] = ['free', 'path', 'daily-session', 'placement'];

export interface WeeklySourceBreakdown {
  source: AttemptSource;
  total: number;
  correct: number;
}

export interface WeeklyStageBreakdown {
  /** Tramo del contenido; null agrupa operaciones fuera del catálogo. */
  stage: ContentStage | null;
  total: number;
  correct: number;
}

export interface WeeklySummary {
  /** Lunes de la semana actual, fecha local YYYY-MM-DD. */
  weekStart: string;
  total: number;
  correct: number;
  /** Porcentaje 0-100, o null si no hubo intentos esta semana. */
  accuracy: number | null;
  /** Desglose por procedencia, solo fuentes con intentos, en orden fijo. */
  bySource: WeeklySourceBreakdown[];
  /** Desglose por tramo del contenido, solo tramos con intentos. */
  byStage: WeeklyStageBreakdown[];
}

/**
 * Resumen de la semana en curso (lunes a domingo, fecha local) del niño:
 * totales y aciertos distinguiendo la procedencia (source) y el tramo del
 * contenido (contentStage). Los intentos históricos sin source cuentan como
 * modo libre, igual que en el resto de informes.
 */
export function buildWeeklySummary(attempts: AttemptRecord[], now: Date = new Date()): WeeklySummary {
  const weekStart = localDateKey(mondayOf(now));
  const bySource = new Map<AttemptSource, { total: number; correct: number }>();
  const byStage = new Map<ContentStage | null, { total: number; correct: number }>();
  let total = 0;
  let correct = 0;

  for (const attempt of attempts) {
    if (localDateKey(mondayOf(new Date(attempt.createdAt))) !== weekStart) {
      continue;
    }
    total += 1;
    correct += attempt.isCorrect ? 1 : 0;

    const source = attempt.source ?? 'free';
    const sourceBucket = bySource.get(source) ?? { total: 0, correct: 0 };
    sourceBucket.total += 1;
    sourceBucket.correct += attempt.isCorrect ? 1 : 0;
    bySource.set(source, sourceBucket);

    const stage = contentStageFor(attempt.grade, attempt.operation, attempt.source);
    const stageBucket = byStage.get(stage) ?? { total: 0, correct: 0 };
    stageBucket.total += 1;
    stageBucket.correct += attempt.isCorrect ? 1 : 0;
    byStage.set(stage, stageBucket);
  }

  return {
    weekStart,
    total,
    correct,
    accuracy: total > 0 ? Math.round((correct / total) * 100) : null,
    bySource: ATTEMPT_SOURCE_ORDER.filter((source) => bySource.has(source)).map((source) => ({
      source,
      ...bySource.get(source)!,
    })),
    byStage: [...byStage.entries()]
      .sort(([a], [b]) => {
        const indexA = a === null ? CONTENT_STAGE_ORDER.length : CONTENT_STAGE_ORDER.indexOf(a);
        const indexB = b === null ? CONTENT_STAGE_ORDER.length : CONTENT_STAGE_ORDER.indexOf(b);
        return indexA - indexB;
      })
      .map(([stage, bucket]) => ({ stage, ...bucket })),
  };
}
