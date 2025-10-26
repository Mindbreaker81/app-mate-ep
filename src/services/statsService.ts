import { supabase } from '../lib/supabaseClient';
import type { DetailedStats, OperationKey } from '../types';
import { OPERATION_KEYS } from '../types';
import { initializeStats, updateWeeklyProgress, updateOperationStats, updateDifficultyStats, normalizeStats } from '../utils/statsUtils';
import { getDifficulty } from '../utils/problemGenerator';
import { recordSyncAnomaly } from './instrumentationService';

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
    console.error('[statsService] Error al cargar estadísticas:', error);
    recordSyncAnomaly('supabase-fetch-error', {
      message: error.message,
      code: error.code,
    });
    return null;
  }

  let stats = initializeStats();
  if (!data || data.length === 0) {
    return stats;
  }

  let totalTime = 0;
  let attemptsCount = 0;

  (data as DbAttemptRow[]).forEach((attempt) => {
    if (!OPERATION_KEYS.includes(attempt.operation as OperationKey)) {
      recordSyncAnomaly('unknown-operation', {
        operation: attempt.operation,
        createdAt: attempt.created_at,
      });
      return;
    }

    const difficulty = getDifficulty(attempt.level, attempt.operation);
    // Las funciones son inmutables: retornan nuevos objetos
    stats = updateWeeklyProgress(stats, attempt.is_correct, attempt.time_spent);
    stats = updateOperationStats(stats, attempt.operation, attempt.is_correct, attempt.time_spent, difficulty);
    stats = updateDifficultyStats(stats, difficulty, attempt.is_correct);
    totalTime += attempt.time_spent;
    attemptsCount += 1;
  });

  stats.averageTime = attemptsCount ? Math.round(totalTime / attemptsCount) : 0;

  return normalizeStats(stats);
}
