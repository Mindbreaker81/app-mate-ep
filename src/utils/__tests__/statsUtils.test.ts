import { describe, it, expect } from 'vitest';
import { initializeStats, updateWeeklyProgress, updateOperationStats, updateDifficultyStats, getAccuracyPercentage } from '../statsUtils';

describe('statsUtils', () => {
  it('initializeStats should start with zeros', () => {
    const s = initializeStats();
    expect(s.averageTime).toBe(0);
    expect(s.weeklyProgress.length).toBe(0);
    expect(s.operationStats.addition.total).toBe(0);
    expect(s.difficultyStats.easy.total).toBe(0);
  });

  it('updateWeeklyProgress should increment totals', () => {
    let s = initializeStats();
    s = updateWeeklyProgress(s, true, 5);
    s = updateWeeklyProgress(s, false, 7);

    const last = s.weeklyProgress.at(-1)!;
    expect(last.totalAnswers).toBeGreaterThanOrEqual(2);
    expect(last.correctAnswers).toBeGreaterThanOrEqual(1);
  });

  it('updateOperationStats should count operations', () => {
    let s = initializeStats();
    s = updateOperationStats(s, 'addition', true, 3, 'easy');
    expect(s.operationStats.addition.total).toBe(1);
    expect(s.operationStats.addition.correct).toBe(1);
  });

  it('updateDifficultyStats should count difficulty buckets', () => {
    let s = initializeStats();
    s = updateDifficultyStats(s, 'medium', true);
    expect(s.difficultyStats.medium.total).toBe(1);
    expect(s.difficultyStats.medium.correct).toBe(1);
  });

  it('getAccuracyPercentage should compute correctly', () => {
    expect(getAccuracyPercentage(7, 10)).toBe(70);
    expect(getAccuracyPercentage(0, 0)).toBe(0);
  });
});
