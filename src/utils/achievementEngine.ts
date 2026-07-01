import type { Achievement, DetailedStats, Operation, TimeMode } from '../types';
import { OPERATION_KEYS } from '../types';

const FRACTION_OPS: Operation[] = OPERATION_KEYS.filter((op) => op.startsWith('fraction-') || op.startsWith('mixed-number-'));
const DECIMAL_OPS: Operation[] = OPERATION_KEYS.filter((op) => op.startsWith('decimal-') || op === 'fraction-to-decimal' || op === 'round-decimal');
const GEOMETRY_OPS: Operation[] = [
  'perimeter-rectangle',
  'perimeter-square',
  'area-rectangle',
  'area-triangle',
  'angle-type',
];
const NUMBER_THEORY_OPS: Operation[] = ['factorization', 'gcd', 'lcm'];
const INTEGER_OPS: Operation[] = [
  'integer-addition',
  'integer-subtraction',
  'integer-multiplication',
  'integer-division',
  'integer-compare',
  'integer-order',
];
const RATIO_OPS: Operation[] = ['ratio', 'proportion'];
const STATS_EXTENDED_OPS: Operation[] = ['mean', 'median', 'mode', 'range'];
const CIRCLE_OPS: Operation[] = ['circle-area', 'circle-circumference'];
const SIXTH_GRADE_EXCLUSIVE_MODES: Operation[] = [
  'integer-addition',
  'simple-equation',
  'ratio',
  'median',
  'probability-simple',
  'circle-area',
  'scale-conversion',
];

function countCorrect(stats: DetailedStats, operations: Operation[]): number {
  return operations.reduce((total, operation) => total + (stats.operationStats[operation]?.correct ?? 0), 0);
}

function hasCorrectInEachMode(stats: DetailedStats, operations: Operation[]): boolean {
  return operations.every((operation) => (stats.operationStats[operation]?.correct ?? 0) >= 1);
}

export function evaluateAchievements(params: {
  achievement: Achievement;
  isCorrect: boolean;
  newCorrectExercises: number;
  newScore: number;
  newStreak: number;
  newLevel: number;
  stats: DetailedStats;
  timeMode: TimeMode;
  timedCorrectExercises: number;
}): boolean {
  const { achievement, isCorrect, newCorrectExercises, newScore, newStreak, newLevel, stats } = params;

  switch (achievement.id) {
    case 'first_correct':
      return isCorrect && newCorrectExercises === 1;
    case 'addition_expert':
      return stats.operationStats.addition.correct >= 10;
    case 'subtraction_expert':
      return stats.operationStats.subtraction.correct >= 10;
    case 'multiplication_expert':
      return stats.operationStats.multiplication.correct >= 10;
    case 'division_expert':
      return stats.operationStats.division.correct >= 10;
    case 'streak_5':
      return newStreak >= 5;
    case 'streak_10':
      return newStreak >= 10;
    case 'score_50':
      return newScore >= 50;
    case 'perfect_20':
      return newStreak >= 20;
    case 'fraction_master':
      return countCorrect(stats, FRACTION_OPS) >= 10;
    case 'decimal_master':
      return countCorrect(stats, DECIMAL_OPS) >= 10;
    case 'word_problem_solver':
      return stats.operationStats['word-problem'].correct >= 10;
    case 'geometry_guru':
      return countCorrect(stats, GEOMETRY_OPS) >= 10;
    case 'percentage_pro':
      return stats.operationStats.percentage.correct >= 10;
    case 'estimation_eye':
      return stats.operationStats.estimation.correct >= 10;
    case 'number_theory_fan':
      return countCorrect(stats, NUMBER_THEORY_OPS) >= 10;
    case 'mixed_ops_hero':
      return stats.operationStats.mixed.correct >= 10;
    case 'streak_25':
      return newStreak >= 25;
    case 'level_10':
      return newLevel >= 10;
    case 'speed_demon':
      return params.timedCorrectExercises >= 10;
    case 'all_modes_explorer':
      return hasExploredAllFifthGradeModes(stats);
    case 'integer_master':
      return countCorrect(stats, INTEGER_OPS) >= 10;
    case 'equation_solver':
      return stats.operationStats['simple-equation'].correct >= 10;
    case 'ratio_expert':
      return countCorrect(stats, RATIO_OPS) >= 10;
    case 'stats_complete':
      return hasCorrectInEachMode(stats, STATS_EXTENDED_OPS);
    case 'probability_lucky':
      return stats.operationStats['probability-simple'].correct >= 10;
    case 'circle_master':
      return countCorrect(stats, CIRCLE_OPS) >= 10;
    case 'sixth_grade_explorer':
      return hasCorrectInEachMode(stats, SIXTH_GRADE_EXCLUSIVE_MODES);
    default:
      return false;
  }
}

export function hasExploredAllFifthGradeModes(stats: DetailedStats): boolean {
  const fifthGradeSampleOps: Operation[] = [
    'decimal-addition',
    'word-problem',
    'percentage',
    'estimation',
    'factorization',
    'gcd',
    'mean',
    'perimeter-rectangle',
    'unit-conversion',
    'round-decimal',
    'compare-fractions',
    'mixed-number-addition',
  ];
  return hasCorrectInEachMode(stats, fifthGradeSampleOps);
}
