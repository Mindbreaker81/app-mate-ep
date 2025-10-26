import type {
  DetailedStats,
  WeeklyProgress,
  OperationStats,
  SessionRecord,
  OperationDetail,
  OperationKey,
} from '../types';
import { OPERATION_KEYS } from '../types';

const createOperationDetail = (): OperationDetail => ({
  total: 0,
  correct: 0,
  averageTime: 0,
  difficulty: 'easy',
});

export function normalizeStats(stats?: Partial<DetailedStats> | null): DetailedStats {
  const base: DetailedStats = {
    weeklyProgress: stats?.weeklyProgress ? [...stats.weeklyProgress] : [],
    averageTime: stats?.averageTime ?? 0,
    operationStats: {} as OperationStats,
    difficultyStats: {
      easy: { total: 0, correct: 0 },
      medium: { total: 0, correct: 0 },
      hard: { total: 0, correct: 0 },
    },
    sessionHistory: stats?.sessionHistory
      ? stats.sessionHistory.map((record) => ({ ...record }))
      : [],
  };

  if (stats?.difficultyStats) {
    base.difficultyStats.easy = {
      total: stats.difficultyStats.easy?.total ?? 0,
      correct: stats.difficultyStats.easy?.correct ?? 0,
    };
    base.difficultyStats.medium = {
      total: stats.difficultyStats.medium?.total ?? 0,
      correct: stats.difficultyStats.medium?.correct ?? 0,
    };
    base.difficultyStats.hard = {
      total: stats.difficultyStats.hard?.total ?? 0,
      correct: stats.difficultyStats.hard?.correct ?? 0,
    };
  }

  OPERATION_KEYS.forEach((key) => {
    const existing = stats?.operationStats?.[key];
    base.operationStats[key] = existing
      ? {
          total: existing.total ?? 0,
          correct: existing.correct ?? 0,
          averageTime: existing.averageTime ?? 0,
          difficulty: existing.difficulty ?? 'easy',
        }
      : createOperationDetail();
  });

  return base;
}

export function initializeStats(): DetailedStats {
  return normalizeStats({
    weeklyProgress: [],
    averageTime: 0,
    operationStats: OPERATION_KEYS.reduce((acc, key) => {
      acc[key] = createOperationDetail();
      return acc;
    }, {} as OperationStats),
    difficultyStats: {
      easy: { total: 0, correct: 0 },
      medium: { total: 0, correct: 0 },
      hard: { total: 0, correct: 0 },
    },
    sessionHistory: [],
  });
}

export function getCurrentWeek(): string {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil(days / 7);
  return `${now.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
}

export function updateWeeklyProgress(
  stats: DetailedStats,
  isCorrect: boolean,
  timeSpent: number
): DetailedStats {
  const currentWeek = getCurrentWeek();
  const existingWeekIndex = stats.weeklyProgress.findIndex((w) => w.week === currentWeek);

  // Crear copia del array weeklyProgress
  const newWeeklyProgress = [...stats.weeklyProgress];

  if (existingWeekIndex !== -1) {
    // Crear copia del objeto week y actualizar
    const existingWeek = newWeeklyProgress[existingWeekIndex];
    const previousTotal = existingWeek.totalAnswers;
    newWeeklyProgress[existingWeekIndex] = {
      ...existingWeek,
      totalAnswers: existingWeek.totalAnswers + 1,
      correctAnswers: existingWeek.correctAnswers + (isCorrect ? 1 : 0),
      averageTime: Math.round(
        ((existingWeek.averageTime * previousTotal) + timeSpent) / (existingWeek.totalAnswers + 1)
      ),
    };
  } else {
    // Agregar nueva semana
    newWeeklyProgress.push({
      week: currentWeek,
      totalAnswers: 1,
      correctAnswers: isCorrect ? 1 : 0,
      averageTime: timeSpent,
    });
  }

  return {
    ...stats,
    weeklyProgress: newWeeklyProgress,
  };
}

export function updateOperationStats(
  stats: DetailedStats,
  operation: string,
  isCorrect: boolean,
  timeSpent: number,
  difficulty: 'easy' | 'medium' | 'hard'
): DetailedStats {
  const opKey = operation as OperationKey;
  const existingDetail = stats.operationStats[opKey] || createOperationDetail();

  const previousTotal = existingDetail.total;
  const newTotal = existingDetail.total + 1;

  // Crear copia del operationStats con el detalle actualizado
  return {
    ...stats,
    operationStats: {
      ...stats.operationStats,
      [opKey]: {
        total: newTotal,
        correct: existingDetail.correct + (isCorrect ? 1 : 0),
        averageTime: Math.round(((existingDetail.averageTime * previousTotal) + timeSpent) / newTotal),
        difficulty,
      },
    },
  };
}

export function updateDifficultyStats(
  stats: DetailedStats,
  difficulty: 'easy' | 'medium' | 'hard',
  isCorrect: boolean
): DetailedStats {
  const existingDiff = stats.difficultyStats[difficulty];
  
  // Crear copia del difficultyStats con el nivel actualizado
  return {
    ...stats,
    difficultyStats: {
      ...stats.difficultyStats,
      [difficulty]: {
        total: existingDiff.total + 1,
        correct: existingDiff.correct + (isCorrect ? 1 : 0),
      },
    },
  };
}

export function addSessionRecord(
  stats: DetailedStats,
  sessionData: {
    score: number;
    totalExercises: number;
    correctExercises: number;
    averageTime: number;
    operations: string[];
  }
): DetailedStats {
  const record: SessionRecord = {
    date: new Date(),
    ...sessionData,
  };

  stats.sessionHistory.push(record);

  if (stats.sessionHistory.length > 30) {
    stats.sessionHistory = stats.sessionHistory.slice(-30);
  }

  return stats;
}

export function getAccuracyPercentage(correct: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}

export function getWeakestOperation(stats: DetailedStats): string {
  const operations = Object.entries(stats.operationStats);
  let weakest: [string, OperationDetail] | null = null;

  for (const [operation, data] of operations) {
    if (data.total === 0) continue;
    const accuracy = data.correct / data.total;
    if (!weakest) {
      weakest = [operation, data];
      continue;
    }
    const weakestAccuracy = weakest[1].correct / weakest[1].total;
    if (accuracy < weakestAccuracy) {
      weakest = [operation, data];
    }
  }

  return weakest ? weakest[0] : OPERATION_KEYS[0];
}

export function getWeeklyProgressData(stats: DetailedStats): WeeklyProgress[] {
  return stats.weeklyProgress.slice(-8);
}