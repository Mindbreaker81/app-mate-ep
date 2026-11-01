import type { AttemptRecord } from '../services/adminService';
import type { Operation } from '../types';
import { skillIdForOperation, getSkillById, type SkillTier } from './skillCatalog';
import { contentStageForTier, contentStageLabel } from './contentStage';

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
