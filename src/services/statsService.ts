import { supabase } from '../lib/supabaseClient';
import type { DetailedStats } from '../types';
import { initializeStats, updateWeeklyProgress, updateOperationStats, updateDifficultyStats, normalizeStats } from '../utils/statsUtils';
import { getDifficulty } from '../utils/problemGenerator';

type DbAttemptRow = {
  operation: string;
  is_correct: boolean;
  time_spent: number;
  level: number;
  created_at: string;
};

export async function fetchUserStats(userId: string): Promise<DetailedStats | null> {
  const { data, error } = await supabase
    .from('attempts')
    .select('operation, is_correct, time_spent, level, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) {
    console.warn('No se pudieron obtener estadísticas de Supabase:', error.message);
    return null;
  }

  const stats = initializeStats();
  if (!data) {
    return stats;
  }

  let totalTime = 0;
  let attemptsCount = 0;

  (data as DbAttemptRow[]).forEach((attempt) => {
    const difficulty = getDifficulty(attempt.level, attempt.operation);
    updateWeeklyProgress(stats, attempt.is_correct, attempt.time_spent);
    updateOperationStats(stats, attempt.operation, attempt.is_correct, attempt.time_spent, difficulty);
    updateDifficultyStats(stats, difficulty, attempt.is_correct);
    totalTime += attempt.time_spent;
    attemptsCount += 1;
  });

  stats.averageTime = attemptsCount ? Math.round(totalTime / attemptsCount) : 0;

  return normalizeStats(stats);
}
