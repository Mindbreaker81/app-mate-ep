import type { DetailedStats, WeeklyProgress, OperationStats, SessionRecord } from '../types';

export function initializeStats(): DetailedStats {
  return {
    weeklyProgress: [],
    averageTime: 0,
    operationStats: {
      addition: { total: 0, correct: 0, averageTime: 0, difficulty: 'easy' },
      subtraction: { total: 0, correct: 0, averageTime: 0, difficulty: 'easy' },
      multiplication: { total: 0, correct: 0, averageTime: 0, difficulty: 'easy' },
      division: { total: 0, correct: 0, averageTime: 0, difficulty: 'easy' }
    },
    difficultyStats: {
      easy: { total: 0, correct: 0 },
      medium: { total: 0, correct: 0 },
      hard: { total: 0, correct: 0 }
    },
    sessionHistory: []
  };
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
  const existingWeek = stats.weeklyProgress.find(w => w.week === currentWeek);
  
  if (existingWeek) {
    existingWeek.totalAnswers++;
    if (isCorrect) existingWeek.correctAnswers++;
    existingWeek.averageTime = (existingWeek.averageTime + timeSpent) / 2;
  } else {
    stats.weeklyProgress.push({
      week: currentWeek,
      totalAnswers: 1,
      correctAnswers: isCorrect ? 1 : 0,
      averageTime: timeSpent
    });
  }
  
  return stats;
}

export function updateOperationStats(
  stats: DetailedStats,
  operation: string,
  isCorrect: boolean,
  timeSpent: number,
  difficulty: 'easy' | 'medium' | 'hard'
): DetailedStats {
  const opKey = operation as keyof OperationStats;
  if (stats.operationStats[opKey]) {
    stats.operationStats[opKey].total++;
    if (isCorrect) stats.operationStats[opKey].correct++;
    stats.operationStats[opKey].averageTime = 
      (stats.operationStats[opKey].averageTime + timeSpent) / 2;
    stats.operationStats[opKey].difficulty = difficulty;
  }
  
  return stats;
}

export function updateDifficultyStats(
  stats: DetailedStats,
  difficulty: 'easy' | 'medium' | 'hard',
  isCorrect: boolean
): DetailedStats {
  stats.difficultyStats[difficulty].total++;
  if (isCorrect) stats.difficultyStats[difficulty].correct++;
  return stats;
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
    ...sessionData
  };
  
  stats.sessionHistory.push(record);
  
  // Mantener solo los últimos 30 registros
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
  let weakest = operations[0];
  
  for (const [operation, data] of operations) {
    if (data.total === 0) continue;
    const accuracy = data.correct / data.total;
    const weakestAccuracy = weakest[1].correct / weakest[1].total;
    
    if (accuracy < weakestAccuracy) {
      weakest = [operation, data];
    }
  }
  
  return weakest[0];
}

export function getWeeklyProgressData(stats: DetailedStats): WeeklyProgress[] {
  return stats.weeklyProgress.slice(-8); // Últimas 8 semanas
} 