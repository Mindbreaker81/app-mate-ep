import { formatOperationLabel } from './operationLabels';
import { CONTENT_STAGE_ORDER, contentStageFor, type ContentStage } from './contentStage';

export interface ChildAttempt {
  operation: string;
  grade: string;
  isCorrect: boolean;
  timeSpent: number;
  createdAt: string;
}

export interface OperationBreakdown {
  operation: string;
  /** Tramo del contenido derivado de la operación (null si no está en el catálogo). */
  contentStage: ContentStage | null;
  total: number;
  correct: number;
  failed: number;
  accuracy: number;
  avgTime: number;
}

export interface GradeBreakdown {
  grade: string;
  operations: OperationBreakdown[];
}

export interface StageBreakdown {
  /** Tramo del contenido; null agrupa operaciones fuera del catálogo. */
  stage: ContentStage | null;
  operations: OperationBreakdown[];
  total: number;
  correct: number;
  accuracy: number;
}

export type AdvisoryKind = 'reinforce' | 'strength' | 'inactive';

export interface Advisory {
  kind: AdvisoryKind;
  message: string;
  operation?: string;
  accuracy?: number;
  total?: number;
}

export interface ChildReport {
  /** Desglose por curso elegido (el selector del modo libre). */
  byGrade: GradeBreakdown[];
  /** Desglose por tramo del contenido, derivado de la operación. */
  byStage: StageBreakdown[];
  advisories: Advisory[];
  lastActivity: string | null;
}

const MIN_ATTEMPTS_FOR_ADVISORY = 8;
const REINFORCE_BELOW = 60;
const STRENGTH_FROM = 85;
const INACTIVE_AFTER_DAYS = 14;
const GRADE_ORDER = ['4t', '5e', '6e'];

function accuracyOf(correct: number, total: number): number {
  return total > 0 ? Math.round((correct / total) * 100) : 0;
}

interface OpAggregate {
  total: number;
  correct: number;
  time: number;
}

function bump(map: Map<string, OpAggregate>, key: string, attempt: ChildAttempt): void {
  const op = map.get(key) ?? { total: 0, correct: 0, time: 0 };
  op.total += 1;
  op.correct += attempt.isCorrect ? 1 : 0;
  op.time += attempt.timeSpent;
  map.set(key, op);
}

function toOperationBreakdown(
  operation: string,
  data: OpAggregate,
  contentStage: ContentStage | null,
): OperationBreakdown {
  return {
    operation,
    contentStage,
    total: data.total,
    correct: data.correct,
    failed: data.total - data.correct,
    accuracy: accuracyOf(data.correct, data.total),
    avgTime: Math.round(data.time / data.total),
  };
}

export function buildChildReport(attempts: ChildAttempt[], now: Date = new Date()): ChildReport {
  const byGradeMap = new Map<string, Map<string, OpAggregate>>();
  const byStageMap = new Map<ContentStage | null, Map<string, OpAggregate>>();
  const byOperation = new Map<string, { total: number; correct: number }>();
  let lastActivity: string | null = null;

  for (const attempt of attempts) {
    let gradeOps = byGradeMap.get(attempt.grade);
    if (!gradeOps) {
      gradeOps = new Map();
      byGradeMap.set(attempt.grade, gradeOps);
    }
    bump(gradeOps, attempt.operation, attempt);

    const stage = contentStageFor(attempt.grade, attempt.operation);
    let stageOps = byStageMap.get(stage);
    if (!stageOps) {
      stageOps = new Map();
      byStageMap.set(stage, stageOps);
    }
    bump(stageOps, attempt.operation, attempt);

    const overall = byOperation.get(attempt.operation) ?? { total: 0, correct: 0 };
    overall.total += 1;
    overall.correct += attempt.isCorrect ? 1 : 0;
    byOperation.set(attempt.operation, overall);

    if (!lastActivity || attempt.createdAt > lastActivity) {
      lastActivity = attempt.createdAt;
    }
  }

  const byGrade: GradeBreakdown[] = [...byGradeMap.entries()]
    .sort(([a], [b]) => GRADE_ORDER.indexOf(a) - GRADE_ORDER.indexOf(b))
    .map(([grade, ops]) => ({
      grade,
      operations: [...ops.entries()]
        .map(([operation, data]) => toOperationBreakdown(operation, data, contentStageFor(grade, operation)))
        .sort((a, b) => b.total - a.total),
    }));

  const byStage: StageBreakdown[] = [...byStageMap.entries()]
    .sort(([a], [b]) => {
      const indexA = a === null ? CONTENT_STAGE_ORDER.length : CONTENT_STAGE_ORDER.indexOf(a);
      const indexB = b === null ? CONTENT_STAGE_ORDER.length : CONTENT_STAGE_ORDER.indexOf(b);
      return indexA - indexB;
    })
    .map(([stage, ops]) => {
      const operations = [...ops.entries()]
        .map(([operation, data]) => toOperationBreakdown(operation, data, stage))
        .sort((a, b) => b.total - a.total);
      const total = operations.reduce((sum, op) => sum + op.total, 0);
      const correct = operations.reduce((sum, op) => sum + op.correct, 0);
      return { stage, operations, total, correct, accuracy: accuracyOf(correct, total) };
    });

  const advisories: Advisory[] = [];

  for (const [operation, data] of byOperation) {
    if (data.total < MIN_ATTEMPTS_FOR_ADVISORY) continue;
    const accuracy = accuracyOf(data.correct, data.total);
    const label = formatOperationLabel(operation).toLowerCase();
    if (accuracy < REINFORCE_BELOW) {
      advisories.push({
        kind: 'reinforce',
        operation,
        accuracy,
        total: data.total,
        message: `Reforzar ${label}: ${accuracy} % de aciertos en ${data.total} intentos.`,
      });
    } else if (accuracy >= STRENGTH_FROM) {
      advisories.push({
        kind: 'strength',
        operation,
        accuracy,
        total: data.total,
        message: `Va muy bien en ${label}: ${accuracy} % de aciertos en ${data.total} intentos.`,
      });
    }
  }

  // Refuerzos primero (lo más urgente), luego fortalezas, peor precisión antes
  advisories.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === 'reinforce' ? -1 : 1;
    return (a.accuracy ?? 0) - (b.accuracy ?? 0);
  });

  if (lastActivity) {
    const days = Math.floor((now.getTime() - new Date(lastActivity).getTime()) / 86_400_000);
    if (days >= INACTIVE_AFTER_DAYS) {
      advisories.push({
        kind: 'inactive',
        message: `Sin actividad desde hace ${days} días.`,
      });
    }
  }

  return { byGrade, byStage, advisories, lastActivity };
}
