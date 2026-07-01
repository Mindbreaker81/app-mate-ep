import { describe, expect, it } from 'vitest';
import { ACHIEVEMENTS, GRADE_CONFIGS } from '../gameConfig';
import { generateProblem } from '../problemGenerator';
import { getPracticeModesForGrade } from '../practiceConfig';
import {
  answersMatch,
  isIntegerArithmeticProblem,
  isIntegerCompareProblem,
  isIntegerOrderProblem,
  isProbabilityProblem,
  isPromptProblem,
  isSimpleEquationProblem,
} from '../problemUtils';

describe('6th grade curriculum', () => {
  it('exposes 57 operations in 6th grade config', () => {
    expect(GRADE_CONFIGS['6e'].availableOperations).toHaveLength(57);
  });

  it('includes 26 practice modes for 6th grade', () => {
    expect(getPracticeModesForGrade('6e')).toHaveLength(26);
  });

  it('generates integer problems only in 6th grade', () => {
    const problem = generateProblem(5, 'integers', '6e');
    expect(
      isIntegerArithmeticProblem(problem) ||
        isIntegerCompareProblem(problem) ||
        isIntegerOrderProblem(problem),
    ).toBe(true);
  });

  it('does not expose integer operations to 4th grade', () => {
    for (let index = 0; index < 25; index += 1) {
      const problem = generateProblem(5, 'all', '4t');
      expect(problem.operation.startsWith('integer-')).toBe(false);
    }
  });

  it('does not expose integer operations to 5th grade', () => {
    for (let index = 0; index < 25; index += 1) {
      const problem = generateProblem(5, 'all', '5e');
      expect(problem.operation.startsWith('integer-')).toBe(false);
    }
  });

  it('generates simple equations in equations mode', () => {
    const problem = generateProblem(5, 'equations', '6e');
    expect(isSimpleEquationProblem(problem)).toBe(true);
    expect(typeof problem.answer).toBe('number');
  });

  it('generates ratio or proportion problems', () => {
    const problem = generateProblem(5, 'ratios', '6e');
    expect(isPromptProblem(problem)).toBe(true);
    expect(problem.operation === 'ratio' || problem.operation === 'proportion').toBe(true);
  });

  it('generates extended statistics in statistics mode', () => {
    const problem = generateProblem(5, 'statistics', '6e');
    expect(['mean', 'median', 'mode', 'range']).toContain(problem.operation);
  });

  it('generates probability with valid options', () => {
    const problem = generateProblem(5, 'probability', '6e');
    expect(isProbabilityProblem(problem)).toBe(true);
    if (!isProbabilityProblem(problem)) return;
    expect(problem.options).toContain(problem.answer);
  });

  it('validates probability answers numerically', () => {
    const problem = generateProblem(5, 'probability', '6e');
    if (!isProbabilityProblem(problem)) return;
    expect(answersMatch(problem, String(problem.answer))).toBe(true);
  });

  it('generates advanced geometry problems', () => {
    const problem = generateProblem(5, 'geometry-advanced', '6e');
    expect([
      'circle-area',
      'circle-circumference',
      'volume-rectangular-prism',
      'triangle-angle-sum',
    ]).toContain(problem.operation);
  });

  it('generates scale conversion problems', () => {
    const problem = generateProblem(5, 'scales', '6e');
    expect(problem.operation).toBe('scale-conversion');
    expect(isPromptProblem(problem)).toBe(true);
  });

  it('includes 7 new sixth-grade achievements', () => {
    const sixthGradeAchievementIds = [
      'integer_master',
      'equation_solver',
      'ratio_expert',
      'stats_complete',
      'probability_lucky',
      'circle_master',
      'sixth_grade_explorer',
    ];
    sixthGradeAchievementIds.forEach((id) => {
      expect(ACHIEVEMENTS.some((achievement) => achievement.id === id)).toBe(true);
    });
  });
});
