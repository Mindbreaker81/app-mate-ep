import { formatOperationLabel } from './operationLabels';

export interface ChildAttempt {
  operation: string;
  grade: string;
  isCorrect: boolean;
  timeSpent: number;
  createdAt: string;
}

export interface OperationBreakdown {
  operation: string;
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

export type AdvisoryKind = 'reinforce' | 'strength' | 'inactive';

export interface Advisory {
  kind: AdvisoryKind;
  message: string;
  operation?: string;
  accuracy?: number;
  total?: number;
}

export interface ChildReport {
  byGrade: GradeBreakdown[];
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

export function buildChildReport(attempts: ChildAttempt[], now: Date = new Date()): ChildReport {
  const byGradeMap = new Map<string, Map<string, { total: number; correct: number; time: number }>>();
  const byOperation = new Map<string, { total: number; correct: number }>();
  let lastActivity: string | null = null;

  for (const attempt of attempts) {
    let gradeOps = byGradeMap.get(attempt.grade);
    if (!gradeOps) {
      gradeOps = new Map();
      byGradeMap.set(attempt.grade, gradeOps);
    }
    const op = gradeOps.get(attempt.operation) ?? { total: 0, correct: 0, time: 0 };
    op.total += 1;
    op.correct += attempt.isCorrect ? 1 : 0;
    op.time += attempt.timeSpent;
    gradeOps.set(attempt.operation, op);

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
        .map(([operation, data]) => ({
          operation,
          total: data.total,
          correct: data.correct,
          failed: data.total - data.correct,
          accuracy: accuracyOf(data.correct, data.total),
          avgTime: Math.round(data.time / data.total),
        }))
        .sort((a, b) => b.total - a.total),
    }));

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

  return { byGrade, advisories, lastActivity };
}
