import { describe, expect, it } from 'vitest';
import { ACHIEVEMENTS } from '../gameConfig';
import { evaluateAchievements, hasExploredAllFifthGradeModes } from '../achievementEngine';
import { initializeStats, updateOperationStats } from '../statsUtils';
import type { Operation } from '../../types';

function buildStatsWithCorrect(operations: Operation[]) {
  let stats = initializeStats();
  operations.forEach((operation) => {
    stats = updateOperationStats(stats, operation, true, 2, 'medium');
  });
  return stats;
}

describe('achievementEngine v3', () => {
  it('unlocks integer_master after 10 integer exercises', () => {
    const stats = buildStatsWithCorrect([
      'integer-addition',
      'integer-addition',
      'integer-subtraction',
      'integer-multiplication',
      'integer-division',
      'integer-compare',
      'integer-order',
      'integer-addition',
      'integer-subtraction',
      'integer-multiplication',
    ]);
    const achievement = ACHIEVEMENTS.find((item) => item.id === 'integer_master');
    expect(achievement).toBeDefined();
    if (!achievement) return;

    expect(
      evaluateAchievements({
        achievement,
        isCorrect: true,
        newCorrectExercises: 10,
        newScore: 10,
        newStreak: 1,
        newLevel: 1,
        stats,
        timeMode: 'no-limit',
        timedCorrectExercises: 0,
      }),
    ).toBe(true);
  });

  it('unlocks stats_complete when mean, median, mode and range are correct', () => {
    const stats = buildStatsWithCorrect(['mean', 'median', 'mode', 'range']);
    const achievement = ACHIEVEMENTS.find((item) => item.id === 'stats_complete');
    expect(achievement).toBeDefined();
    if (!achievement) return;

    expect(
      evaluateAchievements({
        achievement,
        isCorrect: true,
        newCorrectExercises: 4,
        newScore: 4,
        newStreak: 1,
        newLevel: 1,
        stats,
        timeMode: 'no-limit',
        timedCorrectExercises: 0,
      }),
    ).toBe(true);
  });

  it('requires all fifth grade sample operations for all_modes_explorer', () => {
    const partialStats = buildStatsWithCorrect(['decimal-addition', 'word-problem']);
    expect(hasExploredAllFifthGradeModes(partialStats)).toBe(false);
  });
});
